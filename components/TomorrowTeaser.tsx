import React, { JSX } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useRouter, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import weatherIcons from '@/lib/forecast/weathericons.constant';
import { ForecastDayRecord } from '@/lib/forecast/types';
import { CONDITION_LABEL_KEYS, conditionBucket } from '@/lib/forecast/day-parts';
import { colors, fonts, radius, shadow, space } from '@/lib/theme';

type TomorrowTeaserProps = {
  today: ForecastDayRecord;
  tomorrow: ForecastDayRecord;
};

function TomorrowTeaser({ today, tomorrow }: TomorrowTeaserProps): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const iconSource = tomorrow.weatherSymbol ? weatherIcons[tomorrow.weatherSymbol] : undefined;
  const conditionLabel = t(CONDITION_LABEL_KEYS[conditionBucket(tomorrow.weatherSymbol)]);

  const todayMax = today.maxTemperature ?? 0;
  const tomorrowMax = tomorrow.maxTemperature ?? 0;
  let trendWord: string | undefined;
  if (tomorrowMax - todayMax >= 2) trendWord = t('today.warmer');
  else if (todayMax - tomorrowMax >= 2) trendWord = t('today.cooler');

  const headline = trendWord
    ? `${t('today.tomorrow')}: ${conditionLabel}, ${trendWord}`
    : `${t('today.tomorrow')}: ${conditionLabel}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/FiveDays' as Href)}
      accessibilityLabel={`${headline}. ${t('today.tapToSeeFiveDays')}`}
    >
      {iconSource && <Icon source={iconSource} size={32} />}
      <View style={styles.textBlock}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.subtext}>
          {Math.round(tomorrow.minTemperature || 0)}&deg; – {Math.round(tomorrow.maxTemperature || 0)}&deg; · {t('today.tapToSeeFiveDays')}
        </Text>
      </View>
      <Icon source="chevron-right" size={22} color={colors.textSubtle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginTop: space[4],
    padding: space[4],
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: space[12],
    ...shadow.sm,
  },
  textBlock: {
    flex: 1,
  },
  headline: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textStrong,
  },
  subtext: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSubtle,
    marginTop: space[1],
  },
});

export default TomorrowTeaser;
