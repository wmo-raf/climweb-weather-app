import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

import weatherIcons from "@/lib/forecast/weathericons.constant";
import { ForecastDayRecord } from "@/lib/forecast/types";
import { describeDaySummary } from "@/lib/forecast/day-parts";
import { CAPAlert, alertLevel } from "@/lib/alerts/providers/cap-alerts/alert";
import { ALERT_LEAD_WORD_KEYS, getWarningTintColors } from "@/lib/alerts/providers/cap-alerts/icons";
import { ThemeColors, fonts, radius, shadow, space, touchTarget } from "@/lib/theme";
import { useThemeColors } from "@/lib/theme/ThemeContext";

type DayRowProps = {
  summary: ForecastDayRecord | undefined;
  // True only for the first row ("Tomorrow — Wednesday" instead of just "Wednesday").
  isTomorrow?: boolean;
  // A relevant alert whose window overlaps this day, if any — renders as an
  // inline chip below the row (e.g. "Warning: Strong Wind Warning").
  alert?: CAPAlert;
  onSelectAlert?: () => void;
};

const DayRow = ({ summary, isTomorrow, alert, onSelectAlert }: DayRowProps) => {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!summary) {
    return (
      <View style={styles.dayRow}>
        <View style={styles.card}>
          <Text style={styles.whiteText}>{t('Forecast unavailable')}.</Text>
        </View>
      </View>
    );
  }

  const minTemp = Math.round(summary.minTemperature || 0);
  const maxTemp = Math.round(summary.maxTemperature || 0);
  const icon = summary.weatherSymbol;
  const iconSource = icon ? weatherIcons[icon] : undefined;
  const dayAbbrev = DateTime.fromISO(summary.day).toLocaleString({ weekday: "short" });
  const weekday = t(dayAbbrev);
  const dayLabel = isTomorrow ? `${t('today.tomorrow')} — ${weekday}` : weekday;
  const description = describeDaySummary(t, summary);

  const alertInfo = alert?.info?.[0];
  const level = alertInfo ? alertLevel(alertInfo) : undefined;
  const tint = level ? getWarningTintColors(colors)[level] : undefined;

  return (
    <View style={styles.dayRow}>
      <View
        style={[styles.card, alertInfo && styles.cardWithChip]}
        accessible={true}
        accessibilityLabel={`${dayLabel}: ${description} ${minTemp} to ${maxTemp} degrees.`}
      >
        {iconSource && <Icon source={iconSource} size={40} />}
        <View style={styles.textBlock}>
          <Text style={styles.dayName}>{dayLabel}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        <View style={styles.rightBlock}>
          <Text style={styles.tempRange}>{minTemp}&deg; – {maxTemp}&deg;</Text>
          <Icon source="chevron-right" size={20} color={colors.textSubtle} />
        </View>
      </View>

      {alertInfo && level && tint &&
        <TouchableOpacity
          style={[styles.alertChip, { backgroundColor: tint.bg }]}
          onPress={onSelectAlert}
          accessibilityLabel={`${t(ALERT_LEAD_WORD_KEYS[level])}: ${alertInfo.event}`}
        >
          <Icon source="alert" size={18} color={tint.text} />
          <Text style={[styles.alertChipText, { color: tint.text }]} numberOfLines={1}>
            {t(ALERT_LEAD_WORD_KEYS[level])}: {alertInfo.event}
          </Text>
          <Icon source="chevron-right" size={18} color={tint.text} />
        </TouchableOpacity>
      }
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  dayRow: {
    fontFamily: fonts.regular,
    width: "100%",
    marginTop: space[2],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    padding: space[4],
    borderRadius: radius.lg,
    minHeight: touchTarget.nav,
    ...shadow.sm,
  },
  cardWithChip: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  textBlock: {
    flex: 1,
  },
  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
  },
  whiteText: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'left'
  },
  dayName: {
    color: colors.textStrong,
    fontFamily: fonts.bold,
    fontSize: 16,
    textAlign: 'left'
  },
  description: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: space[1],
  },
  tempRange: {
    color: colors.textStrong,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  alertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    padding: space[3],
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    minHeight: touchTarget.nav,
  },
  alertChipText: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
});

export default React.memo(DayRow);
