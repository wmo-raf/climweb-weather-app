import React, { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { ForecastDayRecord } from '@/lib/forecast/types';
import { getDayParts } from '@/lib/forecast/day-parts';
import CurrentConditionsCard from './CurrentConditionsCard';
import DayPartsGrid from './DayPartsGrid';
import TomorrowTeaser from './TomorrowTeaser';
import { colors, fonts, space, tempSize } from '@/lib/theme';

type TodaysForecastProps = {
  daySummary: ForecastDayRecord | undefined;
  location: string;
  tempFontSize?: number;
  tomorrow?: ForecastDayRecord;
  // Small breakpoint (<360dp) — tighter margins to fit entry-level phones.
  compact?: boolean;
};

// The single-column (phone) composition of Today's screen. The XL/tablet
// two-pane layout is assembled directly in app/(tabs)/index.tsx from the
// same CurrentConditionsCard/DayPartsGrid pieces, since it needs different
// grouping (conditions+wind on the left, day-parts+5-day list on the right).
function Today({ daySummary, location, tempFontSize = tempSize.large, tomorrow, compact }: TodaysForecastProps): JSX.Element {
  const { t } = useTranslation();

  if (!daySummary) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.todaysHeader}>{t('Forecast unavailable')}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <CurrentConditionsCard daySummary={daySummary} location={location} tempFontSize={tempFontSize} compact={compact} />
      <DayPartsGrid dayParts={getDayParts(daySummary)} columns={2} />
      {tomorrow && <TomorrowTeaser today={daySummary} tomorrow={tomorrow} />}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: space[4],
    marginRight: space[4],
    marginLeft: space[4],
  },
  wrapperCompact: {
    marginTop: space[3],
    marginRight: space[3],
    marginLeft: space[3],
  },
  todaysHeader: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
});

export default Today;
