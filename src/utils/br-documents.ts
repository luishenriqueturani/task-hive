/** CPF: só dígitos. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * CNPJ sem máscara: 14 caracteres A-Z/0-9 em maiúsculas.
 * IN RFB nº 2.229/2024 — as 12 primeiras posições podem ter letras;
 * os 2 dígitos verificadores continuam numéricos.
 */
export function normalizeCnpj(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 14);
}

function allSameChar(value: string): boolean {
  return value.length > 0 && /^([A-Z0-9])\1+$/.test(value);
}

/** Valor para o módulo 11: código ASCII − 48 (dígito '0'→0, letra 'A'→17). */
function cnpjCharValue(char: string): number {
  return char.charCodeAt(0) - 48;
}

function mod11CheckDigit(values: number[], weights: number[]): number {
  const sum = values.reduce(
    (acc, value, i) => acc + value * (weights[i] ?? 0),
    0,
  );
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11 || allSameChar(d)) return false;
  const values = d.split('').map(cnpjCharValue);
  const d1 = mod11CheckDigit(values.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = mod11CheckDigit(values.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[9]) && d2 === Number(d[10]);
}

export function isValidCnpj(value: string): boolean {
  const d = normalizeCnpj(value);
  if (d.length !== 14) return false;
  if (!/^[A-Z0-9]{12}\d{2}$/.test(d)) return false;
  if (allSameChar(d) || /^0{12}/.test(d)) return false;
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const values = d.split('').map(cnpjCharValue);
  const d1 = mod11CheckDigit(values.slice(0, 12), w1);
  const d2 = mod11CheckDigit(values.slice(0, 13), w2);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}
