import React, { JSX, useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';

import { WRAP_AT_SPACES } from '@/components/PartCard';
import weatherIcons from '@/lib/forecast/weathericons.constant';
import { DETAIL_PART_LABEL_KEYS, partRangeLabel } from '@/lib/forecast/day-detail';
import { ThemeColors, Fonts } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import { advisoryColors } from './AdvisoryBanner';
import { PartSummary } from './marine';

const GAP = 10;
// Two across while each square gets this much per unit of text size;
// otherwise one (narrow phones at large text sizes, e.g. 200%).
const MIN_SQUARE_WIDTH = 150;

// The parts still to come, two by two. Parts with no data are left out
// and the rest reflow.
function PartSquares({ parts }: { parts: PartSummary[] }): JSX.Element {
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState<number>();
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.width;
    setWidth(previous => (previous !== undefined && Math.abs(previous - measured) < 0.5 ? previous : measured));
  }, []);

  let squareWidth: number | undefined;
  if (width !== undefined) {
    const half = (width - 1 - GAP) / 2;
    squareWidth = Math.floor(half >= MIN_SQUARE_WIDTH * Math.max(1, fontScale) ? half : width - 1);
  }

  return (
    <View style={styles.grid} onLayout={onLayout} testID="at-sea-parts">
      {squareWidth !== undefined && parts.map(part => <PartSquare key={part.name} part={part} width={squareWidth!} />)}
    </View>
  );
}

function PartSquare({ part, width }: { part: PartSummary; width: number }): JSX.Element {
  const { t } = useTranslation();
  const colors = useTheme();
  const squareStyles = useMemo(() => makeStyles(colors), [colors]);

  const start = DateTime.fromISO(part.start, { setZone: true });
  const end = DateTime.fromISO(part.end, { setZone: true });
  const range = partRangeLabel({ startHour: start.hour, endHour: end.hour === 0 ? 24 : end.hour });
  const name = t(DETAIL_PART_LABEL_KEYS[part.name]);
  const sky = part.sky ? t(part.sky.labelKey) : undefined;
  const wind = part.wind ? t(`atSea.wind.${part.wind}`) : undefined;
  const icon = part.sky ? weatherIcons[part.sky.symbol] : undefined;

  const spoken = t('atSea.square.spoken', {
    part: name,
    range: t('dayDetail.rangeSpoken', { start: start.hour, end: end.hour === 0 ? 24 : end.hour }),
    sky: sky ?? t('common.states.notAvailable'),
    wind: wind ?? t('common.states.notAvailable'),
    advisory: t(`atSea.advisory.${part.advisory}`),
  });

  return (
    <View style={[squareStyles.square, { width }]} accessible={true} accessibilityLabel={spoken} testID={`at-sea-part-${part.name}`}>
      <View style={squareStyles.top}>
        <View style={squareStyles.heading}>
          <Text style={squareStyles.name} {...WRAP_AT_SPACES}>{name}</Text>
          <Text style={squareStyles.range}>{range}</Text>
        </View>
        <View style={squareStyles.icon}>{icon && <Icon source={icon} size={36} />}</View>
      </View>
      {sky && <Text style={squareStyles.sky} {...WRAP_AT_SPACES}>{sky}</Text>}
      <View style={squareStyles.divider} />
      <View style={squareStyles.windRow}>
        <Icon source="weather-windy" size={18} color={colors.textStrong} />
        <Text style={squareStyles.wind} {...WRAP_AT_SPACES}>{wind ?? t('common.states.notAvailable')}</Text>
        <View style={[squareStyles.dot, { backgroundColor: advisoryColors(colors, part.advisory).accent }]} testID={`at-sea-dot-${part.advisory}`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  square: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  heading: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  // textSubtle keeps 4.5:1 on the square in both themes.
  range: {
    fontSize: 11.5,
    fontFamily: Fonts.sans.regular,
    color: colors.textSubtle,
  },
  icon: {
    width: 36,
    height: 36,
    flexShrink: 0,
  },
  sky: {
    fontSize: 13,
    fontFamily: Fonts.sans.regular,
    color: colors.textStrong,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wind: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
});

export default PartSquares;
