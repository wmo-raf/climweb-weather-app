import React, { JSX } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { DateTime } from 'luxon';

import { useForecast } from '@/lib/hooks/current-forecast.hook';
import { City } from '@/lib/geo/constants';
import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ForecastRecord } from '@/lib/forecast/types';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, shadow, space } from '@/lib/theme';


type LocationRowProps = {
  district: City;
  onPress: (forecast: ForecastRecord) => void
};
function LocationRow(props: LocationRowProps): JSX.Element {
  const { t } = useTranslation();

  const { district, onPress } = props;
  const [, forecast, error] = useForecast(district.lat, district.lon);

  if (error) {
    return <ForecastError msg={t('There was an error getting the forecast') + '.'} />
  }

  if (forecast) {
    const today = forecast.days.find(d => DateTime.fromISO(d.day).hasSame(DateTime.now(), "day"));
    if (!today) {
      return <ForecastError msg={t('Forecast unavailable.')} />
    }

    return (
      <TouchableOpacity style={styles.wrapper} onPress={() => onPress(forecast)}>
        <View style={styles.glassWrapper}>
          <View style={styles.opacity}>
            <View style={styles.left}>
              <View>
                <Text style={styles.header}>{district.name}</Text>
              </View>
              <View style={styles.smallContainer}>
                <Text style={styles.small}>&uarr;{Math.round(today.maxTemperature || 0)}&deg;  &darr;{Math.round(today.minTemperature || 0)}&deg;</Text>
              </View>
            </View>
            <View style={styles.right}>
              <Icon source={weatherIcons[today.weatherSymbol || 'fair_day']} size={90} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.glassWrapper}>
        <View style={styles.opacity}>
          <View style={styles.left}>
            <View>
              <ActivityIndicator animating={true} color={colors.primary} size='large' />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}


function ForecastError(props: { msg: string }): JSX.Element {
  return (
    <View style={styles.wrapper}>
      <View style={styles.glassWrapper}>
        <View style={styles.opacity}>
          <View style={styles.left}>
            <View>
              <Text style={styles.small}>{props.msg}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}


const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    marginTop: space[4],
  },
  glassWrapper: {
    width: '100%',
    borderRadius: radius.lg,
  },
  opacity: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    paddingRight: space[4],
    paddingLeft: space[4],
    paddingTop: space[3],
    paddingBottom: space[3],
    zIndex: 1,
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  left: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  right: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  header: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
  small: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  smallContainer: {
    marginTop: space[1],
  },
});

export default LocationRow;
