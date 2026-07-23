import React, { JSX, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Icon } from 'react-native-paper';
import { DateTime } from "luxon";
import { useTranslation } from 'react-i18next';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ForecastDayRecord } from '@/lib/forecast/types';
import { ThemeColors, fonts, radius, space } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';

type HourlyTableProps = {
  title: string;
  daySummary: ForecastDayRecord;
  day: DateTime;
};

function HourlyTable(props: HourlyTableProps): JSX.Element {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isSameDay = props.day.hasSame(DateTime.local(), "day");
  const dayName = isSameDay ? t('Today') : props.day.toFormat('cccc');
  const rainWord = t('Rain').toLowerCase();
  const windWord = t('Wind').toLowerCase();

  return (
    <View style={styles.container}>
      <View style={styles.titleBand}>
        <Text style={styles.titleText}>{dayName}</Text>
      </View>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {props.daySummary.steps.map((step) => {
          const stepTime = DateTime.fromISO(step.time);
          const timeLabel = stepTime.toFormat('h a').toLowerCase();
          const precipText = typeof step.precipitation === 'number' && step.precipitation > 0
            ? `${step.precipitation.toFixed(1)} mm`
            : '— mm';
          const windText = `${Math.round(step.windSpeed || 0)} km/h`;
          const temp = step.temperature !== undefined ? Math.round(step.temperature) : undefined;

          return (
            <View
              key={step.time}
              style={styles.row}
              accessible={true}
              accessibilityLabel={`${timeLabel}: ${step.weatherSymbol.split('_').join(' ')}, ${precipText} ${rainWord}, ${windText} ${windWord}${temp !== undefined ? `, ${temp} degrees` : ''}.`}
            >
              <View style={styles.leftGroup}>
                <Icon source={weatherIcons[step.weatherSymbol]} size={26} />
                <Text style={styles.time}>{timeLabel}</Text>
              </View>
              <Text style={styles.description} numberOfLines={2}>
                {precipText} {rainWord} · {windText} {windWord}
              </Text>
              <Text style={styles.temp}>{temp !== undefined ? `${temp}°` : ''}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: colors.bgAlt,
  },
  titleBand: {
    marginHorizontal: space[4],
    marginTop: space[4],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.lg,
    backgroundColor: colors.bgTint,
  },
  titleText: {
    fontSize: 16,
    color: colors.primary,
    fontFamily: fonts.bold,
  },
  list: {
    flex: 1,
    marginTop: space[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minWidth: 84,
  },
  time: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textStrong,
  },
  description: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSubtle,
  },
  temp: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textStrong,
    minWidth: 44,
    textAlign: 'right',
  },
});

export default HourlyTable;
