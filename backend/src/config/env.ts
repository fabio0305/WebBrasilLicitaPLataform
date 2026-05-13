import { config } from "dotenv";
config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  app: {
    port: parseInt(optional("BACKEND_PORT", "3000"), 10),
    publicUrl: optional("APP_PUBLIC_URL", "https://licitabrasilweb.com.br"),
    corsOrigin: optional("CORS_ORIGIN", ""),
  },
  db: {
    host: required("POSTGRES_HOST"),
    port: parseInt(optional("POSTGRES_PORT", "5432"), 10),
    username: required("POSTGRES_USER"),
    password: required("POSTGRES_PASSWORD"),
    database: required("POSTGRES_DB"),
  },
  redis: {
    host: required("REDIS_HOST"),
    port: parseInt(optional("REDIS_PORT", "6379"), 10),
  },
  session: {
    cookieName: optional("SESSION_COOKIE_NAME", "lb_sid"),
    ttlSeconds: parseInt(optional("SESSION_TTL_SECONDS", "604800"), 10),
    // COOKIE_SECURE=auto → derive from APP_PUBLIC_URL (https → true, http → false)
    // COOKIE_SECURE=true/false → explicit override
    get secure(): boolean {
      const raw = process.env["COOKIE_SECURE"];
      if (raw === "true") return true;
      if (raw === "false") return false;
      const url = process.env["APP_PUBLIC_URL"] ?? "";
      return url.startsWith("https://");
    },
  },
  passwordRecovery: {
    tokenTtlSeconds: parseInt(optional("PASSWORD_RECOVERY_TOKEN_TTL_SECONDS", "1800"), 10),
  },
  admin: {
    seedEmail: process.env["ADMIN_SEED_EMAIL"] ?? null,
    seedPassword: process.env["ADMIN_SEED_PASSWORD"] ?? null,
    seedName: process.env["ADMIN_SEED_NAME"] ?? null,
  },
  pncp: {
    enabled: optional("PNCP_ENABLED", "false") === "true",
    baseUrl: optional("PNCP_BASE_URL", ""),
    bearerToken: optional("PNCP_BEARER_TOKEN", ""),
    maxAttempts: parseInt(optional("PNCP_MAX_ATTEMPTS", "5"), 10),
    baseRetryDelayMs: parseInt(optional("PNCP_BASE_RETRY_DELAY_MS", "5000"), 10),
    maxRetryDelayMs: parseInt(optional("PNCP_MAX_RETRY_DELAY_MS", "300000"), 10),
    workerIntervalMs: parseInt(optional("PNCP_WORKER_INTERVAL_MS", "30000"), 10),
  },
  smtp: {
    host: optional("SMTP_HOST", ""),
    port: parseInt(optional("SMTP_PORT", "587"), 10),
    user: optional("SMTP_USER", ""),
    pass: optional("SMTP_PASS", ""),
    from: optional("SMTP_FROM", ""),
  },
  auction: {
    autoCloseIntervalMs: parseInt(optional("AUCTION_AUTO_CLOSE_INTERVAL_MS", "30000"), 10),
    antiSnipingWindowMs: parseInt(optional("ANTI_SNIPING_WINDOW_MS", "60000"), 10),
    antiSnipingExtensionMs: parseInt(optional("ANTI_SNIPING_EXTENSION_MS", "120000"), 10),
  },
};
