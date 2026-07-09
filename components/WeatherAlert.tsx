import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { CAPAlert, alertLevel } from '@/lib/alerts/providers/cap-alerts/alert';
import { WARNING_BAND_TEXT_COLORS, WARNING_COLORS, WEATHER_WARNING_ICONS } from "@/lib/alerts/providers/cap-alerts/icons";
import { fonts, radius, space } from "@/lib/theme";

type WeatherAlertProps = {
  alert: CAPAlert;
  onPress: () => void;
}

const LEAD_WORD_KEYS: { [k in 'Red' | 'Yellow' | 'Orange' | 'Cyan' | 'Blue']: string } = {
  Red: 'alert.lead.red',
  Orange: 'alert.lead.orange',
  Yellow: 'alert.lead.yellow',
  Cyan: 'alert.lead.notice',
  Blue: 'alert.lead.notice',
};

const WeatherAlert = ({ alert, onPress }: WeatherAlertProps) => {
  const { t } = useTranslation();
  const info = alert.info?.[0];

  if (!info) return null;

  const level = alertLevel(info);
  const leadWord = t(LEAD_WORD_KEYS[level]);
  const backgroundColor = WARNING_COLORS[level];
  const textColor = WARNING_BAND_TEXT_COLORS[level];
  const icon = WEATHER_WARNING_ICONS[level.toLowerCase()];

  return (
    <TouchableOpacity
      style={[styles.wrapper, { backgroundColor }]}
      onPress={onPress}
      accessibilityLabel={`${leadWord}: ${info.event}. ${t('alert.tapToSeeWhatToDo')}`}
    >
      {icon && <Icon source={icon} size={28} color={textColor} />}
      <View style={styles.textBlock}>
        <Text style={[styles.headline, { color: textColor }]} numberOfLines={2}>{leadWord}: {info.event}</Text>
        <Text style={[styles.subtext, { color: textColor }]}>{t('alert.tapToSeeWhatToDo')}</Text>
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
    borderRadius: radius.lg,
    padding: space[4],
    gap: space[3],
  },
  textBlock: {
    flex: 1,
  },
  headline: {
    fontSize: 16,
    fontFamily: fonts.bold,
  },
  subtext: {
    fontSize: 13,
    fontFamily: fonts.regular,
    marginTop: space[1],
  },
});

export default WeatherAlert;
