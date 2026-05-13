import { createClient } from "redis";
import { env } from "../config/env";

export type SessionRedisClient = ReturnType<typeof createClient>;

let client: SessionRedisClient | null = null;
let connecting: Promise<SessionRedisClient> | null = null;

export async function getSessionRedis(): Promise<SessionRedisClient> {
  if (client) return client;
  if (connecting) return connecting;
  connecting = (async () => {
    const url = `redis://${env.redis.host}:${env.redis.port}`;
    const c = createClient({ url });
    await c.connect();
    client = c;
    return c;
  })();
  return connecting;
}
