import React, { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { CAPAlert, alertLevel } from '@/lib/alerts/providers/cap-alerts/alert';
import { WARNING_BAND_TEXT_COLORS, WARNING_COLORS } from '@/lib/alerts/providers/cap-alerts/icons';
import { getShareSourceLine, getWhatToDo, getWhenText, getWhereText } from '@/lib/alerts/providers/cap-alerts/plain-language';
import { colors, fonts, radius, space } from '@/lib/theme';

const BAND_LABEL_KEYS: { [k in 'Red' | 'Yellow' | 'Orange' | 'Cyan' | 'Blue']: string } = {
  Red: 'alert.band.red',
  Orange: 'alert.band.orange',
  Yellow: 'alert.band.yellow',
  Cyan: 'alert.band.notice',
  Blue: 'alert.band.notice',
};

const CARD_WIDTH = 360;

type AlertShareCardProps = {
  alert: CAPAlert;
};

// Off-screen only — rendered so AlertShareButton can capture it into a
// branded PNG via react-native-view-shot. Everything a forwarded chat
// message needs is baked into the image itself (severity, title, where/when,
// top action, source), since it has to stand alone after being forwarded
// several times down a chain with no surrounding app context.
const AlertShareCard = forwardRef<View, AlertShareCardProps>(({ alert }, ref) => {
  const { t } = useTranslation();
  const info = alert.info?.[0];

  if (!info) return null;

  const level = alertLevel(info);
  const bandColor = WARNING_COLORS[level];
  const bandTextColor = WARNING_BAND_TEXT_COLORS[level];
  const headline = info.headline || info.event;
  const whenText = getWhenText(t, info);
  const whereText = getWhereText(info);
  const topWhatToDo = getWhatToDo(info)[0];
  const sourceLine = getShareSourceLine(alert, info);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <View style={[styles.band, { backgroundColor: bandColor }]}>
        <Icon source="alert" size={22} color={bandTextColor} />
        <Text style={[styles.bandLabel, { color: bandTextColor }]}>{t(BAND_LABEL_KEYS[level])}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.headline}>{headline}</Text>

        {whereText && (
          <Text style={styles.meta}><Text style={styles.metaLabel}>{t('alert.whereLabel')}: </Text>{whereText}</Text>
        )}
        {whenText && (
          <Text style={styles.meta}><Text style={styles.metaLabel}>{t('alert.whenLabel')}: </Text>{whenText}</Text>
        )}
        {topWhatToDo && (
          <Text style={styles.meta}><Text style={styles.metaLabel}>{t('alert.whatToDo')}: </Text>{topWhatToDo}</Text>
        )}

        {sourceLine && <Text style={styles.source}>{t('alert.share.from')} {sourceLine}</Text>}
      </View>
    </View>
  );
});

AlertShareCard.displayName = 'AlertShareCard';

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingVertical: space[3],
    paddingHorizontal: space[4],
  },
  bandLabel: {
    fontSize: 16,
    fontFamily: fonts.extraBold,
  },
  body: {
    padding: space[4],
    gap: space[2],
  },
  headline: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.textStrong,
  },
  meta: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 20,
  },
  metaLabel: {
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
  source: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    marginTop: space[2],
    paddingTop: space[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default AlertShareCard;
