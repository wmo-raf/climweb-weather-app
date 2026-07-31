import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { CAPAlert, alertLevel } from '@/lib/alerts/providers/cap-alerts/alert';
import { ALERT_LEAD_WORD_KEYS, WARNING_BAND_TEXT_COLORS, WARNING_COLORS, WEATHER_WARNING_ICONS } from "@/lib/alerts/providers/cap-alerts/icons";
import { Fonts, Radius, Spacing } from '@/lib/theme';

type WeatherAlertProps = {
  alert: CAPAlert;
  onPress: () => void;
  // Number of other active alerts beyond this one — when > 0, the banner
  // becomes a consolidated "+N more warnings" summary instead of pointing
  // at this specific alert's detail.
  extraCount?: number;
}

const WeatherAlert = ({ alert, onPress, extraCount = 0 }: WeatherAlertProps) => {
  const { t } = useTranslation();
  const info = alert.info?.[0];

  if (!info) return null;

  const level = alertLevel(info);
  const leadWord = t(ALERT_LEAD_WORD_KEYS[level]);
  const backgroundColor = WARNING_COLORS[level];
  const textColor = WARNING_BAND_TEXT_COLORS[level];
  const icon = WEATHER_WARNING_ICONS[level.toLowerCase()];
  const subtext = extraCount > 0
    ? t(extraCount === 1 ? 'alert.moreWarningsSingular' : 'alert.moreWarningsPlural', { count: extraCount })
    : t('alert.tapToSeeWhatToDo');

  return (
    <TouchableOpacity
      style={[styles.wrapper, { backgroundColor }]}
      onPress={onPress}
      accessibilityLabel={`${leadWord}: ${info.event}. ${subtext}`}
    >
      {icon && <Icon source={icon} size={28} color={textColor} />}
      <View style={styles.textBlock}>
        <Text style={[styles.headline, { color: textColor }]} numberOfLines={2}>{leadWord}: {info.event}</Text>
        <Text style={[styles.subtext, { color: textColor }]}>{subtext}</Text>
      </View>
      <Icon source="chevron-right" size={24} color={textColor} />
    </TouchableOpacity>
  )
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: Radius.medium,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  headline: {
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
  },
  subtext: {
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    marginTop: Spacing.sm,
  },
});

export default WeatherAlert;
