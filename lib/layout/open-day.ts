import { DateTime } from 'luxon';
import { Href } from 'expo-router';

import { SPARSE_FORECAST } from '@/config';
import { SCREENS } from './constants';

// Where tapping a day (Five Days, or the tablet Today's day list) goes: the
// day-detail screen for a sparse forecast, the hourly table otherwise (see
// EXPO_PUBLIC_SPARSE_FORECAST).
export function dayHref(day: DateTime, location: string): Href {
  if (SPARSE_FORECAST) {
    return { pathname: SCREENS.DayDetail, params: { location, dayString: day.toISODate()! } } as Href;
  }
  return {
    pathname: SCREENS.Hourly,
    params: {
      location,
      dayString: day.toISO()!,
      startAtCurrentTime: 'no',
      title: day.toLocaleString({ weekday: 'long' }),
    },
  } as Href;
}
