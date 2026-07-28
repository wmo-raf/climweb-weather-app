import React, { JSX, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import ListenButton from './ListenButton';
import AlertShareButton from './AlertShareButton';
import AlertAreaMap from './AlertAreaMap';
import { CAPAlert, alertLevel } from '@/lib/alerts/providers/cap-alerts/alert';
import { WARNING_BAND_TEXT_COLORS, WARNING_COLORS, getWarningTintColors } from '@/lib/alerts/providers/cap-alerts/icons';
import { getWhatToDo, getWhenText, getWhereText } from '@/lib/alerts/providers/cap-alerts/plain-language';
import { ThemeColors, fonts, lightColors, radius, shadow, space } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';

const BAND_LABEL_KEYS: { [k in 'Red' | 'Yellow' | 'Orange' | 'Cyan' | 'Blue']: string } = {
  Red: 'alert.band.red',
  Orange: 'alert.band.orange',
  Yellow: 'alert.band.yellow',
  Cyan: 'alert.band.notice',
  Blue: 'alert.band.notice',
};

type AlertCardProps = {
  alert: CAPAlert;
  // Warnings tab list context: collapses the full "What to do" checklist
  // into a single tappable "Tap here to see what to do" row instead of
  // repeating the full checklist per item in a long nationwide list, and
  // omits the AlertAreaMap mini-map entirely (kept to the single-alert
  // detail view only, not repeated per row in a long list). The
  // single-alert detail view (WeatherWarning.tsx) leaves this false and
  // still gets the full checklist and the mini-map.
  compact?: boolean;
  // Called when the compact "what to do" row is tapped — typically
  // navigates to the single-alert detail view. Unused when compact=false.
  onPress?: () => void;
};

// Full alert detail: colored severity band + Listen, headline, When/Where,
// and a "What to do" checklist (or, in compact mode, a tappable summary
// row). Used standalone on the single-alert deep link (WeatherWarning.tsx)
// and repeated (compact) in the Warnings tab's list.
function AlertCard({ alert, compact = false, onPress }: AlertCardProps): JSX.Element | null {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const info = alert.info?.[0];

  if (!info) return null;

  const level = alertLevel(info);
  const bandColor = WARNING_COLORS[level];
  const bandTextColor = WARNING_BAND_TEXT_COLORS[level];
  const tint = getWarningTintColors(colors)[level];
  // The Listen/Share pills always sit on a solid-white circle regardless of
  // theme (design brief: white pills stay white with colored icon in both
  // themes) — use the light-mode tint fixed, not the retinted one.
  const pillTint = getWarningTintColors(lightColors)[level];
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
        <View style={styles.bandActions}>
          <ListenButton text={speechText} textColor={pillTint.text} backgroundColor="#FFFFFF" />
          <AlertShareButton alert={alert} textColor={pillTint.text} backgroundColor="#FFFFFF" />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.headline}>{headline}</Text>

        {(whenText || whereText) && (
          <>
            <View style={styles.divider} />
            <Text style={styles.meta}>
              {whenText && <Text><Text style={styles.metaLabel}>{t('alert.whenLabel')}: </Text>{whenText}{whereText ? '\n' : ''}</Text>}
              {whereText && <Text><Text style={styles.metaLabel}>{t('alert.whereLabel')}: </Text>{whereText}</Text>}
            </Text>
          </>
        )}

        {!compact && <AlertAreaMap polygon={info.area?.polygon} color={bandColor} />}

        {whatToDo.length > 0 && (
          compact ? (
            <TouchableOpacity
              style={[styles.whatToDoCompact, { backgroundColor: tint.bg }]}
              onPress={onPress}
              accessibilityLabel={t('alert.tapToSeeWhatToDo')}
            >
              <Icon source="clipboard-text-outline" size={18} color={tint.text} />
              <Text style={[styles.whatToDoCompactText, { color: tint.text }]}>{t('alert.tapToSeeWhatToDo')}</Text>
              <Icon source="chevron-right" size={20} color={tint.text} />
            </TouchableOpacity>
          ) : (
            <View style={[styles.whatToDoBox, { backgroundColor: tint.bg }]}>
              <Text style={[styles.whatToDoTitle, { color: tint.text }]}>{t('alert.whatToDo')}</Text>
              {whatToDo.map((item, idx) => (
                <View key={idx} style={styles.checklistRow}>
                  <Icon source="check-circle" size={18} color={tint.text} />
                  <Text style={styles.checklistText}>{item}</Text>
                </View>
              ))}
            </View>
          )
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  // Band and body fuse into one seamless shape instead of two
  // separately-rounded pieces with a gap between them — the bottom of the
  // band and the top of the body both go square so the whole card reads as
  // a single rounded rectangle, in both compact (list) and full (detail)
  // modes.
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  bandActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  body: {
    padding: space[4],
    borderRadius: radius.lg,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    ...shadow.sm,
  },
  headline: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.textStrong,
  },
  // Inset (left/right padded) divider between the headline and the
  // When/Where text — sits inside `body`'s own padding, so no extra
  // horizontal margin is needed to keep it off the card edges.
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: space[3],
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
  whatToDoCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[4],
    padding: space[4],
    borderRadius: radius.md,
  },
  whatToDoCompactText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.semiBold,
  },
  whatToDoBox: {
    marginTop: space[4],
    padding: space[4],
    borderRadius: radius.md,
  },
  whatToDoTitle: {
    fontSize: 14,
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

export default React.memo(AlertCard);
