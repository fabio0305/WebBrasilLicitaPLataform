export function moneyToCents(input: unknown): bigint | null {
  if (typeof input === "number" && Number.isFinite(input)) return moneyToCents(input.toFixed(2));
  if (typeof input !== "string") return null;
  const s = input.trim().replace(",", ".");
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(s)) return null;
  const [intPart, decPartRaw] = s.split(".");
  const decPart = (decPartRaw ?? "").padEnd(2, "0").slice(0, 2);
  try { return BigInt(`${intPart}${decPart}`); } catch { return null; }
}

export function centsToMoneyString(cents: string | bigint): string {
  const v = typeof cents === "bigint" ? cents : BigInt(cents);
  const sign = v < 0n ? "-" : "";
  const abs = v < 0n ? -v : v;
  return `${sign}${abs / 100n}.${(abs % 100n).toString().padStart(2, "0")}`;
}
