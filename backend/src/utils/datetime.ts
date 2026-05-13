export function parseDateTime(input: unknown): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input !== "string") return null;
  const d = new Date(input.trim());
  return isNaN(d.getTime()) ? null : d;
}

export function toIsoOrNull(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}
