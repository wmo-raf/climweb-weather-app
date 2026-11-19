import React, { JSX, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import DayPartCard from './DayPartCard';
import { DAY_PARTS, DayPart, DayPartSummary } from '@/lib/forecast/day-parts';
import { dayPartCardWidth, dayPartColumns } from '@/lib/layout/day-part-columns';
import { ThemeColors, Fonts, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

type DayPartsGridProps = {
  dayParts: Partial<Record<DayPart, DayPartSummary>>;
};

const GAP = Spacing.lg;

// "Today": the day parts as a wrapping grid. Columns (4, 2 or 1) come from
// the grid's own measured width and the text size, so the same component
// fits a phone, an iPad's right-hand column, Split View and foldables.
// onLayout fires again on rotation, window resizes and fold changes.
function DayPartsGrid({ dayParts }: DayPartsGridProps): JSX.Element | null {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Only the text size; the width is measured below, not taken from the window.
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState<number>();

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    setWidth(previous => (previous !== undefined && Math.abs(previous - measured) < 0.5 ? previous : measured));
  }, []);

  const partsWithData = DAY_PARTS.filter(part => dayParts[part]);

  if (partsWithData.length === 0) {
    return null;
  }

  const columns = width !== undefined ? dayPartColumns(width, GAP, fontScale) : undefined;
  const cardWidth = width !== undefined && columns !== undefined ? dayPartCardWidth(width, GAP, columns) : undefined;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{t("time.today")}</Text>
      {/* Cards render only once the width is known, so they never appear
          squeezed and then jump. */}
      <View style={styles.grid} onLayout={onLayout} testID="day-parts-grid">
        {cardWidth !== undefined && partsWithData.map(part => (
          <DayPartCard key={part} part={part} summary={dayParts[part]!} style={{ width: cardWidth }} />
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  section: {
    marginTop: Spacing.xl,
  },
  sectionHeader: {
    fontSize: 20,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
    marginBottom: Spacing.md,
  },
  // Cards in a row stretch to the tallest one (alignItems defaults to stretch
  // on each wrapped line).
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});

export default DayPartsGrid;
