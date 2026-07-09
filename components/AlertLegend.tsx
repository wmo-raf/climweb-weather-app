import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { WARNING_COLORS } from '@/lib/alerts/providers/cap-alerts/icons';
import { colors, fonts, radius, shadow, space } from '@/lib/theme';

// "Green" isn't a real CAP severity in this app's data (only Red/Orange/
// Yellow have icon assets and are commonly issued) — it stands for "no
// warnings right now", which the legend spells out for the traffic-light
// mental model even though it's never a rendered alert band.
const ROWS: { color: string; labelKey: string; descriptionKey: string }[] = [
  { color: WARNING_COLORS.Red, labelKey: 'legend.red.label', descriptionKey: 'legend.red.description' },
  { color: WARNING_COLORS.Orange, labelKey: 'legend.orange.label', descriptionKey: 'legend.orange.description' },
  { color: WARNING_COLORS.Yellow, labelKey: 'legend.yellow.label', descriptionKey: 'legend.yellow.description' },
  { color: colors.success, labelKey: 'legend.green.label', descriptionKey: 'legend.green.description' },
];

function AlertLegend() {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t('legend.title')}</Text>
      {ROWS.map(row => (
        <View key={row.labelKey} style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: row.color }]} />
          <View style={styles.textBlock}>
            <Text style={styles.label}>{t(row.labelKey)}</Text>
            <Text style={styles.description}>{t(row.descriptionKey)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space[4],
    ...shadow.sm,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
    marginBottom: space[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: space[3],
    gap: space[3],
  },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: radius.sm,
    marginTop: 3,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
  },
  description: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text,
    marginTop: 2,
  },
});

export default AlertLegend;
