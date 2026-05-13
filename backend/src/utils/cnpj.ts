export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

function computeCheckDigit(cnpj: string, length: number): number {
  const weights = length === 12
    ? [5,4,3,2,9,8,7,6,5,4,3,2]
    : [6,5,4,3,2,9,8,7,6,5,4,3,2];
  let sum = 0;
  for (let i = 0; i < length; i++) sum += parseInt(cnpj[i]!) * weights[i]!;
  const rem = sum % 11;
  return rem < 2 ? 0 : 11 - rem;
}

export function isValidCnpj(cnpj: string): boolean {
  const v = normalizeCnpj(cnpj);
  if (v.length !== 14) return false;
  if (/^(\d)\1+$/.test(v)) return false;
  return computeCheckDigit(v, 12) === parseInt(v[12]!) &&
         computeCheckDigit(v, 13) === parseInt(v[13]!);
}
