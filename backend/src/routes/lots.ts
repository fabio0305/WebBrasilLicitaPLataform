import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Auction, AuctionStatus } from "../entities/Auction";
import { Bid } from "../entities/Bid";
import { Lot } from "../entities/Lot";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/rbac";
import { PERMISSIONS } from "../rbac/permissions";
import { asyncHandler } from "../utils/asyncHandler";
import { moneyToCents } from "../utils/money";
import { getIo } from "../realtime/io";
import { roomLot, roomAuction } from "../realtime/rooms";
import { emitAgencyDashboardAuctionAlert } from "../realtime/agencyDashboard";
import { env } from "../config/env";

export const lotsRouter = Router();

lotsRouter.get("/:lotId", asyncHandler(async (req, res) => {
  const lot = await AppDataSource.getRepository(Lot).findOne({ where: { id: req.params.lotId }, relations: ["auction"] });
  if (!lot) return res.status(404).json({ error: "LOT_NOT_FOUND" });
  const result = await AppDataSource.query(
    `SELECT COUNT(*) as "bidCount", MAX("amountCents"::bigint) as "maxBid" FROM bids WHERE "lotId" = $1`,
    [lot.id]
  );
  return res.json({ ...lot, bidCount: parseInt(result[0].bidCount, 10), currentMaxBidCents: result[0].maxBid ?? null });
}));

lotsRouter.get("/:lotId/bids", asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? "20"), 10)));
  const bids = await AppDataSource.getRepository(Bid).find({
    where: { lotId: req.params.lotId },
    order: { createdAt: "DESC" },
    take: limit,
  });
  return res.json({ bids });
}));

lotsRouter.post(
  "/:lotId/bids",
  requireAuth,
  requirePermission(PERMISSIONS.BIDS_PLACE),
  asyncHandler(async (req, res) => {
    const { lotId } = req.params;
    const body = req.body ?? {};
    const amountCents = moneyToCents(body.amount);
    if (amountCents === null || amountCents <= 0n) return res.status(400).json({ error: "INVALID_AMOUNT" });

    return AppDataSource.transaction(async (em) => {
      const lot = await em.getRepository(Lot).findOne({
        where: { id: lotId },
        lock: { mode: "pessimistic_write" },
        relations: ["auction"],
      });
      if (!lot) return res.status(404).json({ error: "LOT_NOT_FOUND" });

      const auction = await em.getRepository(Auction).findOne({
        where: { id: lot.auctionId },
        lock: { mode: "pessimistic_write" },
      });
      if (!auction) return res.status(404).json({ error: "AUCTION_NOT_FOUND" });

      const now = new Date();

      // Auto-open scheduled auctions
      if (auction.status === AuctionStatus.SCHEDULED && auction.startsAt && auction.startsAt <= now) {
        auction.status = AuctionStatus.OPEN;
        await em.getRepository(Auction).save(auction);
        await emitAgencyDashboardAuctionAlert(auction, "AUTO_OPENED");
        getIo().to(roomAuction(auction.id)).emit("auction:statusChanged", { auctionId: auction.id, status: AuctionStatus.OPEN });
      }

      if (auction.status !== AuctionStatus.OPEN) return res.status(409).json({ error: "AUCTION_NOT_OPEN" });
      if (auction.endsAt && auction.endsAt <= now) return res.status(409).json({ error: "AUCTION_CLOSED" });

      const maxBidResult = await AppDataSource.query(
        `SELECT MAX("amountCents"::bigint) as "maxBid" FROM bids WHERE "lotId" = $1`,
        [lotId]
      );
      const currentMaxBid: bigint = maxBidResult[0].maxBid ? BigInt(maxBidResult[0].maxBid) : 0n;
      const startingPrice = BigInt(lot.startingPriceCents);
      const minIncrement = BigInt(lot.minIncrementCents);
      const minValid = currentMaxBid === 0n ? startingPrice : currentMaxBid + minIncrement;

      if (amountCents < minValid) {
        return res.status(422).json({
          error: "BID_TOO_LOW",
          minValidCents: minValid.toString(),
        });
      }

      const bid = em.getRepository(Bid).create({
        lotId,
        userId: req.auth!.userId,
        amountCents: amountCents.toString(),
      });
      await em.getRepository(Bid).save(bid);

      // Anti-sniping: extend if within window
      if (auction.endsAt) {
        const timeLeft = auction.endsAt.getTime() - now.getTime();
        if (timeLeft < env.auction.antiSnipingWindowMs) {
          auction.endsAt = new Date(auction.endsAt.getTime() + env.auction.antiSnipingExtensionMs);
          await em.getRepository(Auction).save(auction);
          await emitAgencyDashboardAuctionAlert(auction, "ANTI_SNIPING");
          getIo().to(roomAuction(auction.id)).emit("auction:extended", { auctionId: auction.id, endsAt: auction.endsAt });
        }
      }

      getIo().to(roomLot(lotId)).emit("bid:new", {
        bidId: bid.id,
        lotId,
        amountCents: bid.amountCents,
        userId: bid.userId,
        createdAt: bid.createdAt,
      });

      return res.status(201).json(bid);
    });
  })
);
