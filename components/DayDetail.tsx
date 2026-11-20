import React, { JSX, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import AdaptiveCardGrid from './AdaptiveCardGrid';
import PartCard, { WRAP_AT_SPACES } from './PartCard';
import weatherIcons from '@/lib/forecast/weathericons.constant';
import { CONDITION_LABEL_KEYS, conditionBucket } from '@/lib/forecast/day-parts';
import {
  DETAIL_PART_LABEL_KEYS, DetailPart, DetailStep, TableRow, dayDetailNote, dayParts, dayResolution, daySummary,
  partRangeLabel, shortestStep, summaryLine, tableRows,
} from '@/lib/forecast/day-detail';
import { compassPoint } from '@/lib/forecast/plain-language';
import { windSentence } from '@/lib/forecast/wind-sentence';
import { useDayDetailStore } from '@/lib/store/day-detail.store';
import { ThemeColors, Fonts, Radius, Spacing, touchTarget } from '@/lib/theme';
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
};

// The body of a day's detail (Five Days › a day): summary, day parts, and a
// table or a note, all following the step length the provider sent for
// this day (lib/forecast/day-detail.ts).
function DayDetail({ steps }: DayDetailProps): JSX.Element | null {
  const { t } = useTranslation();
  const units = useUnits();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const summary = daySummary(steps);
  if (!summary) return null;

  const parts = dayParts(steps);
  const rows = tableRows(steps);
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

      {rows && <StepTable rows={rows} steps={steps} />}

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
  const rain = units.rainShows(part.rain) ? units.rain(part.rain!) : undefined;
  const spoken = [
    label,
    spokenRange(t, range),
    tempRangeSpoken(t, units, part.tempMin, part.tempMax),
    condition,
    rain ? units.rainSpoken(part.rain!) : undefined,
  ].filter(Boolean).join(', ');

  return (
    <PartCard
      label={label}
      timeRange={range}
      temperature={tempRange(units, part.tempMin, part.tempMax)}
      temperatureWraps
      symbol={part.symbol}
      condition={condition}
      rain={rain}
      accessibilityLabel={spoken}
      testID={`detail-part-${part.name}`}
      style={{ width }}
    />
  );
}

// Expandable table, one row per step. Starts collapsed; the choice lasts
// for the session (lib/store/day-detail.store.ts).
function StepTable({ rows, steps }: { rows: TableRow[]; steps: DetailStep[] }): JSX.Element {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const expanded = useDayDetailStore(s => s.tableExpanded);
  const setExpanded = useDayDetailStore(s => s.setTableExpanded);

  const longest = dayResolution(steps) as number;
  const shortest = shortestStep(steps) ?? longest;
  const title = shortest !== longest
    ? t('dayDetail.intervalMixed', { shortest, longest })
    : t('dayDetail.interval', { count: longest });

  return (
    <View style={styles.tableCard}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={title}
        style={styles.tableHeader}
        testID="day-detail-table-toggle"
      >
        <Text style={styles.tableTitle} {...WRAP_AT_SPACES}>{title}</Text>
        <Icon source={expanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.primary} />
      </Pressable>
      {expanded && rows.map((row, i) => <StepRow key={row.start} row={row} first={i === 0} />)}
    </View>
  );
}

function StepRow({ row, first }: { row: TableRow; first: boolean }): JSX.Element {
  const { t } = useTranslation();
  const units = useUnits();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const iconSource = weatherIcons[row.symbol];
  const condition = t(CONDITION_LABEL_KEYS[conditionBucket(row.symbol)]);
  const temp = row.temp !== undefined ? units.temp(row.temp) : '';

  const hasRain = units.rainShows(row.rain);
  const rain = row.rain === undefined ? '–' : hasRain ? units.rain(row.rain) : t('dayDetail.rainNone');
  const rainSpoken = row.rain === undefined ? undefined : hasRain ? units.rainSpoken(row.rain) : t('dayDetail.rainNoneSpoken');

  // "SE 16 km/h"; no direction when it's missing or the speed shows as 0.
  let wind = '';
  let windSpoken: string | undefined;
  if (row.windSpeed !== undefined && Number.isFinite(row.windSpeed)) {
    const speed = units.wind(row.windSpeed);
    const calm = units.wind(row.windSpeed) === units.wind(0);
    const hasDirection = row.windFrom !== undefined && Number.isFinite(row.windFrom) && !calm;
    wind = hasDirection
      ? t('dayDetail.windCell', { direction: t(`compass.${compassPoint(row.windFrom!)}.short`), speed })
      : speed;
    windSpoken = windSentence(t, row.windSpeed, row.windFrom, units.prefs.wind, { spoken: true });
  }

  const spoken = [
    spokenRange(t, row.label),
    row.temp !== undefined ? units.tempSpoken(row.temp) : undefined,
    condition,
    rainSpoken,
    windSpoken,
  ].filter(Boolean).join(', ');

  return (
    <View style={[styles.row, !first && styles.rowDivider]} accessible={true} accessibilityLabel={spoken} testID={`day-detail-row-${row.label}`}>
      <Text style={styles.rowTime} {...WRAP_AT_SPACES}>{row.label}</Text>
      <View style={styles.rowCells}>
        <View style={styles.cell}>
          <View style={styles.rowIcon}>{iconSource && <Icon source={iconSource} size={32} />}</View>
          <Text style={styles.rowTemp}>{temp}</Text>
        </View>
        <View style={styles.cell}>
          <Icon source="water-outline" size={18} color={colors.textSubtle} />
          <Text style={styles.rowValue} {...WRAP_AT_SPACES}>{rain}</Text>
        </View>
        {wind !== '' && (
          <View style={styles.cell}>
            <Icon source="weather-windy" size={18} color={colors.textSubtle} />
            <Text style={styles.rowValue} {...WRAP_AT_SPACES}>{wind}</Text>
          </View>
        )}
      </View>
    </View>
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
  tableCard: {
    ...card(colors),
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    minHeight: touchTarget.nav,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  tableTitle: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  // Time, then the values; they wrap onto further lines when the text is
  // large or the screen narrow, rather than squeezing.
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: Spacing.lg,
    rowGap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: touchTarget.nav,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowTime: {
    minWidth: 104,
    fontSize: 14,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  rowCells: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: Spacing.lg,
    rowGap: Spacing.xs,
    flexShrink: 1,
    minWidth: 0,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  rowIcon: {
    width: 32,
    height: 32,
  },
  rowTemp: {
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  rowValue: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
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
