import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Notification } from "../entities/Notification";
import { NotificationReply } from "../entities/NotificationReply";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

// List notifications for the current user, including their reply (if any)
notificationsRouter.get("/", asyncHandler(async (req, res) => {
  const role = req.auth!.role;
  const userId = req.auth!.userId;

  const rows = await AppDataSource.query<Record<string, unknown>[]>(`
    SELECT
      n.id, n.title, n.message, n.category,
      n."targetRole", n."targetUserId", n."createdAt",
      r.id        AS "myReplyId",
      r.message   AS "myReplyMessage",
      r."createdAt" AS "myReplyAt"
    FROM notifications n
    LEFT JOIN notification_replies r
      ON r."notificationId" = n.id AND r."userId" = $1
    WHERE
      n."targetRole" = 'ALL'
      OR n."targetRole" = $2
      OR (n."targetRole" = 'USER' AND n."targetUserId" = $1)
    ORDER BY n."createdAt" DESC
    LIMIT 50
  `, [userId, role]);

  return res.json({ notifications: rows });
}));

// Post a one-time reply to a notification
notificationsRouter.post("/:id/reply", asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;
  const { id } = req.params;
  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) return res.status(400).json({ error: "MESSAGE_REQUIRED" });

  // Verify the notification exists and targets this user
  const role = req.auth!.role;
  const notif = await AppDataSource.getRepository(Notification).findOne({ where: { id } });
  if (!notif) return res.status(404).json({ error: "NOT_FOUND" });

  const isTargeted =
    notif.targetRole === "ALL" ||
    notif.targetRole === role ||
    (notif.targetRole === "USER" && notif.targetUserId === userId);
  if (!isTargeted) return res.status(403).json({ error: "FORBIDDEN" });

  // Check if already replied (unique constraint will also catch this)
  const existing = await AppDataSource.getRepository(NotificationReply).findOne({
    where: { notificationId: id, userId },
  });
  if (existing) return res.status(409).json({ error: "ALREADY_REPLIED" });

  const reply = AppDataSource.getRepository(NotificationReply).create({
    notificationId: id,
    userId,
    message,
  });
  await AppDataSource.getRepository(NotificationReply).save(reply);
  return res.status(201).json(reply);
}));
