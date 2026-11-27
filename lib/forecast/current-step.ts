import { DateTime } from 'luxon';

import { ForecastRecord, ForecastStepRecord } from './types';

// The forecast step covering "now": the latest one that has started, or
// the first one when none has yet.
export function currentStep(forecast: ForecastRecord, now: DateTime): ForecastStepRecord | undefined {
  const steps = forecast.days.flatMap(day => day.steps);
  const started = steps.filter(step => DateTime.fromISO(step.time) <= now);
  return started[started.length - 1] ?? steps[0];
}
