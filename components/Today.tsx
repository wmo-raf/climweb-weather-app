import React, { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ForecastDayRecord } from '@/lib/forecast/types';
import { DAY_PARTS, CONDITION_LABEL_KEYS, conditionBucket, getDayParts, buildTodaySummary } from '@/lib/forecast/day-parts';
import DayPartCard from './DayPartCard';
import { colors, fonts, radius, space } from '@/lib/theme';

type TodaysForecastProps = {
  daySummary: ForecastDayRecord | undefined;
  location: string;
};

function Today({ daySummary, location }: TodaysForecastProps): JSX.Element {
  const { t } = useTranslation();

  if (!daySummary) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.todaysHeader}>{t('Forecast unavailable')}</Text>
      </View>
    )
  }

  const nowStep = daySummary.steps[0];
  const nowTemp = Math.round(nowStep?.temperature || 0);
  const nowIconSource = nowStep?.weatherSymbol ? weatherIcons[nowStep.weatherSymbol] : undefined;
  const nowConditionLabel = t('condition.now', { condition: t(CONDITION_LABEL_KEYS[conditionBucket(nowStep?.weatherSymbol)]) });

  const dayParts = getDayParts(daySummary);
  const partsWithData = DAY_PARTS.filter(part => dayParts[part]);

  const summary = buildTodaySummary(t, location, nowStep, dayParts);

  return (
    <View style={styles.wrapper}>
      <View style={styles.currentCard}>
        <View style={styles.currentRow}>
          {nowIconSource && <Icon source={nowIconSource} size={64} />}
          <View style={styles.currentTempBlock}>
            <Text style={styles.large}>{nowTemp}&deg;</Text>
            <Text style={styles.nowCondition}>{nowConditionLabel}</Text>
          </View>
        </View>
        <Text style={styles.summaryText}>
          {summary.lead}{summary.predictive ? <Text style={styles.summaryBold}> {summary.predictive}</Text> : null}{summary.trailing ? ` ${summary.trailing}` : ''}
        </Text>
      </View>

      {partsWithData.length > 0 &&
        <View style={styles.dayPartsSection}>
          <Text style={styles.sectionHeader}>{t('Today')}</Text>
          <View style={styles.grid}>
            {partsWithData.map(part => (
              <DayPartCard key={part} part={part} summary={dayParts[part]!} />
            ))}
          </View>
        </View>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: space[4],
    marginRight: space[4],
    marginLeft: space[4],
  },
  currentCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.bgTint,
    padding: space[4],
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  currentTempBlock: {
    flexDirection: 'column',
  },
  large: {
    fontSize: 60,
    fontFamily: fonts.extraBold,
    color: colors.textStrong,
  },
  nowCondition: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  summaryText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    marginTop: space[3],
  },
  summaryBold: {
    fontFamily: fonts.bold,
    color: colors.textStrong,
  },
  dayPartsSection: {
    marginTop: space[6],
  },
  sectionHeader: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textStrong,
    marginBottom: space[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  todaysHeader: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
});

export default Today;
