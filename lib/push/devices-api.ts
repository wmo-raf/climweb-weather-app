import Axios, { AxiosRequestConfig } from 'axios';

import { createPolicy } from '@/lib/http/resilience';
import { DEVICES_API_URL, APP_USER_AGENT } from '@/config';

export type AlertAreaInput = {
  name: string;
  lat: number;
  lon: number;
};

export type RegisterDeviceInput = {
  expoPushToken: string;
  // Areas the user explicitly chose to receive weather warnings for (see
  // lib/hooks/alert-areas.hook.ts), sent as the place's own fixed lat/lon
  // (see lib/geo/geonames.ts) rather than a live device position — the
  // backend matches warning polygons against these points but never learns
  // the device's actual GPS location, only which places the user picked.
  areas: AlertAreaInput[];
  platform: 'ios' | 'android';
  appVersion?: string;
};

const requestConfig: AxiosRequestConfig = {
  headers: { 'User-Agent': APP_USER_AGENT },
  timeout: 5_000,
};

// No fallback URL here (single backend, unlike the forecast/alerts
// providers) — once this is exhausted the caller just sees the failure and
// tries again on the next sync tick (see lib/store/push.store.ts).
const resilience = createPolicy('Device Registration').withRetry().withBreaker().compose();

export async function registerDevice(input: RegisterDeviceInput): Promise<void> {
  await resilience.execute(() =>
    Axios.post(`${DEVICES_API_URL}/api/devices/register`, input, requestConfig)
  );
}
