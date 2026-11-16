import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { soilTemperatureWords } from './soil/plain-language';
import { ThemeColors, Fonts, Radius, shadow, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import { useUnits } from '@/lib/hooks/use-units';

type SoilTemperatureCardProps = {
  // °C; the card is left out when there's no value.
  temperature?: number;
};

// "Soil temperature": "24°, warm enough" in the user's units, and what that
// means for seeds.
function SoilTemperatureCard({ temperature }: SoilTemperatureCardProps): JSX.Element | null {
  const { t } = useTranslation();
  const units = useUnits();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (temperature === undefined) return null;

  const words = soilTemperatureWords(temperature);
  const label = t('farming.temperature.label');
  const value = t('farming.temperature.value', { temp: `${units.tempValue(temperature)}°`, words: t(words.words) });
  const spoken = t('farming.temperature.value', { temp: units.tempSpoken(temperature), words: t(words.words) });

  return (
    <View
      style={styles.card}
      accessible={true}
      accessibilityLabel={`${label}: ${spoken}. ${t(words.advice)}`}
      testID="soil-temperature-card"
    >
      <View style={styles.labelRow}>
        <Icon source="thermometer" size={24} color={colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.advice}>{t(words.advice)}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    padding: Spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.large,
    ...shadow.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  label: {
    flexShrink: 1,
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  value: {
    fontSize: 22,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
    marginTop: Spacing.md,
  },
  advice: {
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
    marginTop: Spacing.sm,
  },
});

export default SoilTemperatureCard;
