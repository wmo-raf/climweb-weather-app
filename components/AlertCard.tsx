import React, { JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import ListenButton from './ListenButton';
import { CAPAlert, alertLevel } from '@/lib/alerts/providers/cap-alerts/alert';
import { WARNING_BAND_TEXT_COLORS, WARNING_COLORS, WARNING_TINT_COLORS } from '@/lib/alerts/providers/cap-alerts/icons';
import { getWhatToDo, getWhenText, getWhereText } from '@/lib/alerts/providers/cap-alerts/plain-language';
import { colors, fonts, radius, shadow, space } from '@/lib/theme';

const BAND_LABEL_KEYS: { [k in 'Red' | 'Yellow' | 'Orange' | 'Cyan' | 'Blue']: string } = {
  Red: 'alert.band.red',
  Orange: 'alert.band.orange',
  Yellow: 'alert.band.yellow',
  Cyan: 'alert.band.notice',
  Blue: 'alert.band.notice',
};

type AlertCardProps = {
  alert: CAPAlert;
};

// Full alert detail: colored severity band + Listen, headline, When/Where,
// and a "What to do" checklist. Used standalone on the single-alert deep
// link (WeatherWarning.tsx) and repeated in the Warnings tab's list.
function AlertCard({ alert }: AlertCardProps): JSX.Element | null {
  const { t } = useTranslation();
  const info = alert.info?.[0];

  if (!info) return null;

  const level = alertLevel(info);
  const bandColor = WARNING_COLORS[level];
  const bandTextColor = WARNING_BAND_TEXT_COLORS[level];
  const tint = WARNING_TINT_COLORS[level];
  const headline = info.headline || info.event;
  const whatToDo = getWhatToDo(info);
  const whenText = getWhenText(t, info);
  const whereText = getWhereText(info);

  const speechText = [
    t(BAND_LABEL_KEYS[level]),
    headline,
    whenText,
    whereText ? `${t('alert.whereLabel')}: ${whereText}` : undefined,
    whatToDo.length ? `${t('alert.whatToDo')}. ${whatToDo.join('. ')}` : undefined,
  ].filter(Boolean).join('. ');

  return (
    <View>
      <View style={[styles.band, { backgroundColor: bandColor }]}>
        <View style={styles.bandLeft}>
          <Icon source="alert" size={22} color={bandTextColor} />
          <Text style={[styles.bandLabel, { color: bandTextColor }]}>{t(BAND_LABEL_KEYS[level])}</Text>
        </View>
        <ListenButton text={speechText} textColor={tint.text} backgroundColor={colors.bg} />
      </View>

      <View style={styles.body}>
        <Text style={styles.headline}>{headline}</Text>

        {(whenText || whereText) &&
          <Text style={styles.meta}>
            {whenText && <Text><Text style={styles.metaLabel}>{t('alert.whenLabel')}: </Text>{whenText}{whereText ? '\n' : ''}</Text>}
            {whereText && <Text><Text style={styles.metaLabel}>{t('alert.whereLabel')}: </Text>{whereText}</Text>}
          </Text>
        }

        {whatToDo.length > 0 &&
          <View style={[styles.whatToDoBox, { backgroundColor: tint.bg }]}>
            <Text style={[styles.whatToDoTitle, { color: tint.text }]}>{t('alert.whatToDo')}</Text>
            {whatToDo.map((item, idx) => (
              <View key={idx} style={styles.checklistRow}>
                <Icon source="check-circle" size={18} color={tint.text} />
                <Text style={styles.checklistText}>{item}</Text>
              </View>
            ))}
          </View>
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.lg,
  },
  bandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    flexShrink: 1,
  },
  bandLabel: {
    fontSize: 15,
    fontFamily: fonts.bold,
  },
  body: {
    marginTop: space[4],
    padding: space[4],
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  headline: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textStrong,
  },
  meta: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 22,
    marginTop: space[3],
  },
  metaLabel: {
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
  whatToDoBox: {
    marginTop: space[4],
    padding: space[4],
    borderRadius: radius.md,
  },
  whatToDoTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    marginBottom: space[2],
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[2],
    marginTop: space[2],
  },
  checklistText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },
});

export default AlertCard;
