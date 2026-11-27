import { DateTime } from "luxon";

import { APP_TIMEZONE, SPARSE_FORECAST } from "@/config";
import { YrForecast, YrForecastPeriod, YrForecastTimestep, ForecastRecord, ForecastDayRecord, ForecastStepRecord } from "../types";
import { ForecastProviderInterface } from "../interfaces";
import { toCelsius, toMetresPerSecond, toMillimetres } from "@/lib/units";
import { YrLocationForecastProvider } from "./yr-location-forecast.provider";

export class YrForecastProvider implements ForecastProviderInterface {
  private readonly locationProvider = new YrLocationForecastProvider();

  async getForecast(lat: number, lon: number, alt?: number): Promise<ForecastRecord> {
    const raw = await this.locationProvider.getForecast(lat, lon, alt);
    return parseYrForecast(raw, SPARSE_FORECAST ? "blocks" : "steps");
  }
}

// Units the response declares (meta.units). Values are normalised to the
// app's canonical °C / m/s / mm here, so nothing downstream depends on what
// a given backend happens to send.
type SourceUnits = YrForecast["properties"]["meta"]["units"];

// How a day's `steps` come out: one per forecast reading ("steps", the
// hourly screens), or one per local six-hour block, 00–06, 06–12, 12–18 and
// 18–24 ("blocks", sparse mode; see toSixHourBlocks).
export type ForecastLayout = "steps" | "blocks";

export function parseYrForecast(raw: YrForecast, layout: ForecastLayout = "steps"): ForecastRecord {
  const units: SourceUnits = raw.properties.meta?.units ?? {};
  const dayMap = new Map<string, YrForecastTimestep[]>();

  for (const step of raw.properties.timeseries) {
    const dayKey = DateTime.fromISO(step.time).setZone(APP_TIMEZONE).startOf("day").toISO()!;
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
    dayMap.get(dayKey)!.push(step);
  }

  // Every 6-hour period in the forecast, for the blocks to choose from
  // across day boundaries.
  const periods = sixHourPeriods(raw.properties.timeseries);

  const days: ForecastDayRecord[] = [];
  for (const [dayIso, daySteps] of dayMap) {
    days.push(parseDayRecord(dayIso, daySteps, units, layout, periods));
  }

  return { days };
}

// The day's high, low, top wind and symbol come from the raw readings in
// either layout; only `steps` differs.
function parseDayRecord(dayIso: string, rawSteps: YrForecastTimestep[], units: SourceUnits, layout: ForecastLayout, periods: SixHourPeriod[]): ForecastDayRecord {
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
    readings: rawSteps.length,
    steps: layout === "blocks" ? toSixHourBlocks(rawSteps, units, periods) : rawSteps.map(step => parseStepRecord(step, units)),
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

// --- six-hour blocks (sparse mode) ---------------------------------------------

export const BLOCK_HOURS = 6;

const mean = (values: (number | undefined)[]): number | undefined => {
  const known = values.filter((v): v is number => v !== undefined && Number.isFinite(v));
  return known.length ? known.reduce((sum, v) => sum + v, 0) / known.length : undefined;
};

const highest = (values: (number | undefined)[]): number | undefined => {
  const known = values.filter((v): v is number => v !== undefined && Number.isFinite(v));
  return known.length ? Math.max(...known) : undefined;
};

// 8-point compass sector (0 = N, 1 = NE, ... 7 = NW) of a direction in
// degrees; a boundary belongs to the sector clockwise from it.
const sectorOf = (degrees: number) => Math.round((((degrees % 360) + 360) % 360) / 45) % 8;

// The block's wind direction: the most common 8-point compass sector among
// its readings, as that sector's centre in degrees (0, 45, ... 315). A tie
// goes to the sector with the stronger wind, then the earlier reading.
// Undefined when no reading has a direction. (To be confirmed with TMA's
// forecasters.)
export function modeDirection(readings: { direction?: number; speed?: number }[]): number | undefined {
  const sectors = new Map<number, { count: number; strongest: number; first: number }>();
  readings.forEach(({ direction, speed }, i) => {
    if (direction === undefined || !Number.isFinite(direction)) return;
    const sector = sectorOf(direction);
    const entry = sectors.get(sector) ?? { count: 0, strongest: -Infinity, first: i };
    entry.count += 1;
    entry.strongest = Math.max(entry.strongest, speed ?? -Infinity);
    sectors.set(sector, entry);
  });
  let best: [number, { count: number; strongest: number; first: number }] | undefined;
  for (const candidate of sectors) {
    const [, a] = candidate;
    const b = best?.[1];
    if (!b || a.count > b.count || (a.count === b.count && (a.strongest > b.strongest || (a.strongest === b.strongest && a.first < b.first)))) {
      best = candidate;
    }
  }
  return best ? best[0] * 45 : undefined;
}

export type SixHourPeriod = { start: number; period: YrForecastPeriod };

// The forecast's next_6_hours periods, in time order, with their start in
// epoch ms.
export function sixHourPeriods(timeseries: YrForecastTimestep[]): SixHourPeriod[] {
  return timeseries
    .filter(step => step.data.next_6_hours)
    .map(step => ({ start: DateTime.fromISO(step.time).toMillis(), period: step.data.next_6_hours! }))
    .sort((a, b) => a.start - b.start);
}

const SIX_HOURS_MS = BLOCK_HOURS * 3_600_000;

// The 6-hour period that overlaps the block starting at `blockStart` the
// most: the one starting at the block's start when there is one (all six
// hours), else the nearest, e.g. 05–11 for 06–12 when readings are an hour
// off. A tie goes to the earlier period, so with readings three hours off
// (03, 09, 15, 21) each block gets the period starting three hours before
// it and no period is used twice. Undefined when none overlaps.
export function nearestPeriod(blockStart: DateTime, periods: SixHourPeriod[]): SixHourPeriod | undefined {
  const from = blockStart.toMillis();
  const to = from + SIX_HOURS_MS;
  let best: SixHourPeriod | undefined;
  let bestOverlap = 0;
  for (const candidate of periods) {
    const overlap = Math.min(to, candidate.start + SIX_HOURS_MS) - Math.max(from, candidate.start);
    if (overlap > bestOverlap) { best = candidate; bestOverlap = overlap; }
  }
  return best;
}

// A day's readings as local six-hour blocks: 00–06, 06–12, 12–18, 18–24 in
// the app timezone, in time order; blocks without readings are left out.
// Each block is one step record:
// - time: the block's start; period: 6
// - temperature, windSpeed: the average of the block's readings
// - windSpeedMax, windGust: the highest
// - windDirection: modeDirection
// - weatherSymbol, precipitation: the model's own six-hour summary and
//   amount (next_6_hours) for the period nearest the block: nearestPeriod.
export function toSixHourBlocks(rawSteps: YrForecastTimestep[], units: SourceUnits, periods: SixHourPeriod[] = sixHourPeriods(rawSteps)): ForecastStepRecord[] {
  const groups = new Map<string, { start: DateTime; raw: YrForecastTimestep[] }>();
  for (const step of rawSteps) {
    const local = DateTime.fromISO(step.time).setZone(APP_TIMEZONE);
    const start = local.startOf("day").set({ hour: Math.floor(local.hour / BLOCK_HOURS) * BLOCK_HOURS });
    const key = start.toISO()!;
    if (!groups.has(key)) groups.set(key, { start, raw: [] });
    groups.get(key)!.raw.push(step);
  }

  let missing = 0;
  const blocks = [...groups.values()]
    .sort((a, b) => a.start.toMillis() - b.start.toMillis())
    .map(({ start, raw }) => {
      const readings = raw.map(step => parseStepRecord(step, units));
      const six = nearestPeriod(start, periods)?.period;
      if (!six) missing += 1;
      const rain = six?.details?.precipitation_amount;
      return {
        time: start.toISO()!,
        temperature: mean(readings.map(r => r.temperature)),
        windSpeed: mean(readings.map(r => r.windSpeed)),
        windSpeedMax: highest(readings.map(r => r.windSpeed)),
        windDirection: modeDirection(readings.map(r => ({ direction: r.windDirection, speed: r.windSpeed }))),
        windGust: highest(readings.map(r => r.windGust)),
        precipitation: rain !== undefined ? toMillimetres(rain, units.precipitation_amount) : "-" as const,
        weatherSymbol: six?.summary?.symbol_code ?? "??",
        period: BLOCK_HOURS,
      };
    });

  if (__DEV__ && missing > 0) {
    console.warn(`Six-hour blocks: ${missing} block(s) overlap no next_6_hours period, so have no symbol or rain.`);
  }
  return blocks;
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
