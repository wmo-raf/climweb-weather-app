import { YrForecast } from "../types";
import { DateTime } from "luxon";

import { modeDirection, nearestPeriod, parseYrForecast } from "./yr-forecast.provider";
import sample from "../wrf-forecast.test.json";

// The parser reads any time resolution of the Locationforecast shape. This
// fixture is a WRF run's, which is 3-hourly. Times are UTC and days are
// grouped in the app timezone: Dar es Salaam is UTC+3, so 21:00Z is midnight
// of the next local day.
jest.mock("@/config", () => ({
  ...jest.requireActual("@/config"),
  APP_TIMEZONE: "Africa/Dar_es_Salaam",
}));

// A cut-down WRF response for Dar es Salaam: 3-hourly steps from
// 2026-09-21T12:00Z to 2026-09-23T00:00Z, each with next_6_hours (symbol,
// rain, max/min) and next_12_hours (symbol only), then the run's last three
// steps (one with next_6_hours only, two with no period block).
const wrf = sample as YrForecast;
const raw = wrf.properties.timeseries;

describe("parseYrForecast with 3-hourly steps (WRF)", () => {
  const record = parseYrForecast(wrf);
  const steps = record.days.flatMap(d => d.steps);

  test("groups the UTC steps into local days", () => {
    expect(record.days.map(d => d.day.slice(0, 10))).toEqual([
      "2026-09-21", "2026-09-22", "2026-09-23", "2026-09-28", "2026-09-29",
    ]);
    expect(record.days.map(d => d.steps.length)).toEqual([3, 8, 2, 1, 2]);
    expect(steps[0].time).toBe("2026-09-21T15:00:00.000+03:00");
    expect(record.days[1].steps[0].time).toBe("2026-09-22T00:00:00.000+03:00");
  });

  test("reads symbol, rain and a 6-hour period from next_6_hours", () => {
    steps.forEach((s, i) => {
      const six = raw[i].data.next_6_hours;
      if (!six) return;
      expect(s.period).toBe(6);
      expect(s.weatherSymbol).toBe(six.summary?.symbol_code);
      expect(s.precipitation).toBe(six.details?.precipitation_amount);
    });
    expect(steps.filter(s => s.period === 6)).toHaveLength(14);
  });

  test("a step with no period block keeps its temperature, with no symbol, rain or period", () => {
    const last = steps[steps.length - 1];
    expect(last).toMatchObject({ weatherSymbol: "??", precipitation: "-", period: undefined });
    expect(last.temperature).toBe(raw[raw.length - 1].data.instant.details.air_temperature);
  });

  test("keeps wind direction, and has no gusts when none are sent", () => {
    expect(steps[0].windDirection).toBe(raw[0].data.instant.details.wind_from_direction);
    expect(steps[0].windSpeed).toBe(raw[0].data.instant.details.wind_speed);
    expect(steps.every(s => s.windGust === undefined)).toBe(true);
  });

  test("a full day takes the 12-hour block from 06:00 local", () => {
    // 22 Sep: 06:00 local is 03:00Z.
    const six = raw.find(s => s.time === "2026-09-22T03:00:00Z")!;
    expect(record.days[1].weatherSymbol).toBe(six.data.next_12_hours!.summary!.symbol_code);
  });

  test("a day already under way takes the block covering the rest of its daytime", () => {
    // 21 Sep starts at 15:00 local: its 6-hour block (15:00–21:00) and its
    // 12-hour one cover the same 3 daytime hours, and the shorter one wins.
    expect(record.days[0].weatherSymbol).toBe(raw[0].data.next_6_hours!.summary!.symbol_code);
  });

  test("max/min come from the day's step temperatures", () => {
    const temps = record.days[1].steps.map(s => s.temperature!);
    expect(record.days[1].maxTemperature).toBe(Math.max(...temps));
    expect(record.days[1].minTemperature).toBe(Math.min(...temps));
  });
});

describe("parseYrForecast in six-hour blocks (sparse mode)", () => {
  const blocks = parseYrForecast(wrf, "blocks");
  const steps = parseYrForecast(wrf, "steps");
  const day = (iso: string) => blocks.days.find(d => d.day.startsWith(iso))!;
  const hours = (d: { steps: { time: string }[] }) => d.steps.map(s => s.time.slice(11, 16));

  test("each local day is cut into 00–06, 06–12, 12–18 and 18–24 blocks that have readings", () => {
    expect(hours(day("2026-09-21"))).toEqual(["12:00", "18:00"]);
    expect(hours(day("2026-09-22"))).toEqual(["00:00", "06:00", "12:00", "18:00"]);
    expect(blocks.days.flatMap(d => d.steps).every(s => s.period === 6)).toBe(true);
  });

  test("the day's high, low, top wind and symbol still come from the raw readings", () => {
    blocks.days.forEach((d, i) => {
      const plain = steps.days[i];
      expect([d.maxTemperature, d.minTemperature, d.windSpeed, d.weatherSymbol])
        .toEqual([plain.maxTemperature, plain.minTemperature, plain.windSpeed, plain.weatherSymbol]);
    });
    expect(blocks.days.map(d => d.readings)).toEqual([3, 8, 2, 1, 2]);
  });

  test("temperature and wind are the block's averages, with its highest wind kept", () => {
    const [night, morning, afternoon, evening] = day("2026-09-22").steps;
    expect(night.temperature).toBeCloseTo((23.9 + 23.2) / 2);
    expect(night.windSpeed).toBeCloseTo((4.1 + 3.5) / 2);
    expect(night.windSpeedMax).toBe(4.1);
    expect(morning.temperature).toBeCloseTo((23.3 + 24.8) / 2);
    expect(afternoon.temperature).toBeCloseTo((25.9 + 26.9) / 2);
    expect(evening.windSpeedMax).toBe(5.4);
  });

  test("wind direction is the most common 8-point sector", () => {
    const [night, morning, afternoon, evening] = day("2026-09-22").steps;
    expect(night.windDirection).toBe(90);      // 109° and 110°: both east
    expect(afternoon.windDirection).toBe(90);  // 100° and 108°
    expect(evening.windDirection).toBe(135);   // 121° and 145°: both south-east
    expect(morning.windDirection).toBe(180);   // 127° (SE, 2.0 m/s) vs 159° (S, 3.2 m/s): the stronger wins
  });

  test("symbol and rain are next_6_hours of the reading at the block's start", () => {
    const [night, morning, afternoon, evening] = day("2026-09-22").steps;
    expect([night.weatherSymbol, morning.weatherSymbol, afternoon.weatherSymbol, evening.weatherSymbol])
      .toEqual(["partlycloudy_night", "cloudy", "partlycloudy_day", "partlycloudy_night"]);
    expect(night.precipitation).toBe(0);
  });

  test("a block with no reading at its start takes the 6-hour period that overlaps it most", () => {
    // 12–18 on the 21st has only a 15:00 reading: its period 15–21 overlaps by 3 hours.
    const first = blocks.days[0].steps[0];
    expect([first.weatherSymbol, first.precipitation, first.temperature]).toEqual(["clearsky_night", 0, 29.4]);
    // 00–06 on the 29th: its readings have no next_6_hours, so the 28th's 21:00–03:00 period.
    const last = blocks.days[4].steps[0];
    expect(last.weatherSymbol).toBe("partlycloudy_night");
  });
});

describe("nearestPeriod", () => {
  // Dar es Salaam (UTC+3) blocks, with 6-hour periods starting at the given local hours.
  const at = (hour: number) => DateTime.fromISO("2026-11-27T00:00:00+03:00", { setZone: true }).plus({ hours: hour });
  const periodsFrom = (hours: number[]) => hours.map(h => ({ start: at(h).toMillis(), period: { summary: { symbol_code: `from-${h}` } } }));
  const pick = (block: number, hours: number[]) => nearestPeriod(at(block), periodsFrom(hours))?.period.summary?.symbol_code;

  test("the period starting at the block's start", () => {
    expect(pick(6, [0, 3, 6, 9])).toBe("from-6");
  });

  test("readings an hour off: the period five hours in", () => {
    expect(pick(6, [2, 5, 8, 11])).toBe("from-5");
  });

  test("readings two hours off: the period four hours in", () => {
    expect(pick(6, [2, 8, 14])).toBe("from-8");
  });

  test("readings three hours off: the earlier of the two halves, so each period is used once", () => {
    const hours = [-3, 3, 9, 15, 21];
    expect([0, 6, 12, 18].map(b => pick(b, hours))).toEqual(["from--3", "from-3", "from-9", "from-15"]);
  });

  test("undefined when nothing overlaps", () => {
    expect(pick(6, [12, 18])).toBeUndefined();
  });
});

describe("modeDirection", () => {
  test("the most common sector, as its centre", () => {
    expect(modeDirection([{ direction: 350 }, { direction: 10 }, { direction: 90 }])).toBe(0);
  });

  test("a tie goes to the stronger wind, then the earlier reading", () => {
    expect(modeDirection([{ direction: 90, speed: 2 }, { direction: 180, speed: 5 }])).toBe(180);
    expect(modeDirection([{ direction: 90, speed: 3 }, { direction: 180, speed: 3 }])).toBe(90);
  });

  test("a boundary belongs to the sector clockwise from it", () => {
    expect(modeDirection([{ direction: 22.5 }])).toBe(45);
  });

  test("undefined with no directions", () => {
    expect(modeDirection([{ speed: 3 }, {}])).toBeUndefined();
  });
});
