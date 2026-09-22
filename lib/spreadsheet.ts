const FORMULA_PREFIX = /^[\s]*[=+\-@]/;

export function safeSpreadsheetValue(value: unknown) {
  const normalized = String(value ?? "");
  return FORMULA_PREFIX.test(normalized) ? `'${normalized}` : normalized;
}

export function escapeCsvValue(value: unknown) {
  return `"${safeSpreadsheetValue(value).replaceAll('"', '""')}"`;
}