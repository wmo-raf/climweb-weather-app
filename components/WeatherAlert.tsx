import React from "react";
import { Image, ImageSourcePropType, StyleProp, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";
import { DateTime } from "luxon";

import { CAPAlert, alertLevel } from '@/lib/alerts/providers/cap-alerts/alert';
import { WARNING_COLORS, WEATHER_WARNING_ICONS } from "@/lib/alerts/providers/cap-alerts/icons";
import { colors, fonts, radius, space } from "@/lib/theme";

type WeatherAlertProps = {
  alert: CAPAlert;
  style?: StyleProp<{}>,
  onPress: (alert: {}) => void
}
const WeatherAlert = (props: WeatherAlertProps) => {
  const { alert, onPress } = props;

  return (
    <TouchableOpacity style={styles.wrapper} onPress={() => onPress({})} accessibilityLabel={`${getAlertStatus(alert)}: ${getAlertEvent(alert)}, level ${getAlertLevel(alert)?.toLowerCase()}`}>
      <View style={styles.glassWrapper}>
        <View style={{ ...styles.opacity, backgroundColor: getWarningColor(getAlertLevel(alert)) }}>
          <View style={styles.warning}>
            <View style={styles.warningIcon}><Image source={getWarningIcon(getAlertLevel(alert) as string)} style={styles.icon} /></View>
            <View style={styles.warningText}>
              <Text style={styles.header}>
                {getAlertStatus(alert)}: {getAlertEvent(alert)}{'\n'}Level: {getAlertLevel(alert)?.toLowerCase()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
};


function getWarningIcon(level: string): ImageSourcePropType {
  return WEATHER_WARNING_ICONS[level.toLowerCase()];
}

function getWarningColor(level?: keyof typeof WARNING_COLORS): string | undefined {
  if (!level) {
    return;
  }
  return WARNING_COLORS[level];
}

function getAlertStatus(alert: CAPAlert) {
  if (!alert.info || !alert.info.length) {
    return;
  }

  const { onset, effective } = alert.info[0];
  const start = DateTime.fromISO(onset || effective || alert?.sent);
  return start <= DateTime.now() ? 'Ongoing' : 'Expected';
}

function getAlertEvent(alert: CAPAlert) {
  if (!alert.info || !alert.info.length || !alert.info[0].event) {
    return;
  }
  return alert.info[0].event;
}

function getAlertLevel(alert: CAPAlert) {
  if (!alert.info || !alert.info.length) {
    return;
  }
  return alertLevel(alert.info[0]);
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginTop: 0,
  },
  glassWrapper: {
    width: '100%',
  },
  opacity: {
    width: '100%',
    zIndex: 1,
    borderRadius: radius.lg,
    paddingRight: space[4],
    paddingLeft: space[4],
    paddingTop: space[2],
    paddingBottom: space[3],
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: space[3],
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 35,
    height: 30,
  },
  warningText: {
    flex: 6,
    paddingTop: space[1],
  },
  header: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textInverse,
  },
});

export default WeatherAlert;
