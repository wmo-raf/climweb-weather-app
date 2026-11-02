import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { soilMoistureWords } from '@/lib/soil/plain-language';
import { ThemeColors, Fonts, Radius, shadow, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

type SoilMoistureCardProps = {
  // m³/m³; the card is left out when there's no value.
  moisture?: number;
};

// "Water in the soil": headline, a Dry / Good / Too wet bar with the
// current value filled in, and one line of advice — all from
// soilMoistureWords, so they can't disagree.
function SoilMoistureCard({ moisture }: SoilMoistureCardProps): JSX.Element | null {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (moisture === undefined) return null;

  const words = soilMoistureWords(moisture);
  const label = t('farming.moisture.label');
  const zones = [
    { key: 'dry', width: words.zoneStarts.good, label: t('farming.moisture.zones.dry') },
    { key: 'good', width: words.zoneStarts.tooWet - words.zoneStarts.good, label: t('farming.moisture.zones.good') },
    { key: 'tooWet', width: 1 - words.zoneStarts.tooWet, label: t('farming.moisture.zones.tooWet') },
  ];

  return (
    <View
      style={styles.card}
      accessible={true}
      accessibilityLabel={`${label}: ${t(words.zone)}, ${t(words.headline)}. ${t(words.advice)}`}
      testID="soil-moisture-card"
    >
      <View style={styles.labelRow}>
        <Icon source="water" size={24} color={colors.primary} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.headline}>{t(words.headline)}</Text>

      <View style={styles.track}>
        {zones.map(zone => <View key={zone.key} style={[styles.zone, { flex: zone.width }]} />)}
        <View style={[styles.fill, { width: `${words.position * 100}%` }]} />
      </View>
      <View style={styles.zoneLabels}>
        {zones.map(zone => (
          <Text key={zone.key} style={[styles.zoneLabel, { flex: zone.width }, zone.key === words.band && styles.zoneLabelActive]}>
            {zone.label}
          </Text>
        ))}
      </View>

      <Text style={styles.advice}>{t(words.advice)}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  // Highlighted like Today's current-conditions card.
  card: {
    padding: Spacing.lg,
    backgroundColor: colors.bgTint,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.large,
    ...shadow.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  label: {
    flexShrink: 1,
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  headline: {
    fontSize: 24,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
    marginTop: Spacing.md,
  },
  track: {
    flexDirection: 'row',
    gap: 2,
    height: 14,
    marginTop: Spacing.lg,
    borderRadius: Radius.small,
    overflow: 'hidden',
  },
  zone: {
    backgroundColor: colors.bgMuted,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: Radius.small,
  },
  zoneLabels: {
    flexDirection: 'row',
    gap: 2,
    marginTop: Spacing.sm,
  },
  zoneLabel: {
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
    textAlign: 'center',
  },
  zoneLabelActive: {
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  advice: {
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
    marginTop: Spacing.md,
  },
});

export default SoilMoistureCard;
