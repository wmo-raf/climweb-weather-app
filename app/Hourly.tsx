import React, { JSX, useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from "luxon";
import { useLocalSearchParams } from 'expo-router';

import AppBar from '@/components/AppBar';
import HourlyTable from '@/components/HourlyTable';
import Alerts from '@/components/Alerts';

import { useLocationStore } from '@/lib/store/location.store';
import { useForecastQuery } from '@/lib/hooks/current-forecast.hook';
import { ForecastDayRecord } from '@/lib/forecast/types';
import { ThemeColors, Fonts, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

function HourlyScreen(): JSX.Element {
  const { location: location_name, dayString, startAtCurrentTime, title } =
          useLocalSearchParams<{location: string, dayString: string, startAtCurrentTime: string, title: string}>()

  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const store_location_name = useLocationStore(s => s.name);
  const lat = useLocationStore(s => s.lat);
  const lon = useLocationStore(s => s.lon);
  const { data: forecast } = useForecastQuery(lat, lon);

  let daySummary: ForecastDayRecord | undefined = undefined;
  if (forecast && dayString && location_name === store_location_name) {
    const day = DateTime.fromISO(dayString);
    const dayRecord = forecast.days.find(d => DateTime.fromISO(d.day).hasSame(day, "day"));

    if (dayRecord) {
      if (startAtCurrentTime === "yes") {
        const nowISO = DateTime.now().toISO()!;
        daySummary = { ...dayRecord, steps: dayRecord.steps.filter(s => s.time > nowISO) };
      } else {
        daySummary = dayRecord;
      }
    }
  }

  let mainContent: React.JSX.Element = <View style={styles.wrapper} />;

  if (daySummary) {
    mainContent = (
      <HourlyTable daySummary={daySummary} day={DateTime.fromISO(daySummary.day)} title={title} />
    );
  } else {
    mainContent = (
      <Text style={{ color: colors.text, fontFamily: Fonts.sans.regular, fontSize: 16, padding: 40 }}>Something unforseen has happened and the forecast table can not be presented. Go back and please try again later!</Text>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={location_name} />
          <View style={styles.alertsWrapper}>
            <Alerts lat={lat} lon={lon} location={location_name} />
          </View>
          {mainContent}
        </View>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    margin: 0,
    padding: 0,
    overflow: 'scroll',
    backgroundColor: colors.bgAlt,
  },
  bg: {
    height: '100%',
    backgroundColor: colors.bgAlt,
  },
  alertsWrapper: {
    marginLeft: Spacing.lg,
    marginRight: Spacing.lg,
    marginTop: Spacing.lg,
  },
  container: {
    flexDirection: 'column',
    flex: 1,
  },
  header: {
    fontSize: 20,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
    paddingRight: 20,
    paddingLeft: 20,
    paddingTop: 20,
  },
});

export default HourlyScreen;
