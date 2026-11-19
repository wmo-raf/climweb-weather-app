import React, { JSX, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { DayPart, DayPartSummary, DAY_PART_LABEL_KEYS, CONDITION_LABEL_KEYS, conditionBucket } from '@/lib/forecast/day-parts';
import { ThemeColors, Fonts, Radius, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import { useUnits } from '@/lib/hooks/use-units';

type DayPartCardProps = {
  part: DayPart;
  summary: DayPartSummary;
  style?: StyleProp<ViewStyle>;
};

const ICON_SIZE = 48;

// Break lines only between words: no hyphenation on Android, and the plain
// word-wrap strategy on both platforms. DayPartsGrid picks a column count
// wide enough that no single word needs splitting.
const WRAP_AT_SPACES = {
  android_hyphenationFrequency: 'none',
  textBreakStrategy: 'simple',
  lineBreakStrategyIOS: 'standard',
} as const;

// One day part, stacked so it works at any width the grid gives it:
//   Asubuhi
//   20°C          [icon]
//   Mawingu kiasi
// The same layout in 1, 2 or 4 columns. Read as one item by screen readers.
function DayPartCard({ part, summary, style }: DayPartCardProps): JSX.Element {
  const { t } = useTranslation();
  const units = useUnits();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const iconSource = summary.weatherSymbol ? weatherIcons[summary.weatherSymbol] : undefined;
  const partLabel = t(DAY_PART_LABEL_KEYS[part]);
  const conditionLabel = t(CONDITION_LABEL_KEYS[conditionBucket(summary.weatherSymbol)]);

  return (
    <View
      style={[styles.card, style]}
      accessible={true}
      accessibilityLabel={`${partLabel}, ${units.tempSpoken(summary.temperature || 0)}, ${conditionLabel}`}
      testID={`day-part-${part}`}
    >
      <Text style={styles.partLabel} {...WRAP_AT_SPACES}>{partLabel}</Text>
      <View style={styles.tempRow}>
        <Text style={styles.temp} numberOfLines={1}>{units.temp(summary.temperature || 0)}</Text>
        <View style={styles.icon}>
          {iconSource && <Icon source={iconSource} size={ICON_SIZE} />}
        </View>
      </View>
      <Text style={styles.condition} numberOfLines={2} {...WRAP_AT_SPACES}>{conditionLabel}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.large,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.05)',
  },
  partLabel: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontFamily: Fonts.sans.bold,
    color: colors.textSubtle,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  temp: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 24,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  // Fixed size even when empty, so cards without an icon line up.
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    flexShrink: 0,
  },
  condition: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
  },
});

export default DayPartCard;
