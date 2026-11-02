import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { DateTime } from 'luxon';
import { useRouter, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import ReadMoreCard from '@/components/ReadMoreCard';
import SoilMoistureCard from '@/components/SoilMoistureCard';
import SoilTemperatureCard from '@/components/SoilTemperatureCard';
import StatusCard from '@/components/StatusCard';
import SunTimesCard from '@/components/SunTimesCard';

import { AGROMET_BULLETINS_URL, APP_TIMEZONE, NAME_OF_THE_NHMS, SEASONAL_FORECAST_URL } from '@/config';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { useSoilQuery } from '@/lib/hooks/soil.hook';
import { useTheme } from '@/lib/hooks/use-theme';
import { SCREENS } from '@/lib/layout/constants';
import { soilNow } from '@/lib/soil';
import { useLocationStore } from '@/lib/store/location.store';
import { ThemeColors, Fonts, navRailWidth, Spacing } from '@/lib/theme';

// "For farming" — water in the soil, soil temperature and sun times for the
// selected place. Opened from More conditions, inside the More tab's stack.
// Soil cards hide when their value is missing or the soil source fails.
export default function FarmingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isXL = useBreakpoint() === 'xl';

  const location = useLocationStore(s => s.name);
  const lat = useLocationStore(s => s.lat);
  const lon = useLocationStore(s => s.lon);
  const { data: soil, isLoading, dataUpdatedAt } = useSoilQuery(lat, lon);

  const hasPlace = lat !== undefined && lon !== undefined;
  const { temperature, moisture } = soilNow(soil);
  const hasSoil = temperature !== undefined || moisture !== undefined;

  const readMoreLinks = [
    { icon: 'calendar-month', label: t('farming.readMore.seasonalForecast'), url: SEASONAL_FORECAST_URL },
    { icon: 'file-document-outline', label: t('farming.readMore.agrometBulletins'), url: AGROMET_BULLETINS_URL },
  ];

  return (
    // No bottom edge: the tab bar already pads for the home indicator.
    <SafeAreaView style={[styles.wrapper, isXL && styles.xlPadding]} edges={['top', 'left', 'right']}>
      <AppBar location={t('farming.title')} subtitle={location} backLabel={t('More conditions')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cards}>
          {!hasPlace && (
            <StatusCard
              icon="map-marker-off-outline"
              title={t('location.notSet.title')}
              text={t('location.notSet.text')}
              actionLabel={t('location.notSet.action')}
              onRetry={() => router.push(SCREENS.Search.toString() as Href)}
            />
          )}
          {hasPlace && isLoading && (
            <View style={styles.loader}>
              <ActivityIndicator animating={true} color={colors.primary} size="large" />
            </View>
          )}
          <SoilMoistureCard moisture={moisture} />
          <SoilTemperatureCard temperature={temperature} />
          {hasPlace && <SunTimesCard lat={lat} lon={lon} daylightKey="farming.daylight" />}
          <ReadMoreCard title={t('readMore.title', { name: NAME_OF_THE_NHMS })} links={readMoreLinks} />
        </View>
        {hasSoil && !!dataUpdatedAt && (
          <Text style={styles.updated}>
            {t('common.updated', { time: DateTime.fromMillis(dataUpdatedAt).setZone(APP_TIMEZONE).toFormat('yyyy-MM-dd HH:mm') })}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bgAlt,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  cards: {
    gap: 10,
  },
  loader: {
    marginVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  // textSubtle, not textMuted: the footer still needs 4.5:1 contrast.
  updated: {
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.textSubtle,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  xlPadding: {
    paddingLeft: navRailWidth,
  },
});
