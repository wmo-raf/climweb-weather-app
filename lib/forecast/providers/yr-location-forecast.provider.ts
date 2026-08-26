import Axios, { AxiosRequestConfig } from 'axios';

import { createPolicy, PolicyBuilder } from '@/lib/http/resilience';
import { YrForecast } from '../types'
import { PRIMARY_API_URL, FALLBACK_API_URL, APP_USER_AGENT } from '../../../config';
import { LocationForecastInterface } from '../interfaces';

/**
 * Download a weather forecast from api.met.no/weatherapi/locationforecast or a similar service.
 *
 * Ensures that a uses agent is set on each request.
 */
export class YrLocationForecastProvider implements LocationForecastInterface<YrForecast> {
  private readonly userAgent: string = APP_USER_AGENT;
  private readonly apiUrl: string = PRIMARY_API_URL;
  private readonly fallbackApiUrl: string = FALLBACK_API_URL;
  private config: AxiosRequestConfig;
  private policy: PolicyBuilder<never>;

  constructor(userAgent?: string, baseURL?: string) {
    userAgent && (this.userAgent = userAgent);
    baseURL && (this.apiUrl = baseURL);
    this.config = {
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Encoding': 'gzip',
      },
      timeout: 5_000,
    };

    // Retries the primary up to 3 times (through the breaker, so each
    // attempt counts toward tripping it) before getForecast() falls back to
    // the secondary API. See lib/http/resilience.ts.
    this.policy = createPolicy('Primary Forecast API').withRetry().withBreaker();
  }

  private buildUrl(base: string, lat: number, lon: number, alt?: number): string {
    let url = `${base}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
    if (alt !== undefined) url += `&altitude=${alt}`;
    return url;
  }

  async getForecast(lat: number, lon: number, alt?: number): Promise<YrForecast> {
    const url = this.buildUrl(this.apiUrl, lat, lon, alt);
    const fallbackUrl = this.buildUrl(this.fallbackApiUrl, lat, lon, alt);

    // withFallback/compose built per-call (cheap — no state of their own)
    // so the fallback's closure can carry this call's own lat/lon/alt;
    // this.policy (breaker+retry) is the persistent instance state, shared
    // across calls without being rebuilt or duplicated.
    const resilience = this.policy
      .withFallback(async () => {
        console.warn('🚨 [fallback] Falling back to secondary forecast API...');
        const { data } = await Axios.get<YrForecast>(fallbackUrl, this.config);
        console.log('✅ [fallback] Secondary forecast API request succeeded');
        return data;
      })
      .compose();

    return resilience.execute(async () => {
      const { data } = await Axios.get<YrForecast>(url, this.config);
      console.log('✅ Successfully got data from primary API.');
      return data;
    });
  }
}
