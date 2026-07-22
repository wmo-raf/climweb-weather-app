import React from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { useSelector, shallowEqual } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from 'luxon';
import { useRouter, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import FiveDays from '@/components/FiveDays';
import LastUpdatedFooter from '@/components/LastUpdatedFooter';

import type { RootState } from '@/lib/store';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { CAPAlert, alertInLocation } from '@/lib/alerts/providers/cap-alerts/alert';
import { colors, fonts, navRailWidth, space } from '@/lib/theme';
import Alerts from '@/components/Alerts';

const FiveDaysScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const isXL = useBreakpoint() === 'xl';

  const { name: location, lat, lon } = useSelector((state: RootState) => state.location, shallowEqual);
  const { forecast } = useSelector((state: RootState) => state.forecast, shallowEqual);
  const { alerts } = useSelector((state: RootState) => state.alerts, shallowEqual);

  const today = DateTime.now();

  let relevantAlerts: CAPAlert[] = [];
  if (lat && lon) {
    relevantAlerts = alerts.filter(alert => alertInLocation(alert, { latitude: lat, longitude: lon }));
  }

  const onSelectDay = (day: DateTime) =>
    router.push({
      pathname: "/Hourly", params: {
        location: location,
        dayString: day.toISO(),
        startAtCurrentTime: "no",
        title: day.toLocaleString({ weekday: 'long' })
      }
    });

  const onSelectAlert = (alert: CAPAlert) =>
    router.push({
      pathname: "/WeatherWarning", params: { location, alertID: alert.identifier }
    } as Href);

  return (
    <SafeAreaView style={[styles.wrapper, isXL && styles.xlPadding]}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t('Next 5 days')} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.alertsWrapper}>
              <Alerts lat={lat} lon={lon} location={location} />
            </View>
            <FiveDays name={location} startDate={today.plus({ days: 1 })} forecast={forecast} onClick={onSelectDay} alerts={relevantAlerts} onSelectAlert={onSelectAlert} />
            {forecast && <Text style={styles.footnote}>{t('fiveDays.footnote')}</Text>}
            <LastUpdatedFooter />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default FiveDaysScreen;

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
  footnote: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space[2],
    marginBottom: space[8],
  },
  alertsWrapper: {
    marginLeft: space[6],
    marginRight: space[6],
    marginTop: space[4],
  },
  xlPadding: {
    paddingLeft: navRailWidth,
  },
});
