import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64");
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$1$${salt}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const [, , salt, hashB64] = parts;
  try {
    const hash = (await scryptAsync(password, salt!, 64)) as Buffer;
    const stored64 = Buffer.from(hashB64!, "base64");
    return timingSafeEqual(hash, stored64);
  } catch { return false; }
}
