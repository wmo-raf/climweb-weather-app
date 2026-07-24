import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ForecastDayRecord } from '@/lib/forecast/types';
import { CONDITION_LABEL_KEYS, conditionBucket, getDayParts, buildTodaySummary } from '@/lib/forecast/day-parts';
import { windLevel, WIND_LEVEL_SENTENCE_KEYS } from '@/lib/forecast/plain-language';
import { ThemeColors, fonts, radius, space, tempTextColor } from '@/lib/theme';
import { useAppTheme } from '@/lib/theme/ThemeContext';

type CurrentConditionsCardProps = {
  daySummary: ForecastDayRecord;
  location: string;
  tempFontSize: number;
  // Only shown where there's room to spare (the XL two-pane layout) — none
  // of the phone breakpoints in the design reference show it.
  showWindSummary?: boolean;
  // Small breakpoint (<360dp) — tighter padding to fit entry-level phones.
  compact?: boolean;
};

function CurrentConditionsCard({ daySummary, location, tempFontSize, showWindSummary, compact }: CurrentConditionsCardProps): JSX.Element {
  const { t } = useTranslation();
  const { colors, scheme } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors, tempTextColor[scheme]), [colors, scheme]);

  const nowStep = daySummary.steps[0];
  const nowTemp = Math.round(nowStep?.temperature || 0);
  const nowIconSource = nowStep?.weatherSymbol ? weatherIcons[nowStep.weatherSymbol] : undefined;
  const nowConditionLabel = t('condition.now', { condition: t(CONDITION_LABEL_KEYS[conditionBucket(nowStep?.weatherSymbol)]) });

  const dayParts = getDayParts(daySummary);
  const summary = buildTodaySummary(t, location, nowStep, dayParts);
  const windSentence = t(WIND_LEVEL_SENTENCE_KEYS[windLevel(daySummary.windSpeed)]);

  return (
    <View style={[styles.currentCard, compact && styles.currentCardCompact]}>
      <View style={styles.currentRow}>
        {nowIconSource && <Icon source={nowIconSource} size={64} />}
        <View style={styles.currentTempBlock}>
          <Text style={[styles.large, { fontSize: tempFontSize }]}>{nowTemp}&deg;</Text>
          <Text style={styles.nowCondition}>{nowConditionLabel}</Text>
        </View>
      </View>
      <Text style={styles.summaryText}>
        {summary.lead}{summary.predictive ? <Text style={styles.summaryBold}> {summary.predictive}</Text> : null}{summary.trailing ? ` ${summary.trailing}` : ''}
      </Text>

      {showWindSummary &&
        <View style={styles.windCard}>
          <Icon source="weather-windy" size={20} color={colors.text} />
          <Text style={styles.windText}>
            <Text style={styles.windLabel}>{t('Wind')}: </Text>{windSentence}
          </Text>
        </View>
      }
    </View>
  );
}

const makeStyles = (colors: ThemeColors, tempColor: string) => StyleSheet.create({
  currentCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.bgTint,
    padding: space[4],
  },
  currentCardCompact: {
    padding: space[3],
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
    fontFamily: fonts.extraBold,
    color: tempColor,
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
  windCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    marginTop: space[4],
    paddingTop: space[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  windText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  windLabel: {
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
});

export default CurrentConditionsCard;
