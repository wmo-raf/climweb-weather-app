import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import AdaptiveCardGrid from './AdaptiveCardGrid';
import DayPartCard from './DayPartCard';
import { DAY_PARTS, DayPart, DayPartSummary } from '@/lib/forecast/day-parts';
import { ThemeColors, Fonts, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

type DayPartsGridProps = {
  dayParts: Partial<Record<DayPart, DayPartSummary>>;
};

// "Today": the day parts as a grid that adapts to its own width
// (AdaptiveCardGrid).
function DayPartsGrid({ dayParts }: DayPartsGridProps): JSX.Element | null {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const partsWithData = DAY_PARTS.filter(part => dayParts[part]);

  if (partsWithData.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{t("time.today")}</Text>
      <AdaptiveCardGrid
        testID="day-parts-grid"
        count={partsWithData.length}
        renderCard={(i, width) => (
          <DayPartCard key={partsWithData[i]} part={partsWithData[i]} summary={dayParts[partsWithData[i]]!} style={{ width }} />
        )}
      />
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
});

export default DayPartsGrid;
