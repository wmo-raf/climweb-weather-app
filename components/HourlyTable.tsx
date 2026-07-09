import React, { JSX } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { DataTable, Icon } from 'react-native-paper';
import { DateTime } from "luxon";

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ForecastDayRecord } from '@/lib/forecast/types';
import { useTranslation } from 'react-i18next';
import { colors, fonts, space } from '@/lib/theme';

type HourlyTableProps = {
  title: string;
  daySummary: ForecastDayRecord;
  day: DateTime;
};

function HourlyTable(props: HourlyTableProps): JSX.Element {
  const { t } = useTranslation();

  const isSameDay = props.day.hasSame(DateTime.local(), "day");
  const dayName = isSameDay ? t('Today') : props.day.toFormat('ccc');
  return (
    <View style={styles.container}>
      <View style={styles.opacity}>
        <View style={styles.title}>
          <Text style={styles.titleText}>{dayName} {props.day.toFormat('dd LLL')}</Text>
        </View>
        <DataTable style={styles.table}>
          <DataTable.Header>
            <DataTable.Title><Text style={styles.whiteHeader}>{t('Time')}</Text></DataTable.Title>
            <DataTable.Title><Text></Text></DataTable.Title>
            <DataTable.Title numeric numberOfLines={2}><Text style={styles.whiteHeader}>{t('Temp')}{"\n"}C&deg;</Text></DataTable.Title>
            <DataTable.Title numeric numberOfLines={2}><Text style={styles.whiteHeader}>{t('Rain')}{"\n"}mm</Text></DataTable.Title>
            <DataTable.Title numeric numberOfLines={2}><Text style={styles.whiteHeader}>{t('Wind')}{"\n"}km/h</Text></DataTable.Title>
          </DataTable.Header>
          <ScrollView snapToStart={false} showsVerticalScrollIndicator={false}>
            {props.daySummary.steps.map((step) => {
              const stepTime = DateTime.fromISO(step.time);
              return (
                <DataTable.Row key={step.time}>
                  <DataTable.Cell><Text style={styles.whiteText}>{stepTime.toLocaleString({ hour: '2-digit' })}</Text></DataTable.Cell>
                  <DataTable.Cell accessible={true} accessibilityLabel={`Weather symbol on ${props.day.toFormat('dd LLL')} at ${stepTime.toLocaleString({ hour: '2-digit' })} is ${step.weatherSymbol.split('_').join(' ')}.`}><Icon source={weatherIcons[step.weatherSymbol]} size={34} /></DataTable.Cell>
                  <DataTable.Cell numeric><Text style={styles.whiteText}>{step.temperature ? Math.round(step.temperature) : ""}&deg;</Text></DataTable.Cell>
                  <DataTable.Cell numeric><Text style={styles.whiteText}>{step.precipitation}</Text></DataTable.Cell>
                  <DataTable.Cell numeric><Text style={styles.whiteText}>{Math.round(step.windSpeed || 0)}</Text></DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </ScrollView>
        </DataTable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    backgroundColor: colors.bgAlt,
  },
  title: {
    paddingLeft: space[6],
    paddingRight: space[4],
    paddingTop: space[4],
    marginTop: space[1],
  },
  titleText: {
    fontSize: 16,
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
  },
  table: {
    paddingLeft: space[6],
    paddingRight: space[4],
    paddingTop: space[1],
    flex: 1,
  },
  opacity: {
    flexDirection: 'column',
    flex: 1,
  },
  whiteHeader: {
    color: colors.textSubtle,
    fontFamily: fonts.semiBold,
    textAlign: 'center'
  },
  whiteText: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
});

export default HourlyTable;
