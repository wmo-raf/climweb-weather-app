import { IANAZone, Settings } from 'luxon';

import { APP_TIMEZONE } from '@/config';

// Forecast days are bucketed in the deployment's timezone (see
// parseYrForecast), so "today", day labels and step hours must be worked out
// in that same zone. Left at Luxon's default (the phone's own zone), a phone
// behind it — e.g. a UTC+2 phone on a UTC+3 deployment — reads each day's
// midnight as the previous evening and picks the next day's forecast as
// "today". Making the app zone Luxon's default keeps every DateTime.now() /
// fromISO() in step with the forecast data.
export function applyAppTimezone(zone: string | undefined = APP_TIMEZONE): boolean {
  if (!zone || !IANAZone.isValidZone(zone)) {
    if (__DEV__) {
      console.warn(`EXPO_PUBLIC_APP_TIMEZONE "${zone}" is not a valid IANA timezone; dates will use the device timezone.`);
    }
    return false;
  }
  Settings.defaultZone = zone;
  return true;
}
