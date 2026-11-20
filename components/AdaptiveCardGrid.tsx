import React, { JSX, ReactNode, useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';

import { DayPartColumns, dayPartCardWidth, dayPartColumns } from '@/lib/layout/day-part-columns';
import { Spacing } from '@/lib/theme';

type AdaptiveCardGridProps = {
  count: number;
  // Renders card `index` at `width`.
  renderCard: (index: number, width: number) => ReactNode;
  // Never more columns than cards (the day-detail screen): two cards on a
  // wide screen sit side by side at half width rather than a quarter each.
  capToCount?: boolean;
  testID?: string;
};

const GAP = Spacing.lg;

const capColumns = (columns: DayPartColumns, count: number): DayPartColumns =>
  columns > count ? (count >= 2 ? 2 : 1) : columns;

// Day-part cards in a wrapping grid. Columns (4, 2 or 1) come from the
// grid's own measured width and the text size (lib/layout/day-part-columns),
// so it fits a phone, an iPad's column, Split View and foldables. onLayout
// fires again on rotation, window resizes and fold changes. Cards render
// only once the width is known, so they never appear squeezed and then jump.
function AdaptiveCardGrid({ count, renderCard, capToCount = false, testID }: AdaptiveCardGridProps): JSX.Element {
  // Only the text size; the width is measured below, not taken from the window.
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState<number>();

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    setWidth(previous => (previous !== undefined && Math.abs(previous - measured) < 0.5 ? previous : measured));
  }, []);

  let cardWidth: number | undefined;
  if (width !== undefined) {
    const fitted = dayPartColumns(width, GAP, fontScale);
    const columns = capToCount ? capColumns(fitted, count) : fitted;
    cardWidth = dayPartCardWidth(width, GAP, columns);
  }

  return (
    <View style={styles.grid} onLayout={onLayout} testID={testID}>
      {cardWidth !== undefined && Array.from({ length: count }, (_, i) => renderCard(i, cardWidth!))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Cards in a row stretch to the tallest one (alignItems defaults to stretch
  // on each wrapped line).
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});

export default AdaptiveCardGrid;
