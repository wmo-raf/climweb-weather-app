import React, { JSX, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import AdaptiveCardGrid from './AdaptiveCardGrid';
import PartCard, { WRAP_AT_SPACES } from './PartCard';
import weatherIcons from '@/lib/forecast/weathericons.constant';
import { CONDITION_LABEL_KEYS, conditionBucket } from '@/lib/forecast/day-parts';
import {
  DETAIL_PART_LABEL_KEYS, DayReadings, DetailPart, DetailStep, dayDetailNote, dayParts, daySummary, partRangeLabel, summaryLine,
} from '@/lib/forecast/day-detail';
import { ThemeColors, Fonts, Radius, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import { useUnits } from '@/lib/hooks/use-units';

type Units = ReturnType<typeof useUnits>;
type Translate = (key: string, options?: Record<string, unknown>) => string;

// "12:00 to 18:00" for screen readers, from "12:00–18:00".
const spokenRange = (t: Translate, label: string) => {
  const [start, end] = label.split('–');
  return t('dayDetail.rangeSpoken', { start, end });
};

// "16° – 27°C" (or just "24°C" when both ends are the same).
const tempRange = (units: Units, low: number | undefined, high: number | undefined) => {
  if (low === undefined || high === undefined) return '';
  if (units.tempValue(low) === units.tempValue(high)) return units.temp(high);
  return `${units.tempValue(low)}° – ${units.temp(high)}`;
};

const tempRangeSpoken = (t: Translate, units: Units, low: number | undefined, high: number | undefined) => {
  if (low === undefined || high === undefined) return undefined;
  if (units.tempValue(low) === units.tempValue(high)) return units.tempSpoken(high);
  return t('dayDetail.rangeSpoken', { start: units.tempSpoken(low), end: units.tempSpoken(high) });
};

type DayDetailProps = {
  steps: DetailStep[];
  // The day's raw readings (high, low, top wind), for the summary card.
  day?: DayReadings;
};

// The body of a day's detail (Five Days › a day): summary, day parts, and a
// note when the steps are coarse, all following the step length the
// provider sent for this day (lib/forecast/day-detail.ts).
function DayDetail({ steps, day }: DayDetailProps): JSX.Element | null {
  const { t } = useTranslation();
  const units = useUnits();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const summary = daySummary(steps, day);
  if (!summary) return null;

  const parts = dayParts(steps);
  const note = dayDetailNote(steps);

  // Summary card
  const summaryTemp = summary.kind === 'single' ? units.temp(summary.temp) : tempRange(units, summary.low, summary.high);
  const summaryTempSpoken = summary.kind === 'single'
    ? (summary.temp !== undefined ? units.tempSpoken(summary.temp) : undefined)
    : tempRangeSpoken(t, units, summary.low, summary.high);
  const line = summaryLine(t, summary);
  const summaryIcon = summary.symbol ? weatherIcons[summary.symbol] : undefined;

  return (
    <View style={styles.wrapper}>
      <View
        style={styles.summaryCard}
        accessible={true}
        accessibilityLabel={[summaryTempSpoken, line].filter(Boolean).join('. ')}
        testID="day-summary"
      >
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTemp} {...WRAP_AT_SPACES}>{summaryTemp}</Text>
          <View style={styles.summaryIcon}>
            {summaryIcon && <Icon source={summaryIcon} size={64} />}
          </View>
        </View>
        <Text style={styles.summaryLine} {...WRAP_AT_SPACES}>{line}</Text>
      </View>

      {parts.length > 0 && (
        <AdaptiveCardGrid
          testID="day-detail-parts"
          capToCount
          count={parts.length}
          renderCard={(i, width) => <DetailPartCard key={parts[i].name} part={parts[i]} width={width} />}
        />
      )}

      {note && (
        <View style={styles.note} testID="day-detail-note">
          <Icon source="information-outline" size={18} color={colors.textSubtle} />
          <Text style={styles.noteText} {...WRAP_AT_SPACES}>{t(`dayDetail.note.${note}`)}</Text>
        </View>
      )}
    </View>
  );
}

function DetailPartCard({ part, width }: { part: DetailPart; width: number }): JSX.Element {
  const { t } = useTranslation();
  const units = useUnits();

  const label = t(DETAIL_PART_LABEL_KEYS[part.name]);
  const range = partRangeLabel(part);
  const condition = t(CONDITION_LABEL_KEYS[conditionBucket(part.symbol)]);
  const spoken = [
    label,
    spokenRange(t, range),
    part.temp !== undefined ? units.tempSpoken(part.temp) : undefined,
    condition,
  ].filter(Boolean).join(', ');

  return (
    <PartCard
      label={label}
      timeRange={range}
      temperature={part.temp !== undefined ? units.temp(part.temp) : ''}
      symbol={part.symbol}
      condition={condition}
      accessibilityLabel={spoken}
      testID={`detail-part-${part.name}`}
      style={{ width }}
    />
  );
}

const card = (colors: ThemeColors) => ({
  borderRadius: Radius.large,
  borderWidth: 1,
  borderColor: colors.border,
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.06,
  shadowRadius: 4,
  boxShadow: '0px 1px 4px 0px rgba(0, 0, 0, 0.05)',
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    gap: Spacing.lg,
  },
  summaryCard: {
    ...card(colors),
    backgroundColor: colors.bgTint,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  summaryTemp: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 40,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    flexShrink: 0,
  },
  summaryLine: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.text,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.sans.regular,
    color: colors.textSubtle,
  },
});

export default DayDetail;
