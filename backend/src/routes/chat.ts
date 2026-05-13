import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ChatMessage, ChatMessageType } from "../entities/ChatMessage";
import { User, UserRole } from "../entities/User";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { getIo } from "../realtime/io";
import { roomAuction } from "../realtime/rooms";

export const chatRouter = Router();

// Get last 100 chat messages for an auction
chatRouter.get(
  "/auction/:auctionId",
  asyncHandler(async (req, res) => {
    const messages = await AppDataSource.getRepository(ChatMessage).find({
      where: { auctionId: req.params.auctionId },
      order: { createdAt: "ASC" },
      take: 100,
    });
    return res.json({ messages });
  })
);

// Post a chat message
chatRouter.post(
  "/auction/:auctionId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) return res.status(400).json({ error: "CONTENT_REQUIRED" });
    if (content.length > 500) return res.status(400).json({ error: "TOO_LONG" });

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: req.auth!.userId } });
    if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const canBeAuctioneer = [UserRole.ADMIN, UserRole.AUCTIONEER, UserRole.AGENCY_ADMIN].includes(user.role as UserRole);
    const type = body.type === ChatMessageType.AUCTIONEER && canBeAuctioneer
      ? ChatMessageType.AUCTIONEER
      : ChatMessageType.USER;

    const msg = AppDataSource.getRepository(ChatMessage).create({
      auctionId: req.params.auctionId,
      userId: req.auth!.userId,
      senderName: user.name,
      type,
      content,
    });
    await AppDataSource.getRepository(ChatMessage).save(msg);

    getIo().to(roomAuction(req.params.auctionId)).emit("chat:message", msg);

    return res.status(201).json(msg);
  })
);
