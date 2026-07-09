import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { DateTime } from "luxon";

import weatherIcons from "@/lib/forecast/weathericons.constant";
import { ForecastDayRecord } from "@/lib/forecast/types";
import { useTranslation } from "react-i18next";
import { colors, fonts, radius, shadow, space } from "@/lib/theme";

type DayRowProps = {
  summary: ForecastDayRecord | undefined;
};
const DayRow = (props: DayRowProps) => {
  const { t } = useTranslation();
  const { summary } = props;

  if (!summary) {
    return (
      <View style={styles.dayRow}>
        <View style={styles.opacity}>
          <Text variant="bodyMedium" style={{ flex: 2 }}>
            <Text style={styles.whiteText}>{t('Forecast unavailable')}.</Text>
          </Text>
        </View>
      </View>
    );
  }

  const minTemp = summary.minTemperature || 0;
  const maxTemp = summary.maxTemperature || 0;
  const windSpeed = summary.windSpeed || 0;
  const icon = summary.weatherSymbol;
  const iconSource = icon ? weatherIcons[icon] : undefined;
  const dayLabel = DateTime.fromISO(summary.day).toLocaleString({ weekday: "short" });

  return (
    <View style={styles.dayRow}>
      <View style={styles.opacity}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium" style={{ flex: 1 }}>
            <Text style={styles.dayName}>{t(dayLabel)}</Text>
          </Text>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', marginTop: 2 }}>
          <View style={{ flex: 3, flexDirection: 'column' }}>
            <Text style={{ ...styles.whiteText, flex: 1 }}>{t("Min")}{"\n"}<Text style={styles.whiteParameters}>{Math.round(minTemp)}&deg;</Text></Text>
          </View>
          <View style={{ flex: 3, flexDirection: 'column' }}>
            <Text style={{ ...styles.whiteText, flex: 1 }}>{t("Max")}{"\n"}<Text style={styles.whiteParameters}>{Math.round(maxTemp)}&deg;</Text></Text>
          </View>
          <View style={{ flex: 2, flexDirection: 'column' }}>
            <Text style={{ ...styles.whiteText, flex: 1 }}>{t("Km/h")}{"\n"}<Text style={styles.whiteParameters}>{Math.round(windSpeed)}</Text></Text>
          </View>
          <View style={{ flex: 2, margin: 0, padding: 0 }} accessible={true} accessibilityLabel={`Weather symbol on ${dayLabel} is ${icon?.split('_').join(' ')}.`}>
            {iconSource && <Icon source={iconSource} size={55} />}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dayRow: {
    fontFamily: fonts.regular,
    width: "100%",
    marginTop: space[2],
  },
  opacity: {
    flexDirection: 'column',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    padding: space[2],
    borderRadius: radius.lg,
    ...shadow.sm,
  },
  whiteText: {
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'left'
  },
  whiteParameters: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    textAlign: 'left'
  },
  dayName: {
    color: colors.textStrong,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    textAlign: 'left'
  },
});

export default DayRow;
