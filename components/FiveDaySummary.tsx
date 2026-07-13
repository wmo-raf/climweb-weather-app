import React, { JSX } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useRouter, Href } from 'expo-router';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ForecastRecord } from '@/lib/forecast/types';
import { getFiveDayWindow } from '@/lib/forecast/day-parts';
import { colors, fonts, radius, shadow, space } from '@/lib/theme';

type FiveDaySummaryProps = {
  forecast: ForecastRecord;
  startDate: DateTime;
};

// Compact "Next 5 days" card shown on Today, one row per day. Tapping
// anywhere on the card opens the full Five Days page.
function FiveDaySummary({ forecast, startDate }: FiveDaySummaryProps): JSX.Element | null {
  const { t } = useTranslation();
  const router = useRouter();

  const days = getFiveDayWindow(forecast, startDate);
  if (days.length === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/FiveDays' as Href)}
      accessibilityLabel={`${t('Next 5 days')}. ${t('today.tapToSeeFiveDays')}`}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('Next 5 days')}</Text>
        <Icon source="chevron-right" size={20} color={colors.textSubtle} />
      </View>

      {days.map((d, idx) => {
        const iconSource = d.weatherSymbol ? weatherIcons[d.weatherSymbol] : undefined;
        const dayAbbrev = t(DateTime.fromISO(d.day).toLocaleString({ weekday: 'short' }));
        const minTemp = Math.round(d.minTemperature || 0);
        const maxTemp = Math.round(d.maxTemperature || 0);

        return (
          <View
            key={d.day}
            style={[styles.row, idx === days.length - 1 && styles.rowLast]}
            accessibilityLabel={`${dayAbbrev}: ${minTemp} to ${maxTemp} degrees.`}
          >
            <Text style={styles.dayName}>{dayAbbrev}</Text>
            {iconSource && <Icon source={iconSource} size={24} />}
            <Text style={styles.tempRange}>{minTemp}&deg; – {maxTemp}&deg;</Text>
          </View>
        );
      })}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space[4],
    padding: space[4],
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[2],
  },
  headerText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textStrong,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  dayName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
  tempRange: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textStrong,
    minWidth: 84,
    textAlign: 'right',
  },
});

export default FiveDaySummary;
