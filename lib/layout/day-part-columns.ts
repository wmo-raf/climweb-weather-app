// How many day-part cards fit across, from the width the section actually
// has (measured with onLayout), not the screen width. On an iPad in portrait
// the Today grid sits in the right-hand column, which is only ~380pt wide.

// Narrowest card that still fits its content on one line per row: name,
// "20°C" beside a 48pt icon, condition. In points at 100% text size.
export const DAY_PART_MIN_CARD_WIDTH_4_COLUMNS = 160;
export const DAY_PART_MIN_CARD_WIDTH_2_COLUMNS = 120;

export type DayPartColumns = 1 | 2 | 4;

// onLayout reports a width rounded to the pixel grid, but the row wraps
// against the unrounded width, which can be a fraction of a point less.
// Cards that add up to exactly the reported width then overflow and each
// drops to its own row. Leaving this much unused keeps them on one row.
const SUBPIXEL_SLACK = 1;

// Each card's share of the width: what the column choice is based on.
const shareOf = (width: number, gap: number, columns: number) => (width - (columns - 1) * gap) / columns;

// Width to give each card when `columns` share `width` with `gap` between
// them: whole points, with the slack above, so the row never overflows.
export function dayPartCardWidth(width: number, gap: number, columns: DayPartColumns): number {
  return Math.max(0, Math.floor(shareOf(width - SUBPIXEL_SLACK, gap, columns)));
}

// 4 across when each card gets at least 160pt, else 2 when each gets at
// least 120pt, else 1. Text grows with the system text size but the width
// doesn't, so both minimums scale by `fontScale` (2 at 200% text).
export function dayPartColumns(width: number, gap: number, fontScale = 1): DayPartColumns {
  const scale = Number.isFinite(fontScale) && fontScale > 0 ? fontScale : 1;
  if (shareOf(width, gap, 4) >= DAY_PART_MIN_CARD_WIDTH_4_COLUMNS * scale) return 4;
  if (shareOf(width, gap, 2) >= DAY_PART_MIN_CARD_WIDTH_2_COLUMNS * scale) return 2;
  return 1;
}
