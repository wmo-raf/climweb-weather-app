import React from 'react';
import TestRenderer, { act, ReactTestInstance } from 'react-test-renderer';
import { DateTime } from 'luxon';

import { ForecastStepRecord } from '@/lib/forecast/types';

// Kept out of app/ so expo-router doesn't treat it as a route.

const mockLanguage = { current: 'en' };

jest.mock('react-i18next', () => {
  const i18nextModule = require('i18next');
  const i18next = i18nextModule.default ?? i18nextModule;
  const instance = i18next.createInstance();
  instance.init({
    resources: {
      en: { translation: require('@/lib/localization/translations/english.json').translations },
      sw: { translation: require('@/lib/localization/translations/swahili.json').translations },
    },
    lng: 'en',
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
    initAsync: false,
  });
  return { useTranslation: () => ({ t: instance.getFixedT(mockLanguage.current), i18n: { language: mockLanguage.current } }) };
});
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
}));
jest.mock('expo-font', () => ({ ...jest.requireActual('expo-font'), isLoaded: () => true }));
jest.mock('@/lib/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
// The real formatters with fixed units (°C, km/h, mm), without the store.
jest.mock('@/lib/hooks/use-units', () => {
  const { useTranslation } = require('react-i18next');
  const u = jest.requireActual('@/lib/units');
  return {
    useUnits: () => {
      const { t } = useTranslation();
      return {
        prefs: { temperature: 'celsius', wind: 'kmh', precipitation: 'mm' },
        temp: (v?: number) => u.formatTemperature(v, 'celsius'),
        tempValue: (v: number) => u.roundTemperature(v, 'celsius'),
        tempSpoken: (v: number) => t('units.spoken.celsius', { value: u.roundTemperature(v, 'celsius') }),
        wind: (v?: number) => u.formatWind(v, 'kmh'),
        rain: (v: number) => u.formatPrecipitation(v, 'mm'),
        rainSpoken: (v: number) => t('units.spoken.mm', { count: u.roundPrecipitation(v, 'mm') }),
        rainShows: (v?: number) => v !== undefined && u.roundPrecipitation(v, 'mm') > 0,
      };
    },
  };
});

/* eslint-disable import/first */
import DayDetail from '@/components/DayDetail';
import DayRow from '@/components/DayRow';
import { stepsForDay } from '@/lib/forecast/day-detail';
/* eslint-enable import/first */

const TZ = 'Africa/Dar_es_Salaam';
const DAY = '2026-11-24';

const step = (hour: number, period: number, extra: Partial<ForecastStepRecord> = {}): ForecastStepRecord => ({
  time: DateTime.fromISO(DAY, { zone: TZ }).plus({ hours: hour }).toISO()!,
  temperature: 18 + (hour % 24) / 3,
  windSpeed: 4.4, // 16 km/h
  windDirection: 135,
  precipitation: 0,
  weatherSymbol: 'partlycloudy_day',
  period,
  ...extra,
});

// Every `every` hours across the day, plus the next day's first step.
const day = (every: number, from = 0) =>
  stepsForDay(Array.from({ length: Math.ceil((24 - from) / every) + 1 }, (_, i) => step(from + i * every, every)), DAY, TZ);

// 12a–12d
const threeHourly = () => day(3);
const sixHourly = () => {
  const series = Array.from({ length: 5 }, (_, i) => step(i * 6, 6));
  series[2] = { ...series[2], temperature: 24, precipitation: 1, weatherSymbol: 'lightrainshowers_day' };
  return stepsForDay(series, DAY, TZ);
};
const twelveHourly = () => day(12, 9);
const singleStep = () => stepsForDay([step(12, 6, { temperature: 24 })], DAY, TZ);

const byTestID = (root: ReactTestInstance, id: string | RegExp) =>
  root.findAll(n => typeof n.type === 'string' && (typeof id === 'string' ? n.props.testID === id : id.test(n.props.testID ?? '')));

const textOf = (node: ReactTestInstance): string =>
  node.children.map(c => (typeof c === 'string' ? c : textOf(c))).join('');

function render(steps: ReturnType<typeof day>) {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => { renderer = TestRenderer.create(<DayDetail steps={steps} />); });
  const root = renderer.root;
  // The parts grid renders its cards once it knows its width.
  const grid = byTestID(root, 'day-detail-parts')[0];
  if (grid) act(() => grid.props.onLayout({ nativeEvent: { layout: { width: 358, height: 0, x: 0, y: 0 } } }));
  return root;
}

const parts = (root: ReactTestInstance) => byTestID(root, /^detail-part-/).map(n => n.props.testID.replace('detail-part-', ''));
// The screen has no hour-by-hour table: the day parts are the breakdown.
const hasTable = (root: ReactTestInstance) => byTestID(root, /^day-detail-(row-|table)/).length > 0;

beforeEach(() => {
  mockLanguage.current = 'en';
});

describe('3-hourly day (12a)', () => {
  test('four parts, no table and no note', () => {
    const root = render(threeHourly());
    expect(parts(root)).toEqual(['night', 'morning', 'afternoon', 'evening']);
    expect(hasTable(root)).toBe(false);
    expect(byTestID(root, 'day-detail-note')).toHaveLength(0);
  });
});

describe('6-hourly day (12b)', () => {
  test('four parts, no table and no note', () => {
    const root = render(sixHourly());
    expect(parts(root)).toEqual(['night', 'morning', 'afternoon', 'evening']);
    expect(hasTable(root)).toBe(false);
    expect(byTestID(root, 'day-detail-note')).toHaveLength(0);
  });

  test('the summary gives the range, symbol and line', () => {
    const summary = byTestID(render(sixHourly()), 'day-summary')[0];
    expect(textOf(summary)).toContain('18° – 24°C');
    expect(summary.props.accessibilityLabel).toBe('18 degrees Celsius to 24 degrees Celsius. Light rain.');
  });

  test('each part card reads as one item, with its rain', () => {
    const afternoon = byTestID(render(sixHourly()), 'detail-part-afternoon')[0];
    expect(afternoon.props.accessible).toBe(true);
    expect(afternoon.props.accessibilityLabel).toBe('Afternoon, 12:00 to 18:00, 24 degrees Celsius, Light rain, 1 millimetre');
    expect(textOf(afternoon)).toContain('1.0 mm');
    expect(textOf(byTestID(render(sixHourly()), 'detail-part-morning')[0])).not.toContain('mm');
  });

  test('works in Swahili', () => {
    mockLanguage.current = 'sw';
    const root = render(sixHourly());
    expect(byTestID(root, 'detail-part-afternoon')[0].props.accessibilityLabel)
      .toBe('Mchana, 12:00 hadi 18:00, 24 digrii za Selsiasi, Mvua nyepesi, milimita 1');
  });
});

describe('12-hourly day (12c)', () => {
  test('Day and Night, and the note', () => {
    const root = render(twelveHourly());
    expect(parts(root)).toEqual(['day', 'night']);
    expect(textOf(byTestID(root, 'detail-part-night')[0])).toContain('18:00–06:00');
    expect(hasTable(root)).toBe(false);
    expect(textOf(byTestID(root, 'day-detail-note')[0])).toContain('Less detail is available this far ahead.');
  });

  test('two parts sit side by side, not in quarter-width columns', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => { renderer = TestRenderer.create(<DayDetail steps={twelveHourly()} />); });
    const grid = byTestID(renderer.root, 'day-detail-parts')[0];
    act(() => grid.props.onLayout({ nativeEvent: { layout: { width: 900, height: 0, x: 0, y: 0 } } }));
    const widths = byTestID(renderer.root, /^detail-part-/).map(n =>
      ([] as object[]).concat(n.props.style).flat(Infinity).reduce<number | undefined>(
        (w, s) => (s && typeof s === 'object' && 'width' in s ? (s as { width: number }).width : w), undefined));
    expect(widths).toEqual([441, 441]);
  });
});

describe('single-step day (12d)', () => {
  test('one value, no parts, and the note', () => {
    const root = render(singleStep());
    expect(parts(root)).toEqual([]);
    expect(hasTable(root)).toBe(false);
    expect(textOf(byTestID(root, 'day-summary')[0])).toContain('24°C');
    expect(textOf(byTestID(root, 'day-summary')[0])).toContain('Partly cloudy, 12:00–18:00');
    expect(textOf(byTestID(root, 'day-detail-note')[0])).toContain('Only one forecast time is available for this day.');
  });
});

describe('Five Days row', () => {
  const dayRecord = (steps: ForecastStepRecord[]) => ({
    day: DateTime.fromISO(DAY, { zone: TZ }).toISO()!,
    weatherSymbol: 'partlycloudy_day',
    minTemperature: 18,
    maxTemperature: 24,
    windSpeed: 2,
    steps,
  });

  test('a single-step day shows one temperature', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => { renderer = TestRenderer.create(<DayRow summary={{ ...dayRecord([step(18, 12)]), minTemperature: 24 }} />); });
    const text = textOf(renderer.root);
    expect(text).toContain('24°C');
    expect(text).not.toContain('–');
  });

  test('other days keep the range', () => {
    let renderer!: TestRenderer.ReactTestRenderer;
    act(() => { renderer = TestRenderer.create(<DayRow summary={dayRecord([step(6, 6), step(12, 6)])} />); });
    expect(textOf(renderer.root)).toContain('18°C – 24°C');
  });
});

describe('dayHref', () => {
  const config = require('@/config') as { SPARSE_FORECAST: boolean };
  const saved = config.SPARSE_FORECAST;
  afterAll(() => { config.SPARSE_FORECAST = saved; });
  const { dayHref } = require('@/lib/layout/open-day');
  const tuesday = DateTime.fromISO(DAY, { zone: TZ });

  test('opens the day-detail screen for a sparse forecast', () => {
    config.SPARSE_FORECAST = true;
    expect(dayHref(tuesday, 'Dar es Salaam')).toEqual({ pathname: '/FiveDays/Day', params: { location: 'Dar es Salaam', dayString: DAY } });
  });

  test('opens the hourly table otherwise', () => {
    config.SPARSE_FORECAST = false;
    expect(dayHref(tuesday, 'Dar es Salaam')).toMatchObject({ pathname: '/FiveDays/Hourly', params: { startAtCurrentTime: 'no' } });
  });
});
