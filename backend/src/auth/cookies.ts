import type { Request } from "express";
export function getCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const parts = header.split(";").map((p) => p.trim()).filter(Boolean);
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx < 0) continue;
    const k = decodeURIComponent(p.slice(0, idx).trim());
    if (k !== name) continue;
    return decodeURIComponent(p.slice(idx + 1).trim());
  }
  return undefined;
}
