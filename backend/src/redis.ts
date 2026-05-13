import { createClient } from "redis";
import { env } from "./config/env";
export function createRedisClient() {
  const url = `redis://${env.redis.host}:${env.redis.port}`;
  return createClient({ url });
}
