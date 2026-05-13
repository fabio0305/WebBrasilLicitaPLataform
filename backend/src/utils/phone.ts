export function normalizePhone(value: string): string { return value.replace(/\D/g, "").slice(0, 11); }
export function isValidPhone(value: string): boolean {
  const p = normalizePhone(value);
  return (p.length === 10 || p.length === 11) && !/^(\d)\1+$/.test(p);
}
