import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Search } from '@/components/Search';
import Alerts from '@/components/Alerts';
import AppBar from '@/components/AppBar';

import { AppDispatch, RootState } from '@/lib/store';
import { setLocation } from '@/lib/store/location.slice';
import { Place } from '@/lib/geo/places';
import { colors, space } from '@/lib/theme';

const SearchScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { name, lat, lon } = useSelector((state: RootState) => state.location);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={name ? name : 'Search location'} />
          <View style={styles.alertsWrapper}>
            <Alerts lat={lat} lon={lon} location={name} />
          </View>
          <Search
            location={name}
            setLocation={
              (place: Place) => {
                dispatch(setLocation({ name: place.name, lat: place.latitude, lon: place.longitude }));
                router.replace('/');
              }
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default SearchScreen;

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
  alertsWrapper: {
    width: '90%',
    alignSelf: 'center',
    marginTop: space[4],
  },
})
