import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

import { ForecastRecord } from '@/lib/forecast/types';
import { currentStep } from '@/lib/forecast/current-step';
import { compassLabelKey, compassPoint, windSentence } from '@/lib/forecast/wind-sentence';
import { roundWind } from '@/lib/units';
import { ThemeColors, Fonts, Radius, shadow, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import { useUnits } from '@/lib/hooks/use-units';
import WindArrow from './WindArrow';

type TodayWindCardProps = {
  // The forecast Today already holds (useForecastQuery), so the card makes
  // no request of its own and shows whatever is cached when offline.
  forecast: ForecastRecord;
  now?: DateTime;
};

// Wind now on Today: direction and speed only, in the user's units. Left
// out when the provider has no wind for the current hour.
function TodayWindCard({ forecast, now = DateTime.now() }: TodayWindCardProps): JSX.Element | null {
  const { t } = useTranslation();
  const units = useUnits();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const step = currentStep(forecast, now);
  if (step?.windSpeed === undefined || !Number.isFinite(step.windSpeed)) return null;

  const unit = units.prefs.wind;
  const sentence = windSentence(t, step.windSpeed, step.windDirection, unit);
  const spoken = windSentence(t, step.windSpeed, step.windDirection, unit, { spoken: true });

  // windSentence leaves the direction out at zero speed, so the arrow does too.
  const fromDegrees = step.windDirection;
  const showArrow = fromDegrees !== undefined && Number.isFinite(fromDegrees) && roundWind(step.windSpeed, unit) > 0;
  const arrowLabel = showArrow
    ? t('wind.fromSpoken', { direction: t(compassLabelKey(compassPoint(fromDegrees))) })
    : undefined;

  return (
    <View
      style={styles.card}
      accessible={true}
      accessibilityLabel={`${t('weather.wind')}. ${spoken}`}
      testID="today-wind-card"
    >
      <View style={styles.header}>
        <Icon source="weather-windy" size={20} color={colors.textStrong} />
        <Text style={styles.title}>{t('weather.wind')}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.sentence}>{sentence}</Text>
        {showArrow && (
          <WindArrow fromDegrees={fromDegrees} size={28} color={colors.primary} accessibilityLabel={arrowLabel} />
        )}
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  sentence: {
    flex: 1,
    fontSize: 18,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
});

export default TodayWindCard;
