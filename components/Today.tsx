import React, { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';

import { ForecastDayRecord } from '@/lib/forecast/types';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, space } from '@/lib/theme';

const upArrow = require('@/assets/Arrow-upward.png');
const downArrow = require('@/assets/Arrow-downward.png');

type TodaysForecastProps = {
  daySummary: ForecastDayRecord | undefined;
};
function Today(props: TodaysForecastProps): JSX.Element {
  const { t } = useTranslation();

  const { daySummary } = props;

  if (!daySummary) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.today}>
          <Text style={styles.todaysHeader}>Forecast unavailable</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.opacity}>
        <View style={styles.todayText}><Text style={styles.todaysHeader}>{t('Today')} {">"}</Text></View>
        <View style={styles.today}>
          <View><Text style={styles.large}>{Math.round(daySummary.steps[0].temperature || 0)}&deg;</Text></View>
        </View>
        <View style={styles.temps}>
          <View>
            <Text style={styles.small}>
              {t('Max')} <Icon size={15} color={colors.text} source={upArrow} /> {Math.round(daySummary.maxTemperature || 0)}&deg;<View style={{ paddingRight: 24 }}></View>{t('Min')} <Icon size={15} color={colors.text} source={downArrow} /> {Math.round(daySummary.minTemperature || 0)}&deg;
            </Text>
          </View>
          <View>
            <Text style={styles.smallSymbol} numberOfLines={2}>
              {daySummary.weatherSymbol ? t(daySummary.weatherSymbol) : t('Not available')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space[6],
    marginRight: space[6],
    marginLeft: space[6],
  },
  opacity: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.bgTint,
    padding: space[2],
  },
  today: {
    flex: 1,
    paddingTop: space[8],
    paddingBottom: space[4],
    textAlign: 'center',
  },
  todayText: {
    flex: 1,
  },
  temps: {
    margin: space[2],
  },
  todaysHeader: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    marginBottom: -15,
    marginLeft: space[2],
    color: colors.textStrong,
  },
  large: {
    fontSize: 60,
    fontFamily: fonts.extraBold,
    color: colors.textStrong,
    textAlign: 'center',
  },
  small: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  smallSymbol: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    maxWidth: 150
  },
});

export default Today;
