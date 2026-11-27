import React, { JSX } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import PartCard from './PartCard';
import { DayPart, DayPartSummary, DAY_PART_LABEL_KEYS, CONDITION_LABEL_KEYS, conditionBucket } from '@/lib/forecast/day-parts';
import { useUnits } from '@/lib/hooks/use-units';

type DayPartCardProps = {
  part: DayPart;
  summary: DayPartSummary;
  style?: StyleProp<ViewStyle>;
};

// One of Today's day parts: name, temperature with icon, condition. Read as
// one item by screen readers.
function DayPartCard({ part, summary, style }: DayPartCardProps): JSX.Element {
  const { t } = useTranslation();
  const units = useUnits();
  const partLabel = t(DAY_PART_LABEL_KEYS[part]);
  const conditionLabel = t(CONDITION_LABEL_KEYS[conditionBucket(summary.weatherSymbol)]);

  return (
    <PartCard
      label={partLabel}
      temperature={units.temp(summary.temperature || 0)}
      symbol={summary.weatherSymbol}
      condition={conditionLabel}
      accessibilityLabel={`${partLabel}, ${units.tempSpoken(summary.temperature || 0)}, ${conditionLabel}`}
      testID={`day-part-${part}`}
      style={style}
    />
  );
}

export default DayPartCard;
