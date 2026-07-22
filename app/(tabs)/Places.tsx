import React from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Text } from 'react-native-paper';
import { useRouter, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import LocationRow from '@/components/LocationRow';
import LastUpdatedFooter from '@/components/LastUpdatedFooter';

import { useFavourites } from '@/lib/hooks/favourites.hook';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { AppDispatch } from '@/lib/store';
import { setForecast } from '@/lib/store/forecast.slice';
import { setLat, setLon, setName } from '@/lib/store/location.slice';
import { SCREENS } from '@/lib/layout/constants';
import { Place } from '@/lib/geo/places';
import { ForecastRecord } from '@/lib/forecast/types';
import { colors, fonts, navRailWidth, radius, shadow, space } from '@/lib/theme';

const PlacesScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const isXL = useBreakpoint() === 'xl';

  const [, favourites] = useFavourites();

  const onSelectPlace = (place: Place, forecast: ForecastRecord) => {
    dispatch(setForecast(forecast));
    dispatch(setName(place.name));
    dispatch(setLat(place.latitude));
    dispatch(setLon(place.longitude));
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
            {favourites.length === 0 ? (
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
                {favourites.map((place, idx) => (
                  <LocationRow
                    key={`${place.name}-${place.latitude}-${place.longitude}-${idx}`}
                    district={{ name: place.name, lat: place.latitude, lon: place.longitude }}
                    onPress={(forecast: ForecastRecord) => onSelectPlace(place, forecast)}
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

const styles = StyleSheet.create({
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
    padding: space[4],
    paddingBottom: space[8],
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
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space[6],
    marginBottom: space[4],
    ...shadow.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
    marginTop: space[3],
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    marginTop: space[1],
  },
  setButton: {
    marginTop: space[4],
    minHeight: 44,
    paddingHorizontal: space[6],
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setButtonText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textInverse,
  },
  xlPadding: {
    paddingLeft: navRailWidth,
  },
});
