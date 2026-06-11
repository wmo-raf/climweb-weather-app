import { DateTime } from "luxon";
import { parseYrForecast } from "./providers";
import { YrForecast } from "./types";
import { APP_TIMEZONE } from "@/config";

describe("parseYrForecast", () => {
  const sampleForecast: YrForecast = require("./weatherData.test.json");

  test("get days", () => {
    const record = parseYrForecast(sampleForecast);
    expect(record.days.length).toBe(10);
    expect(record.days[0].day).toBe("2024-01-11T00:00:00.000+02:00");
    expect(record.days[1].day).toBe("2024-01-12T00:00:00.000+02:00");
    expect(record.days[9].day).toBe("2024-01-20T00:00:00.000+02:00");
  });

  test("extract day summary", () => {
    const record = parseYrForecast(sampleForecast);
    const day = record.days[1];
    expect(day.day).toBe("2024-01-12T00:00:00.000+02:00");
    expect(day.minTemperature).toBe(18.7);
    expect(day.maxTemperature).toBe(26.9);
    expect(day.weatherSymbol).toBe("rain");
    expect(day.windSpeed).toBe(4.2 * 3.6);
    expect(day.steps.length).toBe(24);
  });

  test("step fields are pre-computed plain values", () => {
    const record = parseYrForecast(sampleForecast);
    const step = record.days[1].steps[0];
    expect(typeof step.time).toBe("string");
    expect(DateTime.fromISO(step.time).setZone(APP_TIMEZONE).toISO()).toBe(
      "2024-01-12T00:00:00.000+02:00"
    );
    expect(typeof step.weatherSymbol).toBe("string");
    expect(step.weatherSymbol).not.toBe("??");
  });

  test("last day has a weather symbol", () => {
    const record = parseYrForecast(sampleForecast);
    const lastDay = record.days[record.days.length - 1];
    expect(lastDay.weatherSymbol).toBeDefined();
    expect(lastDay.weatherSymbol).not.toBe("snow");
  });

  test("steps filtered by time keep correct count", () => {
    const record = parseYrForecast(sampleForecast);
    const day = record.days[0];
    // day[0] starts at 13:00 local in the test fixture
    expect(day.steps.length).toBe(11);
    expect(DateTime.fromISO(day.steps[0].time).setZone(APP_TIMEZONE).toISO()).toBe(
      "2024-01-11T13:00:00.000+02:00"
    );
  });
});
