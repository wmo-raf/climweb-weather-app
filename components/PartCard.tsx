import React, { JSX, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ThemeColors, Fonts, Radius, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

export type PartCardProps = {
  label: string;
  // Small grey line under the name, e.g. "12:00–18:00".
  timeRange?: string;
  // One value, e.g. "20°C", on one line.
  temperature: string;
  symbol?: string;
  condition: string;
  // The whole card as one item for screen readers.
  accessibilityLabel: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

const ICON_SIZE = 48;

// Break lines only between words: no hyphenation on Android, and the plain
// word-wrap strategy on both platforms. The grid picks a column count wide
// enough that no single word needs splitting.
export const WRAP_AT_SPACES = {
  android_hyphenationFrequency: 'none',
  textBreakStrategy: 'simple',
  lineBreakStrategyIOS: 'standard',
} as const;

// One part of a day, stacked so it works at any width the grid gives it:
//   Asubuhi
//   06:00–12:00        (optional)
//   20°C          [icon]
//   Mawingu kiasi
// Used by Today's day parts and the day-detail screen.
function PartCard({ label, timeRange, temperature, symbol, condition, accessibilityLabel, testID, style }: PartCardProps): JSX.Element {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const iconSource = symbol ? weatherIcons[symbol] : undefined;

  return (
    <View style={[styles.card, style]} accessible={true} accessibilityLabel={accessibilityLabel} testID={testID}>
      <Text style={styles.label} {...WRAP_AT_SPACES}>{label}</Text>
      {timeRange && <Text style={styles.timeRange} {...WRAP_AT_SPACES}>{timeRange}</Text>}
      <View style={styles.tempRow}>
        <Text style={styles.temp} numberOfLines={1}>{temperature}</Text>
        <View style={styles.icon}>
          {iconSource && <Icon source={iconSource} size={ICON_SIZE} />}
        </View>
      </View>
      <Text style={styles.condition} numberOfLines={2} {...WRAP_AT_SPACES}>{condition}</Text>
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
  label: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontFamily: Fonts.sans.bold,
    color: colors.textSubtle,
  },
  timeRange: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    fontFamily: Fonts.sans.regular,
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

export default PartCard;
