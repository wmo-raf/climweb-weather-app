import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from "luxon";
import { Button } from 'react-native-paper';
import { ActivityIndicator } from 'react-native';
import { useRouter, useNavigation, Href, Redirect } from 'expo-router';
import { isUndefined } from 'lodash';

import AppBar from '@/components/AppBar';
import Today from '@/components/Today';
import Alerts from '@/components/Alerts';

import type { AppDispatch, RootState } from '@/lib/store'
import { SCREENS } from '@/lib/layout/constants';
import { resetError, getPreciseLocation } from '@/lib/store/location.slice';
import { getLocationForecast, resetForecastError } from '@/lib/store/forecast.slice';
import { getAlerts } from '@/lib/store/alert.slice';
import { useOnboarding } from '@/lib/hooks/onboarding.hook';
import { colors, fonts, radius, space } from '@/lib/theme';

const MainScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [onboardingLoading, hasOnboarded] = useOnboarding();

  const { name: location, lat, lon, loading: locationLoading, error: locationError } = useSelector((state: RootState) => state.location, shallowEqual);
  const { loading, forecast, error: forecastError } = useSelector((state: RootState) => state.forecast, shallowEqual);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    if (isUndefined(lat) || isUndefined(lon)) {
      return;
    }

    setRefreshing(true);
    dispatch(getLocationForecast({ lat, lon }));
    dispatch(getAlerts());
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const onTryAgain = () => {
    if (isUndefined(lat) || isUndefined(lon)) {
      return;
    }

    dispatch(resetForecastError());
    dispatch(getLocationForecast({ lat, lon }));
    dispatch(getAlerts());
  }

  // Get GPS location after first(empty)render.
  useEffect(() => {
    if (isUndefined(lat) || isUndefined(lon)) {
      dispatch(getPreciseLocation());
    }
  }, []);

  // Update forecast and alerts each time lat/lon changes.
  useEffect(() => {
    if (!isUndefined(lat) && !isUndefined(lon)) {
      dispatch(getLocationForecast({ lat, lon }));
      dispatch(getAlerts());
    }
  }, [lat, lon]);

  // Reset navigation and go to list of cities if GPS location results in locationError.
  useEffect(() => {
    if (locationError && !navigation.canGoBack()) {
      dispatch(resetError());
      router.replace(SCREENS.NoLocation.toString() as Href);
    }
  }, [locationError]);

  if (onboardingLoading) {
    return null;
  }

  if (!hasOnboarded) {
    return <Redirect href="/Welcome" />;
  }

  // empty page as default content
  let mainContent: React.JSX.Element = (
    <View style={styles.opacity}>
    </View>
  )

  if (loading || locationLoading) {
    mainContent = (
      <View style={styles.opacity}>
        <TouchableOpacity onPress={() => { }}>
          <View style={styles.loader}>
            <ActivityIndicator animating={true} color={colors.primary} size='large' />
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  if (forecast) {
    const today = DateTime.now();
    const todaySummary = forecast.days.find(d => DateTime.fromISO(d.day).hasSame(today, "day"));

    mainContent = (
      <View style={styles.opacity}>
        <Today daySummary={todaySummary} location={location} />
      </View>
    )
  }

  if (forecastError) {
    mainContent = (
      <View style={styles.opacity}>
        <View style={styles.errorLoader}>
          <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center', padding: 10, fontFamily: fonts.regular }}>{forecastError}</Text>
          <Button onPress={() => onTryAgain()} style={styles.sendButton} textColor={colors.textInverse}><Text style={styles.buttonText}>Try again</Text></Button>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={location} isPlace />
          <Alerts lat={lat} lon={lon} location={location} />
          <ScrollView showsVerticalScrollIndicator={false} snapToStart={false} accessible={true} accessibilityLabel='Landing page' refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }>
            <View style={styles.contentWrapper}>
              {mainContent}
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default MainScreen;

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
  contentWrapper: {
    marginRight: space[4],
    marginLeft: space[4],
    marginTop: space[4],
    marginBottom: space[12],
  },
  opacity: {},
  loader: {
    marginTop: space[16],
    marginBottom: space[16],
  },
  errorLoader: {
    marginTop: space[16],
    marginBottom: space[16],
    textAlign: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: '40%',
    borderRadius: radius.lg,
    padding: 1,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textInverse,
  },
});
