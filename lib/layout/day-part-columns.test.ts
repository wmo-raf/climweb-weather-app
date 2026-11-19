import {
  DAY_PART_MIN_CARD_WIDTH_2_COLUMNS,
  DAY_PART_MIN_CARD_WIDTH_4_COLUMNS,
  dayPartCardWidth,
  dayPartColumns,
} from './day-part-columns';

const GAP = 16; // Spacing.lg

// Section width at which each card gets exactly `perCard` with `columns` across.
const widthFor = (perCard: number, columns: number) => perCard * columns + (columns - 1) * GAP;

describe('dayPartColumns', () => {
  test('wide: 4 across', () => {
    expect(dayPartColumns(700, GAP)).toBe(4); // iPad 13" landscape right column (~692)
    expect(dayPartColumns(1000, GAP)).toBe(4);
  });

  test('iPad portrait right column (~380pt): 2 × 2', () => {
    expect(dayPartColumns(378, GAP)).toBe(2); // iPad 10th gen
    expect(dayPartColumns(335, GAP)).toBe(2); // iPad mini
    expect(dayPartColumns(497, GAP)).toBe(2); // iPad 13" portrait
  });

  test('phones: 2 across', () => {
    expect(dayPartColumns(328, GAP)).toBe(2); // 360pt phone
    expect(dayPartColumns(380, GAP)).toBe(2); // 412pt phone
  });

  test('narrow: 1 column', () => {
    expect(dayPartColumns(240, GAP)).toBe(1);
    expect(dayPartColumns(0, GAP)).toBe(1);
  });

  test('200% text: 1 column on phones and iPad portrait', () => {
    expect(dayPartColumns(328, GAP, 2)).toBe(1);
    expect(dayPartColumns(378, GAP, 2)).toBe(1);
  });

  test('200% text on a wide section: 2 across, never 4', () => {
    expect(dayPartColumns(700, GAP, 2)).toBe(2);
  });

  test('exactly at the 4-column threshold', () => {
    const at = widthFor(DAY_PART_MIN_CARD_WIDTH_4_COLUMNS, 4);
    expect(dayPartColumns(at, GAP)).toBe(4);
    expect(dayPartColumns(at - 0.1, GAP)).toBe(2);
  });

  test('exactly at the 2-column threshold', () => {
    const at = widthFor(DAY_PART_MIN_CARD_WIDTH_2_COLUMNS, 2);
    expect(dayPartColumns(at, GAP)).toBe(2);
    expect(dayPartColumns(at - 0.1, GAP)).toBe(1);
  });

  test('thresholds scale with the text size', () => {
    const at = widthFor(DAY_PART_MIN_CARD_WIDTH_2_COLUMNS * 1.5, 2);
    expect(dayPartColumns(at, GAP, 1.5)).toBe(2);
    expect(dayPartColumns(at - 0.1, GAP, 1.5)).toBe(1);
  });

  test('ignores a bad text scale', () => {
    expect(dayPartColumns(378, GAP, 0)).toBe(2);
    expect(dayPartColumns(378, GAP, NaN)).toBe(2);
  });
});

describe('dayPartCardWidth', () => {
  test('shares the width minus the gaps, in whole points', () => {
    expect(dayPartCardWidth(378, GAP, 2)).toBe(180);
    expect(dayPartCardWidth(700, GAP, 4)).toBe(162);
    expect(dayPartCardWidth(300, GAP, 1)).toBe(299);
  });

  // onLayout's width is pixel-rounded; the real width can be up to half a
  // physical pixel less. The row must still fit, or the cards stack.
  test.each([
    [378, 2], [377.67, 2], [335, 2], [497.33, 2], [700, 4], [688, 4], [328, 2], [380, 2],
  ] as const)('a row fits a reported %d even if the real width is half a pixel less (%d across)', (reported, columns) => {
    const realWidth = reported - 0.5 / 3;
    expect(dayPartColumns(reported, GAP)).toBe(columns);
    expect(dayPartCardWidth(reported, GAP, columns) * columns + (columns - 1) * GAP).toBeLessThanOrEqual(realWidth);
  });
});
