import React, { JSX, useEffect, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { DateTime } from 'luxon';

import { useForecast } from '@/lib/hooks/current-forecast.hook';
import { City } from '@/lib/geo/constants';
import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ForecastRecord } from '@/lib/forecast/types';
import { useTranslation } from 'react-i18next';
import { ThemeColors, fonts, radius, shadow, space } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';
import { conditionBucket, CONDITION_LABEL_KEYS } from '@/lib/forecast/day-parts';


type LocationRowProps = {
  district: City;
  onPress: (forecast: ForecastRecord) => void;
  // Identifies this row within the parent's list. When this row's fetch
  // fails, it renders nothing and instead reports itself (and how to
  // retry it) via onErrorChange, so the parent can show ONE consolidated
  // error card instead of one per failing row.
  id: string;
  onErrorChange?: (id: string, retry: (() => void) | undefined) => void;
};
function LocationRow(props: LocationRowProps): JSX.Element | null {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { district, onPress, id, onErrorChange } = props;
  const [, forecast, error, retry] = useForecast(district.lat, district.lon);

  const today = forecast?.days.find(d => DateTime.fromISO(d.day).hasSame(DateTime.now(), "day"));
  const isError = !!error || (!!forecast && !today);

  useEffect(() => {
    onErrorChange?.(id, isError ? retry : undefined);
    // Only the error/OK transition should re-notify the parent — retry
    // and onErrorChange are stable enough in practice (same closure
    // shape every render) that re-running this on every render would
    // just be noise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError, id]);

  if (isError) {
    return null;
  }

  if (forecast && today) {
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
              <Text style={styles.small}>{t(CONDITION_LABEL_KEYS[conditionBucket(today.weatherSymbol)])}</Text>
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


const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
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
