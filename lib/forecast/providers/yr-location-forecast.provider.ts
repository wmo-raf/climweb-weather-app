import Axios, { AxiosRequestConfig } from 'axios';
import { IPolicy } from 'cockatiel';

import { YrForecast } from '../types'
import { PRIMARY_API_URL, FALLBACK_API_URL, APP_USER_AGENT } from '../../../config';
import { LocationForecastInterface } from '../interfaces';
import { executeWithFallback, requestPolicy } from '@/lib/network/request-policy';

/**
 * Download a weather forecast from api.met.no/weatherapi/locationforecast or a similar service.
 *
 * Ensures that a uses agent is set on each request. Requests go through
 * the shared request policy (lib/network/request-policy.ts): the primary
 * API is retried with exponential backoff, then the circuit opens and the
 * fallback API is used until the primary answers again.
 */
export class YrLocationForecastProvider implements LocationForecastInterface<YrForecast> {
  private readonly userAgent: string = APP_USER_AGENT;
  private readonly apiUrl: string = PRIMARY_API_URL;
  private readonly fallbackApiUrl: string = FALLBACK_API_URL;
  private config: AxiosRequestConfig;
  private readonly policy: IPolicy;

  constructor(userAgent?: string, baseURL?: string, policy: IPolicy = requestPolicy('Forecast API')) {
    userAgent && (this.userAgent = userAgent);
    baseURL && (this.apiUrl = baseURL);
    this.policy = policy;
    this.config = {
      headers: {
        'User-Agent': this.userAgent,
        'Accept-Encoding': 'gzip',
      },
      timeout: 5_000,
    };
  }

  private buildUrl(base: string, lat: number, lon: number, alt?: number): string {
    let url = `${base}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
    if (alt !== undefined) url += `&altitude=${alt}`;
    return url;
  }

  // Downloads and checks the response, so a 200 that isn't a forecast (e.g.
  // an HTML error page) counts as a failure: it's retried, then the fallback
  // API is used.
  private route(base: string, lat: number, lon: number, alt?: number) {
    return async (): Promise<YrForecast> => {
      const { data } = await Axios.get<YrForecast>(this.buildUrl(base, lat, lon, alt), this.config);
      if (!Array.isArray(data?.properties?.timeseries)) {
        throw new Error(`Response from ${base} is not a forecast`);
      }
      return data;
    };
  }

  async getForecast(lat: number, lon: number, alt?: number): Promise<YrForecast> {
    return executeWithFallback(
      this.policy,
      this.route(this.apiUrl, lat, lon, alt),
      this.fallbackApiUrl ? this.route(this.fallbackApiUrl, lat, lon, alt) : undefined,
    );
  }
}
