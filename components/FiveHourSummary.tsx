import React, { JSX, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useRouter, Href } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ForecastDayRecord } from '@/lib/forecast/types';
import { ThemeColors, Fonts, Radius, shadow, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

type FiveHourSummaryProps = {
  daySummary: ForecastDayRecord;
  location: string;
};

const HOURS_SHOWN = 5;

// Compact "Today, hour by hour" card shown on Today, one row per upcoming
// hour. Tapping anywhere on the card opens today's full hourly breakdown,
// starting from the current time.
function FiveHourSummary({ daySummary, location }: FiveHourSummaryProps): JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const nowISO = DateTime.now().toISO()!;
  const upcomingSteps = daySummary.steps.filter(s => s.time > nowISO).slice(0, HOURS_SHOWN);
  if (upcomingSteps.length === 0) {
    return null;
  }

  const onPress = () => router.push({
    pathname: '/Hourly',
    params: {
      location,
      dayString: daySummary.day,
      startAtCurrentTime: 'yes',
      title: t('Today'),
    },
  } as Href);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityLabel={`${t('today.hourByHour')}. ${t('today.tapToSeeHourly')}`}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('today.hourByHour')}</Text>
        <Icon source="chevron-right" size={20} color={colors.textSubtle} />
      </View>

      {upcomingSteps.map((step, idx) => {
        const iconSource = step.weatherSymbol ? weatherIcons[step.weatherSymbol] : undefined;
        const timeLabel = DateTime.fromISO(step.time).toFormat('h a').toLowerCase();
        const temp = step.temperature !== undefined ? Math.round(step.temperature) : undefined;

        return (
          <View
            key={step.time}
            style={[styles.row, idx === upcomingSteps.length - 1 && styles.rowLast]}
            accessibilityLabel={`${timeLabel}${temp !== undefined ? `: ${temp} degrees` : ''}.`}
          >
            <Text style={styles.time}>{timeLabel}</Text>
            {iconSource && <Icon source={iconSource} size={24} />}
            <Text style={styles.temp}>{temp !== undefined ? `${temp}°` : ''}</Text>
          </View>
        );
      })}
    </TouchableOpacity>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.medium,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerText: {
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  time: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  temp: {
    fontSize: 14,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
    minWidth: 44,
    textAlign: 'right',
  },
});

export default FiveHourSummary;
