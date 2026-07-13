import React, { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

import { ForecastDayRecord, ForecastRecord } from '@/lib/forecast/types';
import { getDayParts } from '@/lib/forecast/day-parts';
import CurrentConditionsCard from './CurrentConditionsCard';
import DayPartsGrid from './DayPartsGrid';
import FiveDaySummary from './FiveDaySummary';
import { colors, fonts, space, tempSize } from '@/lib/theme';

type TodaysForecastProps = {
  daySummary: ForecastDayRecord | undefined;
  location: string;
  tempFontSize?: number;
  forecast?: ForecastRecord;
  today?: DateTime;
  // Small breakpoint (<360dp) — tighter margins to fit entry-level phones.
  compact?: boolean;
};

// The single-column (phone) composition of Today's screen. The XL/tablet
// two-pane layout is assembled directly in app/(tabs)/index.tsx from the
// same CurrentConditionsCard/DayPartsGrid pieces, since it needs different
// grouping (conditions+wind on the left, day-parts+5-day list on the right).
function Today({ daySummary, location, tempFontSize = tempSize.large, forecast, today, compact }: TodaysForecastProps): JSX.Element {
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
      {forecast && today && <FiveDaySummary forecast={forecast} startDate={today.plus({ days: 1 })} />}
    </View>
  );
};

const styles = StyleSheet.create({
  // No horizontal margin here — Today is only ever rendered inside
  // app/(tabs)/index.tsx's contentWrapper, which already provides the
  // horizontal inset. Duplicating it here made this card narrower than
  // the alert banner above it, which uses that same single inset.
  wrapper: {
    marginTop: space[4],
  },
  wrapperCompact: {
    marginTop: space[3],
  },
  todaysHeader: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
});

export default Today;
