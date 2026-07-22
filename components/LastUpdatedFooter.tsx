import React, { JSX } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector, shallowEqual } from 'react-redux';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

import type { RootState } from '@/lib/store';
import { APP_TIMEZONE } from '@/config';
import { colors, fonts, space } from '@/lib/theme';

// Shown at the bottom of Today, 5 Days, Places and Alerts — a single,
// app-wide "how fresh is this data" indicator tied to the last time the
// forecast slice actually received data from the API (see forecast.slice.ts),
// not to whatever's currently rendered on screen. Renders nothing until the
// first successful fetch.
function LastUpdatedFooter(): JSX.Element | null {
  const { t } = useTranslation();
  const { lastFetchedAt } = useSelector((state: RootState) => state.forecast, shallowEqual);

  if (!lastFetchedAt) {
    return null;
  }

  const time = DateTime.fromISO(lastFetchedAt).setZone(APP_TIMEZONE).toFormat('yyyy-MM-dd h:mm a');

  return (
    <Text style={styles.footer}>{t('forecast.lastUpdated', { time })}</Text>
  );
}

const styles = StyleSheet.create({
  footer: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space[2],
    marginBottom: space[8],
  },
});

export default LastUpdatedFooter;
