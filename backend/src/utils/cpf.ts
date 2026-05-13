export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function isValidCpf(cpf: string): boolean {
  const v = normalizeCpf(cpf);
  if (v.length !== 11) return false;
  if (/^(\d)\1+$/.test(v)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(v[i]!) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(v[9]!)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(v[i]!) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  return rem === parseInt(v[10]!);
}

export function buildSyntheticEmailForCpf(cpf: string): string {
  return `cpf-${normalizeCpf(cpf)}@invalid.local`;
}
