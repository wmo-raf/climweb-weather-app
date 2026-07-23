import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import DayPartCard from './DayPartCard';
import { DAY_PARTS, DayPart, DayPartSummary } from '@/lib/forecast/day-parts';
import { ThemeColors, fonts, space } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';

type DayPartsGridProps = {
  dayParts: Partial<Record<DayPart, DayPartSummary>>;
  // 2-across on phones (default), 4-across on the XL/tablet layout.
  columns?: 2 | 4;
};

function DayPartsGrid({ dayParts, columns = 2 }: DayPartsGridProps): JSX.Element | null {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const partsWithData = DAY_PARTS.filter(part => dayParts[part]);

  if (partsWithData.length === 0) {
    return null;
  }

  const cardWidth = columns === 4 ? '23%' : '48%';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>{t('Today')}</Text>
      <View style={styles.grid}>
        {partsWithData.map(part => (
          <DayPartCard key={part} part={part} summary={dayParts[part]!} style={{ width: cardWidth }} />
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  section: {
    marginTop: space[6],
  },
  sectionHeader: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textStrong,
    marginBottom: space[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default DayPartsGrid;
