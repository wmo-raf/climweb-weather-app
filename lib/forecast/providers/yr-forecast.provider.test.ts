import { YrForecast } from "../types";
import { parseYrForecast } from "./yr-forecast.provider";
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
