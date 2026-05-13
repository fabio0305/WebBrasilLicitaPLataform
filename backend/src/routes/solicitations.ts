import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Solicitation, SolicitationStatus, SolicitationType } from "../entities/Solicitation";
import { Auction } from "../entities/Auction";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/rbac";
import { PERMISSIONS } from "../rbac/permissions";
import { asyncHandler } from "../utils/asyncHandler";

export const solicitationsRouter = Router();

const VALID_TYPES = Object.values(SolicitationType) as string[];

// List solicitations for an auction (public read)
solicitationsRouter.get(
  "/auction/:auctionId",
  asyncHandler(async (req, res) => {
    const solicitations = await AppDataSource.getRepository(Solicitation).find({
      where: { auctionId: req.params.auctionId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
    return res.json({ solicitations: solicitations.map((s) => ({
      ...s,
      user: s.user ? { id: s.user.id, name: s.user.name } : null,
    })) });
  })
);

// List my solicitations
solicitationsRouter.get(
  "/mine",
  requireAuth,
  asyncHandler(async (req, res) => {
    const solicitations = await AppDataSource.getRepository(Solicitation).find({
      where: { userId: req.auth!.userId },
      relations: ["auction"],
      order: { createdAt: "DESC" },
    });
    return res.json({ solicitations });
  })
);

// Submit a solicitation
solicitationsRouter.post(
  "/auction/:auctionId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auction = await AppDataSource.getRepository(Auction).findOne({
      where: { id: req.params.auctionId },
    });
    if (!auction) return res.status(404).json({ error: "AUCTION_NOT_FOUND" });

    const body = req.body ?? {};
    if (!VALID_TYPES.includes(body.type)) {
      return res.status(400).json({ error: "INVALID_TYPE" });
    }
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!subject || !content) {
      return res.status(400).json({ error: "SUBJECT_AND_CONTENT_REQUIRED" });
    }

    const solicitation = AppDataSource.getRepository(Solicitation).create({
      auctionId: req.params.auctionId,
      userId: req.auth!.userId,
      type: body.type,
      subject,
      content,
      status: SolicitationStatus.PENDING,
    });
    await AppDataSource.getRepository(Solicitation).save(solicitation);
    return res.status(201).json(solicitation);
  })
);

// Answer a solicitation (auctioneer/admin)
solicitationsRouter.patch(
  "/:id/answer",
  requireAuth,
  requirePermission(PERMISSIONS.AUCTIONS_WRITE),
  asyncHandler(async (req, res) => {
    const solicitation = await AppDataSource.getRepository(Solicitation).findOne({
      where: { id: req.params.id },
    });
    if (!solicitation) return res.status(404).json({ error: "SOLICITATION_NOT_FOUND" });

    const body = req.body ?? {};
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    const status = body.status === "REJECTED" ? SolicitationStatus.REJECTED : SolicitationStatus.ANSWERED;

    solicitation.answer = answer || null;
    solicitation.status = status;
    solicitation.answeredAt = new Date();
    solicitation.answeredByUserId = req.auth!.userId;
    await AppDataSource.getRepository(Solicitation).save(solicitation);
    return res.json(solicitation);
  })
);
