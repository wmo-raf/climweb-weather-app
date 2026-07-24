import React, { JSX, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { DayPart, DayPartSummary, DAY_PART_LABEL_KEYS, CONDITION_LABEL_KEYS, conditionBucket } from '@/lib/forecast/day-parts';
import { ThemeColors, fonts, radius, shadow, space } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';

type DayPartCardProps = {
  part: DayPart;
  summary: DayPartSummary;
  style?: StyleProp<ViewStyle>;
};

function DayPartCard({ part, summary, style }: DayPartCardProps): JSX.Element {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const iconSource = summary.weatherSymbol ? weatherIcons[summary.weatherSymbol] : undefined;
  const conditionLabel = t(CONDITION_LABEL_KEYS[conditionBucket(summary.weatherSymbol)]);

  return (
    <View style={[styles.card, style]} accessible={true} accessibilityLabel={`${t(DAY_PART_LABEL_KEYS[part])}: ${Math.round(summary.temperature || 0)} degrees, ${conditionLabel}`}>
      <Text style={styles.partLabel}>{t(DAY_PART_LABEL_KEYS[part])}</Text>
      <View style={styles.row}>
        {iconSource && <Icon source={iconSource} size={36} />}
        <Text style={styles.temp}>{Math.round(summary.temperature || 0)}&deg;</Text>
      </View>
      <Text style={styles.condition} numberOfLines={1}>{conditionLabel}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space[3],
    marginBottom: space[3],
    ...shadow.sm,
  },
  partLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textSubtle,
    marginBottom: space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  temp: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.textStrong,
  },
  condition: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    marginTop: space[1],
  },
});

export default DayPartCard;
