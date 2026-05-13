import { randomBytes } from "crypto";
import { env } from "../config/env";
import { getSessionRedis } from "./session-store";

export type SessionData = { userId: string; createdAt: string };

function key(sid: string) { return `sess:${sid}`; }
function userSessionsKey(userId: string) { return `user_sessions:${userId}`; }

export async function createSession(userId: string): Promise<string> {
  const sid = randomBytes(32).toString("hex");
  const redis = await getSessionRedis();
  const multi = redis.multi();
  multi.set(key(sid), JSON.stringify({ userId, createdAt: new Date().toISOString() }), { EX: env.session.ttlSeconds });
  multi.sAdd(userSessionsKey(userId), sid);
  multi.expire(userSessionsKey(userId), env.session.ttlSeconds);
  await multi.exec();
  return sid;
}

export async function getSession(sid: string): Promise<SessionData | null> {
  const redis = await getSessionRedis();
  const raw = await redis.get(key(sid));
  if (!raw) return null;
  try { return JSON.parse(raw) as SessionData; } catch { return null; }
}

export async function deleteSession(sid: string): Promise<void> {
  const redis = await getSessionRedis();
  const raw = await redis.get(key(sid));
  const multi = redis.multi();
  multi.del(key(sid));
  if (raw) {
    try {
      const data = JSON.parse(raw) as SessionData;
      multi.sRem(userSessionsKey(data.userId), sid);
    } catch { /* ignore */ }
  }
  await multi.exec();
}

export async function deleteAllSessionsForUser(userId: string): Promise<void> {
  const redis = await getSessionRedis();
  const sids = await redis.sMembers(userSessionsKey(userId));
  if (sids.length === 0) return;
  const multi = redis.multi();
  for (const sid of sids) multi.del(key(sid));
  multi.del(userSessionsKey(userId));
  await multi.exec();
}
