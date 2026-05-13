import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Proposal, ProposalStatus } from "../entities/Proposal";
import { Auction, AuctionStatus } from "../entities/Auction";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { moneyToCents } from "../utils/money";

export const proposalsRouter = Router();

// List proposals for the authenticated supplier
proposalsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const proposals = await AppDataSource.getRepository(Proposal).find({
      where: { userId: req.auth!.userId },
      relations: ["auction", "lot"],
      order: { createdAt: "DESC" },
    });
    return res.json({ proposals });
  })
);

// Get proposals for a specific auction (supplier sees their own)
proposalsRouter.get(
  "/auction/:auctionId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const proposals = await AppDataSource.getRepository(Proposal).find({
      where: { auctionId: req.params.auctionId, userId: req.auth!.userId },
      relations: ["lot"],
      order: { createdAt: "DESC" },
    });
    return res.json({ proposals });
  })
);

// Create or update proposal draft
proposalsRouter.post(
  "/auction/:auctionId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auction = await AppDataSource.getRepository(Auction).findOne({
      where: { id: req.params.auctionId },
    });
    if (!auction) return res.status(404).json({ error: "AUCTION_NOT_FOUND" });
    if (auction.status === AuctionStatus.CLOSED) {
      return res.status(409).json({ error: "AUCTION_CLOSED" });
    }

    const body = req.body ?? {};

    const existing = await AppDataSource.getRepository(Proposal).findOne({
      where: {
        auctionId: req.params.auctionId,
        userId: req.auth!.userId,
        lotId: body.lotId ?? null,
      },
    });

    const amountCents = body.amountCents ? moneyToCents(body.amountCents) : null;

    if (existing) {
      existing.brand = body.brand ?? existing.brand;
      existing.manufacturer = body.manufacturer ?? existing.manufacturer;
      existing.model = body.model ?? existing.model;
      existing.description = body.description ?? existing.description;
      existing.declarations = body.declarations ?? existing.declarations;
      if (amountCents !== null) existing.amountCents = amountCents.toString();
      await AppDataSource.getRepository(Proposal).save(existing);
      return res.json(existing);
    }

    const proposal = AppDataSource.getRepository(Proposal).create({
      auctionId: req.params.auctionId,
      lotId: body.lotId ?? null,
      userId: req.auth!.userId,
      amountCents: amountCents?.toString() ?? null,
      brand: body.brand ?? null,
      manufacturer: body.manufacturer ?? null,
      model: body.model ?? null,
      description: body.description ?? null,
      declarations: body.declarations ?? null,
      status: ProposalStatus.DRAFT,
    });
    await AppDataSource.getRepository(Proposal).save(proposal);
    return res.status(201).json(proposal);
  })
);

// Submit (finalize) a proposal
proposalsRouter.post(
  "/:id/submit",
  requireAuth,
  asyncHandler(async (req, res) => {
    const proposal = await AppDataSource.getRepository(Proposal).findOne({
      where: { id: req.params.id, userId: req.auth!.userId },
      relations: ["auction"],
    });
    if (!proposal) return res.status(404).json({ error: "PROPOSAL_NOT_FOUND" });
    if (proposal.auction.status === AuctionStatus.CLOSED) {
      return res.status(409).json({ error: "AUCTION_CLOSED" });
    }
    if (!proposal.amountCents || BigInt(proposal.amountCents) <= 0n) {
      return res.status(400).json({ error: "AMOUNT_REQUIRED" });
    }

    proposal.status = ProposalStatus.SUBMITTED;
    proposal.submittedAt = new Date();
    await AppDataSource.getRepository(Proposal).save(proposal);
    return res.json(proposal);
  })
);

// Delete (withdraw) a proposal
proposalsRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const proposal = await AppDataSource.getRepository(Proposal).findOne({
      where: { id: req.params.id, userId: req.auth!.userId },
    });
    if (!proposal) return res.status(404).json({ error: "PROPOSAL_NOT_FOUND" });
    if (proposal.status === ProposalStatus.WINNER) {
      return res.status(409).json({ error: "CANNOT_DELETE_WINNER" });
    }
    await AppDataSource.getRepository(Proposal).remove(proposal);
    return res.json({ ok: true });
  })
);
