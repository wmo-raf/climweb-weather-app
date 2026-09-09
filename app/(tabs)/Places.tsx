import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Text } from 'react-native-paper';
import { useRouter, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import LocationRow from '@/components/LocationRow';
import LastUpdatedFooter from '@/components/LastUpdatedFooter';
import StatusCard from '@/components/StatusCard';

import { useFavourites } from '@/lib/hooks/favourites.hook';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { useLocationRowErrors } from '@/lib/hooks/location-row-errors.hook';
import { forecastQueryKey } from '@/lib/hooks/current-forecast.hook';
import { useLocationStore } from '@/lib/store/location.store';
import { SCREENS } from '@/lib/layout/constants';
import { Place } from '@/lib/geo/places';
import { ForecastRecord } from '@/lib/forecast/types';
import { ThemeColors, Fonts, navRailWidth, Radius, shadow, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

const PlacesScreen = () => {
  const { t } = useTranslation();
  const setLocation = useLocationStore(s => s.setLocation);
  const queryClient = useQueryClient();
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isXL = useBreakpoint() === 'xl';

  const [favouritesLoading, favourites] = useFavourites();
  const { hasErrors, onErrorChange, retryAll } = useLocationRowErrors();

  const onSelectPlace = (place: Place, forecast: ForecastRecord) => {
    // LocationRow already fetched this place's forecast to render its
    // preview card — seed the query cache with it under Home's query key
    // so navigating there doesn't re-fetch data we already have.
    queryClient.setQueryData(forecastQueryKey(place.latitude, place.longitude), forecast);
    setLocation({ name: place.name, lat: place.latitude, lon: place.longitude });
    router.push(SCREENS.Home.toString() as Href);
  };

  const onEdit = () => {
    router.push(SCREENS.EditFavourites.toString() as Href);
  };

  return (
    <SafeAreaView style={[styles.wrapper, isXL && styles.xlPadding]}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t('Places')} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {favouritesLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator animating={true} color={colors.primary} size='large' />
              </View>
            ) : favourites.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon source="map-marker-off-outline" size={32} color={colors.textSubtle} />
                <Text style={styles.emptyTitle}>{t('places.empty.title')}</Text>
                <Text style={styles.emptyText}>{t('places.empty.text')}</Text>
                <TouchableOpacity style={styles.setButton} onPress={onEdit} accessibilityLabel={t('places.setFavourites')}>
                  <Text style={styles.setButtonText}>{t('places.setFavourites')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <Text style={styles.headerText}>{t('places.yourPlaces')}</Text>
                  <TouchableOpacity
                    onPress={onEdit}
                    accessibilityLabel={t('places.edit')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon source="pencil-outline" size={22} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                {hasErrors && (
                  <StatusCard
                    icon="cloud-off-outline"
                    iconColor={colors.danger}
                    title={t('forecast.error.title')}
                    text={t('There was an error getting the forecast') + '.'}
                    onRetry={retryAll}
                  />
                )}
                {favourites.map((place, idx) => (
                  <LocationRow
                    key={`${place.name}-${place.latitude}-${place.longitude}-${idx}`}
                    id={String(idx)}
                    district={{ name: place.name, lat: place.latitude, lon: place.longitude }}
                    onPress={(forecast: ForecastRecord) => onSelectPlace(place, forecast)}
                    onErrorChange={onErrorChange}
                  />
                ))}
              </>
            )}
            <LastUpdatedFooter />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PlacesScreen;

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: colors.bgAlt,
  },
  bg: {
    height: '100%',
    backgroundColor: colors.bgAlt,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  // Matches the Today tab's whole-page loading spinner (plain, no card
  // chrome) — useFavourites() reads from storage synchronously now, so
  // this never actually shows, but the guard is kept in case that changes.
  loader: {
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.xxxl,
    alignItems: 'center',
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
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.medium,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...shadow.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  setButton: {
    marginTop: Spacing.lg,
    minHeight: 44,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.medium,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setButtonText: {
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.textInverse,
  },
  xlPadding: {
    paddingLeft: navRailWidth,
  },
});
