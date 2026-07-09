import React from 'react';
import { StyleSheet, View, ScrollView, Text } from 'react-native';
import { useSelector, shallowEqual } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from 'luxon';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import FiveDays from '@/components/FiveDays';

import type { RootState } from '@/lib/store';
import { colors, fonts, space } from '@/lib/theme';

const FiveDaysScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const { name: location } = useSelector((state: RootState) => state.location, shallowEqual);
  const { forecast } = useSelector((state: RootState) => state.forecast, shallowEqual);

  const today = DateTime.now();

  const onSelectDay = (day: DateTime) =>
    router.push({
      pathname: "/Hourly", params: {
        location: location,
        dayString: day.toISO(),
        startAtCurrentTime: "no",
        title: day.toLocaleString({ weekday: 'long' })
      }
    });

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t('Next 5 days')} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <FiveDays name={location} startDate={today.plus({ days: 1 })} forecast={forecast} onClick={onSelectDay} />
            {forecast && <Text style={styles.footnote}>{t('fiveDays.footnote')}</Text>}
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
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space[2],
    marginBottom: space[8],
  },
});
