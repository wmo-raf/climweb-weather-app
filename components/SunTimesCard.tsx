import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

import { APP_TIMEZONE } from '@/config';
import { daylightMinutes, getCachedSunTimes, getSunTimes, utcOffset } from '@/lib/sun/sunrise';
import { ThemeColors, Fonts, Radius, shadow, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

type SunTimesCardProps = {
  lat: number;
  lon: number;
  // i18n key for the daylight line, pluralised on `count` (hours). Each page
  // words it for its own audience, e.g. "…of daylight for field work today".
  daylightKey?: string;
};

const NO_TIME = '—';

const formatTime = (iso: string | null) =>
  iso ? DateTime.fromISO(iso, { setZone: true }).toFormat('HH:mm') : NO_TIME;

// "Sun up" / "Sun down" for today at a place, with the length of daylight.
// Shared by the At sea and For farming pages. Times come from MET's Sunrise
// API through lib/sun (cached per place and date); with no network and
// nothing cached for today, the card is left out rather than guessed.
function SunTimesCard({ lat, lon, daylightKey = 'sun.daylight' }: SunTimesCardProps): JSX.Element | null {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const date = DateTime.now().setZone(APP_TIMEZONE).toISODate()!;
  const { data: times } = useQuery({
    queryKey: ['sun', lat, lon, date],
    queryFn: () => getSunTimes(lat, lon, date, utcOffset(APP_TIMEZONE, date)),
    // lib/sun already honours the response's Expires header; this only
    // stops remounts from re-asking it in quick succession.
    staleTime: 5 * 60 * 1000,
    placeholderData: () => getCachedSunTimes(lat, lon, date),
  });

  if (!times) return null;

  const sunUp = formatTime(times.sunrise);
  const sunDown = formatTime(times.sunset);
  const minutes = daylightMinutes(times);
  const daylight = minutes !== undefined ? t(daylightKey, { count: Math.round(minutes / 60) }) : undefined;

  const label = [
    `${t('sun.up')}: ${times.sunrise ? sunUp : t('common.states.notAvailable')}`,
    `${t('sun.down')}: ${times.sunset ? sunDown : t('common.states.notAvailable')}`,
    daylight,
  ].filter(Boolean).join('. ');

  return (
    <View style={styles.card} accessible={true} accessibilityLabel={label} testID="sun-times-card">
      <View style={styles.row}>
        <View style={styles.item}>
          <Icon source="weather-sunset-up" size={28} color={colors.warning} />
          <View style={styles.itemText}>
            <Text style={styles.label}>{t('sun.up')}</Text>
            <Text style={styles.time}>{sunUp}</Text>
          </View>
        </View>
        <View style={styles.item}>
          <Icon source="weather-sunset-down" size={28} color={colors.warning} />
          <View style={styles.itemText}>
            <Text style={styles.label}>{t('sun.down')}</Text>
            <Text style={styles.time}>{sunDown}</Text>
          </View>
        </View>
      </View>
      {daylight && <Text style={styles.daylight}>{daylight}</Text>}
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
  // Wraps to one item per line at large text sizes.
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexGrow: 1,
    flexBasis: 120,
  },
  itemText: {
    flexShrink: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
  },
  time: {
    fontSize: 20,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  daylight: {
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
    marginTop: Spacing.md,
  },
});

export default SunTimesCard;
