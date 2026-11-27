import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { DateTime } from 'luxon';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import Alerts from '@/components/Alerts';
import AppBar from '@/components/AppBar';
import ReadMoreCard from '@/components/ReadMoreCard';
import StatusCard from '@/components/StatusCard';
import SunTimesCard from '@/components/SunTimesCard';
import AdvisoryBanner from './AdvisoryBanner';
import AreaPicker from './AreaPicker';
import PartSquares from './PartSquares';

import { APP_TIMEZONE, NAME_OF_THE_NHMS } from '@/config';
import { MARINE_AREAS, MARINE_FORECAST_URL, TSUNAMI_CENTRE_URL } from './settings';
import { PartSummary, areaName, partsOfDay, rainBand24h, selectedArea, summarisePart, summaryBanner } from './marine';
import { placeKey, useAreaChoiceStore } from './area.store';
import { forecastSeries } from '@/lib/forecast/day-detail';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { useForecastQuery } from '@/lib/hooks/current-forecast.hook';
import { useTheme } from '@/lib/hooks/use-theme';
import { SCREENS } from '@/lib/layout/constants';
import { useLocationStore } from '@/lib/store/location.store';
import { ThemeColors, Fonts, navRailWidth, Spacing } from '@/lib/theme';

// "At sea": any warnings for the user's location at the top, as on the other
// screens; then the user picks a marine area (the one nearest their place to
// start with), and everything below is for a point on that water: one
// advisory banner for the day, the parts of the day still to come (sky and
// a wind word), sun times and links. Words only: no numbers, units or
// compass points. Everything is worked out from the cached forecast, so it
// holds offline. Opened from More conditions, inside the More tab's stack.
export default function AtSeaScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isXL = useBreakpoint() === 'xl';

  const location = useLocationStore(s => s.name);
  const lat = useLocationStore(s => s.lat);
  const lon = useLocationStore(s => s.lon);
  const place = lat !== undefined && lon !== undefined ? { lat, lon } : undefined;
  const key = placeKey(place);
  const chosenId = useAreaChoiceStore(s => s.choices[key]);
  const choose = useAreaChoiceStore(s => s.choose);
  const area = selectedArea(chosenId, place);
  const name = area ? areaName(area, i18n.language) : undefined;

  const { data: forecast, isLoading, error, refetch, dataUpdatedAt } = useForecastQuery(area?.lat, area?.lon);

  const readMoreLinks = [
    { icon: 'sail-boat', label: t('atSea.readMore.marineForecast'), url: MARINE_FORECAST_URL },
    { icon: 'tsunami', label: t('atSea.readMore.tsunamiCentre'), url: TSUNAMI_CENTRE_URL },
  ];

  let windContent: React.ReactNode = null;
  if (!area) {
    // No valid areas in config.json.
    windContent = (
      <StatusCard icon="map-marker-off-outline" title={t('common.states.notAvailable')} />
    );
  } else if (forecast) {
    const now = DateTime.now().setZone(APP_TIMEZONE);
    const series = forecastSeries(forecast);
    const parts = partsOfDay(series, now, APP_TIMEZONE, now)
      .map(part => part && summarisePart(part, area.type));
    const banner = summaryBanner(t, parts, rainBand24h(series, now));
    const shown = parts.filter((part): part is PartSummary => part !== null);
    windContent = (
      <>
        {banner && <AdvisoryBanner banner={banner} />}
        {shown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel} accessibilityRole="header">{t('atSea.partByPart')}</Text>
            <PartSquares parts={shown} />
          </View>
        )}
      </>
    );
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
      <AppBar location={t('atSea.title')} subtitle={name && t('atSea.subtitle', { place: name })} backLabel={t('More conditions')} />
      {/* Taps on the area list land while the keyboard is up. */}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.cards}>
          {/* Warnings for the user's location, as on the other screens. */}
          <Alerts lat={lat} lon={lon} location={location} />
          {area && <AreaPicker areas={MARINE_AREAS} selected={area} origin={place} onSelect={picked => choose(key, picked.id)} />}
          {windContent}
          {area && <SunTimesCard lat={area.lat} lon={area.lon} daylightKey="atSea.daylight" />}
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
  section: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
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
