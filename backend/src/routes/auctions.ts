import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Auction, AuctionStatus } from "../entities/Auction";
import { Lot } from "../entities/Lot";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/rbac";
import { PERMISSIONS } from "../rbac/permissions";
import { asyncHandler } from "../utils/asyncHandler";
import { moneyToCents } from "../utils/money";
import { parseDateTime } from "../utils/datetime";
import { emitAgencyDashboardAuctionAlert } from "../realtime/agencyDashboard";
import { validateTimelineForAgency, resolvePhaseInversionForAgency } from "../services/procurement";
import { enqueuePncpPublication } from "../services/pncp";
import { Agency } from "../entities/Agency";
import { User } from "../entities/User";
import { getIo } from "../realtime/io";
import { roomAuction } from "../realtime/rooms";
import { emitPublicStats } from "./publicStats";

export const auctionsRouter = Router();

auctionsRouter.get("/", asyncHandler(async (_req, res) => {
  const auctions = await AppDataSource.getRepository(Auction).find({ order: { createdAt: "DESC" } });
  return res.json({ auctions });
}));

auctionsRouter.get("/:id", asyncHandler(async (req, res) => {
  const auction = await AppDataSource.getRepository(Auction).findOne({
    where: { id: req.params.id },
    relations: ["lots"],
  });
  if (!auction) return res.status(404).json({ error: "AUCTION_NOT_FOUND" });

  const bidRepo = AppDataSource.getRepository(Lot);
  const lotsWithStats = await Promise.all(
    auction.lots.map(async (lot) => {
      const result = await AppDataSource.query(
        `SELECT COUNT(*) as "bidCount", MAX("amountCents"::bigint) as "maxBid" FROM bids WHERE "lotId" = $1`,
        [lot.id]
      );
      return {
        ...lot,
        bidCount: parseInt(result[0].bidCount, 10),
        currentMaxBidCents: result[0].maxBid ?? null,
      };
    })
  );

  return res.json({ ...auction, lots: lotsWithStats });
}));

auctionsRouter.post(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.AUCTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return res.status(400).json({ error: "TITLE_REQUIRED" });

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.auth!.userId }, relations: ["agency"] });

    const phaseInversion = resolvePhaseInversionForAgency(user?.agency ?? ({} as Agency), body.phaseInversionEnabled ?? null);

    const auction = AppDataSource.getRepository(Auction).create({
      title,
      description: body.description ?? null,
      status: AuctionStatus.DRAFT,
      phaseInversionEnabled: phaseInversion,
      createdByUserId: req.auth!.userId,
      modality: body.modality ?? "PREGAO",
      phase: "INTERNAL",
      disputeMode: body.disputeMode ?? "OPEN",
      judgmentCriteria: body.judgmentCriteria ?? "MENOR_PRECO",
      processNumber: body.processNumber ?? null,
      editalNumber: body.editalNumber ?? null,
      agencyId: user?.agencyId ?? null,
      estimatedValueCents: body.estimatedValue ? (parseFloat(body.estimatedValue) * 100).toFixed(0) : null,
      hiddenValue: body.hiddenValue ?? false,
      legalFrameworkSnapshot: user?.agency
        ? { legalFramework: user.agency.legalFramework, entityType: user.agency.entityType }
        : null,
    });
    await AppDataSource.getRepository(Auction).save(auction);
    void emitPublicStats();
    return res.status(201).json(auction);
  })
);

auctionsRouter.post(
  "/:id/lots",
  requireAuth,
  requirePermission(PERMISSIONS.AUCTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const auction = await AppDataSource.getRepository(Auction).findOne({ where: { id: req.params.id } });
    if (!auction) return res.status(404).json({ error: "AUCTION_NOT_FOUND" });

    const body = req.body ?? {};
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return res.status(400).json({ error: "TITLE_REQUIRED" });

    const startingPriceCents = moneyToCents(body.startingPrice);
    if (startingPriceCents === null || startingPriceCents <= 0n) {
      return res.status(400).json({ error: "INVALID_PRICE" });
    }
    const minIncrementCents = moneyToCents(body.minIncrement) ?? 1n;

    const lot = AppDataSource.getRepository(Lot).create({
      auctionId: auction.id,
      title,
      description: body.description ?? null,
      startingPriceCents: startingPriceCents.toString(),
      minIncrementCents: minIncrementCents.toString(),
    });
    await AppDataSource.getRepository(Lot).save(lot);
    return res.status(201).json(lot);
  })
);

auctionsRouter.post(
  "/:id/open",
  requireAuth,
  requirePermission(PERMISSIONS.AUCTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const auctionRepo = AppDataSource.getRepository(Auction);
    const auction = await auctionRepo.findOne({ where: { id: req.params.id }, relations: ["lots"] });
    if (!auction) return res.status(404).json({ error: "AUCTION_NOT_FOUND" });
    if (auction.status !== AuctionStatus.DRAFT) return res.status(409).json({ error: "INVALID_STATUS" });
    if (auction.lots.length === 0) return res.status(400).json({ error: "NO_LOTS" });

    const body = req.body ?? {};
    const endsAt = parseDateTime(body.endsAt);
    if (!endsAt || endsAt.getTime() <= Date.now()) return res.status(400).json({ error: "INVALID_ENDS_AT" });

    const startsAt = body.startsAt ? parseDateTime(body.startsAt) : null;
    const now = new Date();
    const isScheduled = startsAt && startsAt.getTime() > now.getTime();

    auction.endsAt = endsAt;
    auction.startsAt = startsAt ?? now;
    auction.status = isScheduled ? AuctionStatus.SCHEDULED : AuctionStatus.OPEN;
    await auctionRepo.save(auction);

    await emitAgencyDashboardAuctionAlert(auction, isScheduled ? "MANUAL_SCHEDULED" : "MANUAL_OPENED");
    getIo().to(roomAuction(auction.id)).emit("auction:statusChanged", { auctionId: auction.id, status: auction.status });
    void emitPublicStats();

    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: req.auth!.userId },
      relations: ["agency"],
    });
    if (user?.agencyId) await enqueuePncpPublication(auction, user.agencyId);

    return res.json(auction);
  })
);

auctionsRouter.patch(
  "/:id/phase",
  requireAuth,
  requirePermission(PERMISSIONS.AUCTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const validPhases = ["INTERNAL", "PUBLISHED", "PROPOSALS", "CLASSIFICATION", "SESSION", "QUALIFICATION", "DECISION", "CONTRACT", "CLOSED"];
    const { phase } = req.body ?? {};
    if (!validPhases.includes(phase)) return res.status(400).json({ error: "INVALID_PHASE" });
    const auctionRepo = AppDataSource.getRepository(Auction);
    const auction = await auctionRepo.findOne({ where: { id: req.params.id } });
    if (!auction) return res.status(404).json({ error: "AUCTION_NOT_FOUND" });
    auction.phase = phase;
    await auctionRepo.save(auction);
    getIo().to(roomAuction(auction.id)).emit("auction:phaseChanged", { auctionId: auction.id, phase });
    return res.json(auction);
  })
);

auctionsRouter.post(
  "/:id/close",
  requireAuth,
  requirePermission(PERMISSIONS.AUCTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const auctionRepo = AppDataSource.getRepository(Auction);
    const auction = await auctionRepo.findOne({ where: { id: req.params.id } });
    if (!auction) return res.status(404).json({ error: "AUCTION_NOT_FOUND" });
    if (auction.status === AuctionStatus.CLOSED || auction.status === AuctionStatus.DRAFT) {
      return res.status(409).json({ error: "INVALID_STATUS" });
    }
    auction.status = AuctionStatus.CLOSED;
    auction.endsAt = new Date();
    await auctionRepo.save(auction);
    await emitAgencyDashboardAuctionAlert(auction, "CLOSED");
    getIo().to(roomAuction(auction.id)).emit("auction:statusChanged", { auctionId: auction.id, status: AuctionStatus.CLOSED });
    void emitPublicStats();
    return res.json(auction);
  })
);
