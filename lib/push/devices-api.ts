import Axios, { AxiosRequestConfig } from 'axios';
import { ConsecutiveBreaker, handleAll, circuitBreaker, CircuitBreakerPolicy } from 'cockatiel';

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

// Same shape as the forecast/alerts providers' breaker (see
// lib/forecast/providers/yr-location-forecast.provider.ts) — stop calling a
// failing backend for 15s after 2 consecutive failures, rather than
// retrying into a down service on every location/foreground tick.
const breakerPolicy: CircuitBreakerPolicy = circuitBreaker(handleAll, {
  halfOpenAfter: 15_000,
  breaker: new ConsecutiveBreaker(2),
});

export async function registerDevice(input: RegisterDeviceInput): Promise<void> {
  await breakerPolicy.execute(() =>
    Axios.post(`${DEVICES_API_URL}/api/devices/register`, input, requestConfig)
  );
}
