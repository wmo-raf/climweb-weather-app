import { DateTime } from "luxon";

import { APP_TIMEZONE } from "@/config";
import { YrForecast, YrForecastPeriod, YrForecastTimestep, ForecastRecord, ForecastDayRecord, ForecastStepRecord } from "../types";
import { ForecastProviderInterface } from "../interfaces";
import { toCelsius, toMetresPerSecond, toMillimetres } from "@/lib/units";
import { YrLocationForecastProvider } from "./yr-location-forecast.provider";

export class YrForecastProvider implements ForecastProviderInterface {
  private readonly locationProvider = new YrLocationForecastProvider();

  async getForecast(lat: number, lon: number, alt?: number): Promise<ForecastRecord> {
    const raw = await this.locationProvider.getForecast(lat, lon, alt);
    return parseYrForecast(raw);
  }
}

// Units the response declares (meta.units). Values are normalised to the
// app's canonical °C / m/s / mm here, so nothing downstream depends on what
// a given backend happens to send.
type SourceUnits = YrForecast["properties"]["meta"]["units"];

export function parseYrForecast(raw: YrForecast): ForecastRecord {
  const units: SourceUnits = raw.properties.meta?.units ?? {};
  const dayMap = new Map<string, YrForecastTimestep[]>();

  for (const step of raw.properties.timeseries) {
    const dayKey = DateTime.fromISO(step.time).setZone(APP_TIMEZONE).startOf("day").toISO()!;
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
    dayMap.get(dayKey)!.push(step);
  }

  const days: ForecastDayRecord[] = [];
  for (const [dayIso, daySteps] of dayMap) {
    days.push(parseDayRecord(dayIso, daySteps, units));
  }

  return { days };
}

function parseDayRecord(dayIso: string, rawSteps: YrForecastTimestep[], units: SourceUnits): ForecastDayRecord {
  const temperatures = rawSteps
    .map(s => s.data.instant.details.air_temperature)
    .filter((t): t is number => t !== undefined)
    .map(t => toCelsius(t, units.air_temperature));

  const windSpeeds = rawSteps
    .map(s => s.data.instant.details.wind_speed)
    .filter((w): w is number => w !== undefined)
    .map(w => toMetresPerSecond(w, units.wind_speed));

  return {
    day: dayIso,
    weatherSymbol: selectDailyWeatherSymbol(rawSteps),
    maxTemperature: temperatures.length ? Math.max(...temperatures) : undefined,
    minTemperature: temperatures.length ? Math.min(...temperatures) : undefined,
    windSpeed: windSpeeds.length ? Math.max(...windSpeeds) : undefined,
    steps: rawSteps.map(step => parseStepRecord(step, units)),
  };
}

// Period blocks, shortest first. Forecasts come at any time resolution:
// MET's hourly steps carry all three blocks, its later 6-hourly steps
// next_6/12_hours, a WRF run's 3-hourly steps next_6/12_hours, and the last
// steps of a forecast often only next_12_hours or nothing.
const PERIOD_BLOCKS = [
  ["next_1_hours", 1],
  ["next_6_hours", 6],
  ["next_12_hours", 12],
] as const;

type Block = { start: DateTime; hours: number; symbol?: string; period: YrForecastPeriod };

// The step's blocks, shortest first, with their start in the app timezone.
function blocksOf(step: YrForecastTimestep): Block[] {
  const start = DateTime.fromISO(step.time).setZone(APP_TIMEZONE);
  return PERIOD_BLOCKS
    .filter(([key]) => step.data[key] !== undefined)
    .map(([key, hours]) => ({ start, hours, symbol: step.data[key]!.summary?.symbol_code, period: step.data[key]! }));
}

function parseStepRecord(step: YrForecastTimestep, units: SourceUnits): ForecastStepRecord {
  const temperature = step.data.instant.details.air_temperature;
  const windSpeed = step.data.instant.details.wind_speed;
  const windDirection = step.data.instant.details.wind_from_direction;
  const windGust = step.data.instant.details.wind_speed_of_gust;
  // Symbol and rain come from the shortest block the step has, and the step
  // records its length, so a 6-hour amount on a 3-hourly step isn't taken
  // for 3 hours of rain.
  const [shortest] = blocksOf(step);
  const precipitation = shortest?.period.details?.precipitation_amount;

  return {
    time: DateTime.fromISO(step.time).setZone(APP_TIMEZONE).toISO()!,
    temperature: temperature !== undefined ? toCelsius(temperature, units.air_temperature) : undefined,
    windSpeed: windSpeed !== undefined ? toMetresPerSecond(windSpeed, units.wind_speed) : undefined,
    windDirection,
    // Gust units fall back to wind_speed's when meta.units doesn't list them.
    windGust: windGust !== undefined ? toMetresPerSecond(windGust, units.wind_speed_of_gust ?? units.wind_speed) : undefined,
    precipitation: precipitation !== undefined ? toMillimetres(precipitation, units.precipitation_amount) : "-",
    weatherSymbol: shortest?.symbol ?? "??",
    period: shortest?.hours,
  };
}

// Local daytime a day's symbol describes.
const DAYTIME_START_HOUR = 6;
const DAYTIME_END_HOUR = 18;

const hoursOf = (from: DateTime, to: DateTime) => Math.max(0, to.diff(from, "hours").hours);

// The symbol that best describes the day's daytime still ahead, whatever the
// time resolution: of all the day's blocks (1, 6 or 12 hours), the one that
// covers most of local 06:00–18:00 from the first step on. Ties go to the
// shorter block (less of it falls outside the window), then to one starting
// inside the window, then to the earlier one. So a full day gets the 12-hour
// block from 06:00 local, and an afternoon the block covering what's left.
// A day whose steps start after 18:00 gets its first step's symbol.
function selectDailyWeatherSymbol(steps: YrForecastTimestep[]): string | undefined {
  if (steps.length === 0) return undefined;

  const first = DateTime.fromISO(steps[0].time).setZone(APP_TIMEZONE);
  const daytimeEnd = first.startOf("day").set({ hour: DAYTIME_END_HOUR });
  const windowStart = DateTime.max(first.startOf("day").set({ hour: DAYTIME_START_HOUR }), first);

  const blocks = steps.flatMap(blocksOf).filter(b => b.symbol);
  if (blocks.length === 0) return undefined;
  if (windowStart >= daytimeEnd) return blocks[0].symbol;

  const overlap = (b: Block) =>
    hoursOf(DateTime.max(b.start, windowStart), DateTime.min(b.start.plus({ hours: b.hours }), daytimeEnd));
  const startsInside = (b: Block) => b.start >= windowStart;

  const best = blocks.reduce((a, b) => {
    const byOverlap = overlap(b) - overlap(a);
    if (byOverlap !== 0) return byOverlap > 0 ? b : a;
    if (a.hours !== b.hours) return b.hours < a.hours ? b : a;
    if (startsInside(a) !== startsInside(b)) return startsInside(b) ? b : a;
    return a; // blocks are in time order, so `a` is the earlier one
  });
  return best.symbol;
}
