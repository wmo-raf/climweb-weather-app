import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

import { APP_TIMEZONE } from '@/config';
import { ForecastRecord, ForecastStepRecord } from '@/lib/forecast/types';
import { currentStep } from '@/lib/forecast/current-step';
import { compassPoint, describeWind } from '@/lib/forecast/plain-language';
import { ThemeColors, Fonts, Radius, shadow, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import { useUnits } from '@/lib/hooks/use-units';
import WindArrow from '@/components/WindArrow';

const HOURS_SHOWN = 6;

type WindCardProps = {
  forecast: ForecastRecord;
  now?: DateTime;
};

// The forecast step covering "now" (the app's currentStep), and the ones
// after it.
export function windSteps(forecast: ForecastRecord, now: DateTime): { current?: ForecastStepRecord; upcoming: ForecastStepRecord[] } {
  const steps = forecast.days.flatMap(day => day.steps);
  const current = currentStep(forecast, now);
  const upcoming = current ? steps.slice(steps.indexOf(current) + 1, steps.indexOf(current) + 1 + HOURS_SHOWN) : [];
  return { current, upcoming };
}

// At sea page: wind now in plain words, speed, direction and gusts, then
// the next few hours. Values come from the configured forecast provider.
function WindCard({ forecast, now = DateTime.now() }: WindCardProps): JSX.Element {
  const { t } = useTranslation();
  const units = useUnits();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { current, upcoming } = windSteps(forecast, now);
  const hourly = upcoming.filter(step => step.windSpeed !== undefined);

  if (current?.windSpeed === undefined) {
    return (
      <View style={styles.card} accessible={true} accessibilityLabel={`${t('weather.wind')}. ${t('common.states.notAvailable')}`}>
        <Text style={styles.title}>{t('weather.wind')}</Text>
        <Text style={styles.notAvailable}>{t('common.states.notAvailable')}</Text>
      </View>
    );
  }

  const words = describeWind(t, current.windSpeed, current.windDirection);
  const speed = units.wind(current.windSpeed);
  const direction = current.windDirection !== undefined ? compassPoint(current.windDirection) : undefined;
  const directionSpoken = direction ? t('wind.fromSpoken', { direction: t(`compass.${direction}.long`) }) : undefined;
  const gusts = current.windGust !== undefined ? t('wind.gusts', { speed: units.wind(current.windGust) }) : undefined;

  const mainLabel = [t('atSea.windNow'), words, speed, directionSpoken, gusts].filter(Boolean).join('. ');

  const hourLabel = (step: ForecastStepRecord) => {
    const point = step.windDirection !== undefined ? compassPoint(step.windDirection) : undefined;
    return [
      DateTime.fromISO(step.time).setZone(APP_TIMEZONE).toFormat('HH:mm'),
      units.wind(step.windSpeed),
      point ? t('wind.fromSpoken', { direction: t(`compass.${point}.long`) }) : undefined,
    ].filter(Boolean).join(', ');
  };

  return (
    <View style={styles.stack}>
      <View style={[styles.card, styles.cardHighlighted]} accessible={true} accessibilityLabel={mainLabel} testID="wind-card">
        <Text style={styles.title}>{t('atSea.windNow')}</Text>
        <Text style={styles.words}>{words}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.speed}>{speed}</Text>
          {direction && current.windDirection !== undefined && (
            <View style={styles.direction}>
              <WindArrow fromDegrees={current.windDirection} size={28} color={colors.primary} />
              <Text style={styles.directionLabel}>{t(`compass.${direction}.short`)}</Text>
            </View>
          )}
        </View>
        {gusts && <Text style={styles.gusts}>{gusts}</Text>}
      </View>

      {hourly.length > 0 && (
        <View
          style={styles.card}
          accessible={true}
          accessibilityLabel={`${t('atSea.nextHours')}. ${hourly.map(hourLabel).join('. ')}`}
          testID="wind-hourly"
        >
          <Text style={styles.title}>{t('atSea.nextHours')}</Text>
          {/* Wraps instead of scrolling sideways, so it holds at large text sizes. */}
          <View style={styles.hours}>
            {hourly.map(step => (
              <View key={step.time} style={styles.hour}>
                <Text style={styles.hourTime}>{DateTime.fromISO(step.time).setZone(APP_TIMEZONE).toFormat('HH:mm')}</Text>
                {step.windDirection !== undefined
                  ? <WindArrow fromDegrees={step.windDirection} size={22} color={colors.primary} />
                  : <Text style={styles.hourValue}>—</Text>}
                <Text style={styles.hourValue}>{units.wind(step.windSpeed)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  stack: {
    gap: 10,
  },
  card: {
    padding: Spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.large,
    ...shadow.sm,
  },
  // Wind now leads the page, tinted like For farming's soil moisture card.
  cardHighlighted: {
    backgroundColor: colors.bgTint,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  notAvailable: {
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
    marginTop: Spacing.sm,
  },
  words: {
    fontSize: 20,
    fontFamily: Fonts.sans.bold,
    color: colors.primary,
    marginTop: Spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  speed: {
    fontSize: 26,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  direction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  directionLabel: {
    fontSize: 18,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  gusts: {
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
    marginTop: Spacing.sm,
  },
  hours: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.lg,
    marginTop: Spacing.md,
  },
  hour: {
    alignItems: 'center',
    gap: Spacing.sm,
    flexGrow: 1,
    minWidth: 72,
  },
  hourTime: {
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
  },
  hourValue: {
    fontSize: 14,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
});

export default WindCard;
