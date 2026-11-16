// Parsers for EXPO_PUBLIC_* values, shared by config/index.ts and the
// plugins' settings files. Each falls back when the value is unset or invalid.

export const finiteNumber = (value: string | undefined, fallback: number): number => {
  const n = parseFloat(value ?? '');
  return Number.isFinite(n) ? n : fallback;
};

export const nonNegativeInt = (value: string | undefined, fallback: number): number => {
  const n = parseInt(value ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

// Comma-separated list, trimmed, empty items dropped.
export const csv = (value: string | undefined, fallback: string[]): string[] => {
  const items = (value ?? '').split(',').map(s => s.trim()).filter(Boolean);
  return items.length ? items : fallback;
};
