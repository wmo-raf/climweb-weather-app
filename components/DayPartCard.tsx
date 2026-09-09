import React, { JSX, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { DayPart, DayPartSummary, DAY_PART_LABEL_KEYS, CONDITION_LABEL_KEYS, conditionBucket } from '@/lib/forecast/day-parts';
import { ThemeColors, Fonts, Radius, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

type DayPartCardProps = {
  part: DayPart;
  summary: DayPartSummary;
  style?: StyleProp<ViewStyle>;
};

function DayPartCard({ part, summary, style }: DayPartCardProps): JSX.Element {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const iconSource = summary.weatherSymbol ? weatherIcons[summary.weatherSymbol] : undefined;
  const conditionLabel = t(CONDITION_LABEL_KEYS[conditionBucket(summary.weatherSymbol)]);

  return (
    <View style={[styles.card, style]} accessible={true} accessibilityLabel={`${t(DAY_PART_LABEL_KEYS[part])}: ${Math.round(summary.temperature || 0)} degrees, ${conditionLabel}`}>
      <View style={styles.leftCol}>
        <Text style={styles.partLabel}>{t(DAY_PART_LABEL_KEYS[part])}</Text>
        <Text style={styles.temp}>{Math.round(summary.temperature || 0)}&deg;</Text>
        <Text style={styles.condition} numberOfLines={1}>{conditionLabel}</Text>
      </View>
      <View style={styles.rightCol}>
        {iconSource && <Icon source={iconSource} size={48} />}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderRadius: Radius.large,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  leftCol: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  partLabel: {
    fontSize: 14,
    fontFamily: Fonts.sans.bold,
    color: colors.textSubtle,
    marginBottom: Spacing.xs,
  },
  temp: {
    fontSize: 24,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
    marginBottom: Spacing.xs,
  },
  condition: {
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
  },
});

export default DayPartCard;
