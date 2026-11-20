import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { DateTime } from 'luxon';
import { useRouter, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import ReadMoreCard from '@/components/ReadMoreCard';
import StatusCard from '@/components/StatusCard';
import SunTimesCard from '@/components/SunTimesCard';
import WeatherAlert from '@/components/WeatherAlert';
import WindCard from './WindCard';

import { APP_TIMEZONE, NAME_OF_THE_NHMS } from '@/config';
import { MARINE_FORECAST_URL, TSUNAMI_CENTRE_URL } from './settings';
import { atSeaWarningsFor } from './warnings';
import { useAlertsQuery } from '@/lib/hooks/alerts.hook';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { useForecastQuery } from '@/lib/hooks/current-forecast.hook';
import { useTheme } from '@/lib/hooks/use-theme';
import { SCREENS } from '@/lib/layout/constants';
import { useLocationStore } from '@/lib/store/location.store';
import { ThemeColors, Fonts, navRailWidth, Spacing } from '@/lib/theme';

// "At sea" — wind, wind/marine warnings and sun times for the selected
// place. Opened from More conditions, inside the More tab's stack.
export default function AtSeaScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isXL = useBreakpoint() === 'xl';

  const location = useLocationStore(s => s.name);
  const lat = useLocationStore(s => s.lat);
  const lon = useLocationStore(s => s.lon);
  const { data: forecast, isLoading, error, refetch, dataUpdatedAt } = useForecastQuery(lat, lon);
  const { data: alerts = [] } = useAlertsQuery();

  const hasPlace = lat !== undefined && lon !== undefined;
  const warnings = hasPlace ? atSeaWarningsFor(alerts, { latitude: lat, longitude: lon }) : [];

  const readMoreLinks = [
    { icon: 'sail-boat', label: t('atSea.readMore.marineForecast'), url: MARINE_FORECAST_URL },
    { icon: 'tsunami', label: t('atSea.readMore.tsunamiCentre'), url: TSUNAMI_CENTRE_URL },
  ];

  let windContent: React.ReactNode = null;
  if (!hasPlace) {
    windContent = (
      <StatusCard
        icon="map-marker-off-outline"
        title={t('location.notSet.title')}
        text={t('location.notSet.text')}
        actionLabel={t('location.notSet.action')}
        onRetry={() => router.push(SCREENS.Search.toString() as Href)}
      />
    );
  } else if (forecast) {
    windContent = <WindCard forecast={forecast} />;
  } else if (isLoading) {
    windContent = (
      <View style={styles.loader}>
        <ActivityIndicator animating={true} color={colors.primary} size="large" />
      </View>
    );
  } else if (error) {
    windContent = (
      <StatusCard
        icon="cloud-off-outline"
        iconColor={colors.danger}
        title={t('forecast.error.title')}
        text={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    // No bottom edge: the tab bar already pads for the home indicator.
    <SafeAreaView style={[styles.wrapper, isXL && styles.xlPadding]} edges={['top', 'left', 'right']}>
      <AppBar location={t('atSea.title')} subtitle={location} backLabel={t('More conditions')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cards}>
          {warnings.map(alert => (
            <WeatherAlert
              key={alert.identifier}
              alert={alert}
              showAreaAndExpiry
              onPress={() => router.push({ pathname: SCREENS.WeatherWarning, params: { location, alertID: alert.identifier } })}
            />
          ))}
          {windContent}
          {hasPlace && <SunTimesCard lat={lat} lon={lon} />}
          <ReadMoreCard title={t('readMore.title', { name: NAME_OF_THE_NHMS })} links={readMoreLinks} />
        </View>
        {!!forecast && !!dataUpdatedAt && (
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
