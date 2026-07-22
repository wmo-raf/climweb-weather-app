import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useRouter, Href} from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import LocationRow from '@/components/LocationRow';
import StatusCard from '@/components/StatusCard';

import CITIES from '@/assets/cities.json';
import { City } from '@/lib/geo/constants';
import { AppDispatch } from '@/lib/store';
import { setForecast } from '@/lib/store/forecast.slice';
import { setLat, setLon, setName } from '@/lib/store/location.slice';
import { SCREENS } from '@/lib/layout/constants';
import { ForecastRecord } from '@/lib/forecast/types';
import { useLocationRowErrors } from '@/lib/hooks/location-row-errors.hook';
import { colors, space } from '@/lib/theme';

const NoLocationScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { hasErrors, onErrorChange, retryAll } = useLocationRowErrors();

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location="Climweb Weather App" />
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} snapToStart={false}>
            {hasErrors && (
              <StatusCard
                icon="cloud-off-outline"
                iconColor={colors.danger}
                title={t('forecast.error.title')}
                text={t('There was an error getting the forecast') + '.'}
                onRetry={retryAll}
              />
            )}
            {
              (CITIES as City[]).map((city, idx) =>
                <LocationRow
                  key={idx}
                  id={String(idx)}
                  district={city}
                  onPress={(forecast: ForecastRecord): void => {
                    dispatch(setForecast(forecast))
                    dispatch(setName(city.name));
                    dispatch(setLat(city.lat));
                    dispatch(setLon(city.lon));
                    router.push(SCREENS.Home.toString() as Href);
                  }}
                  onErrorChange={onErrorChange}
                />)
            }
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default NoLocationScreen;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: colors.bgAlt,
  },
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: space[4],
    marginRight: space[4],
  },
  bg: {
    height: '100%',
    backgroundColor: colors.bgAlt,
  }
})
