import React, { JSX, useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from 'luxon';
import { Href, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import DayDetail from '@/components/DayDetail';
import LastUpdatedFooter from '@/components/LastUpdatedFooter';
import StatusCard from '@/components/StatusCard';

import { APP_TIMEZONE } from '@/config';
import { forecastSeries, stepsForDay } from '@/lib/forecast/day-detail';
import { WEEKDAY_LABEL_KEYS } from '@/lib/forecast/day-parts';
import { useLocationStore } from '@/lib/store/location.store';
import { useForecastQuery } from '@/lib/hooks/current-forecast.hook';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { ThemeColors, Fonts, navRailWidth, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// A day's detail, opened from Five Days when the forecast is sparse
// (EXPO_PUBLIC_SPARSE_FORECAST). Lives in the Five Days tab's stack, so the
// back arrow, Android's back button and iOS swipe-back all return there.
// It follows the current place and reads the cached forecast, so offline it
// shows the last download with its "updated" time.
function DayScreen(): JSX.Element {
  const { dayString } = useLocalSearchParams<{ location: string; dayString: string }>();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isXL = useBreakpoint() === 'xl';

  const place = useLocationStore(s => s.name);
  const lat = useLocationStore(s => s.lat);
  const lon = useLocationStore(s => s.lon);
  const { data: forecast, error, isLoading, refetch } = useForecastQuery(lat, lon);

  const day = useMemo(() => DateTime.fromISO(dayString ?? '', { zone: APP_TIMEZONE }), [dayString]);
  const title = day.isValid
    ? t('dayDetail.title', {
        weekday: t(WEEKDAY_LABEL_KEYS[day.weekday] ?? ''),
        day: day.day,
        month: t(`time.months.${MONTH_KEYS[day.month - 1]}`),
      })
    : t('time.fiveDays');

  const onBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/FiveDays' as Href);
    }
  }, [navigation, router]);

  const steps = useMemo(
    () => (forecast && day.isValid ? stepsForDay(forecastSeries(forecast), day, APP_TIMEZONE) : []),
    [forecast, day],
  );

  let content: JSX.Element;
  if (forecast && steps.length > 0) {
    content = <DayDetail steps={steps} />;
  } else if (forecast) {
    content = <Text style={styles.message}>{t('forecast.states.unavailable')}.</Text>;
  } else if (error) {
    content = (
      <StatusCard
        icon="cloud-off-outline"
        iconColor={colors.danger}
        title={t('forecast.error.title')}
        text={error.message}
        onRetry={() => refetch()}
      />
    );
  } else {
    content = <Text style={styles.message}>{isLoading ? `${t('common.states.loading')}...` : t('forecast.states.unavailable')}</Text>;
  }

  return (
    <SafeAreaView style={[styles.wrapper, isXL && styles.xlPadding]} edges={['top', 'left', 'right']}>
      <AppBar location={title} subtitle={place} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {content}
        <LastUpdatedFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bgAlt,
  },
  xlPadding: {
    paddingLeft: navRailWidth,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  message: {
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
    marginTop: Spacing.xl,
  },
});

export default DayScreen;
