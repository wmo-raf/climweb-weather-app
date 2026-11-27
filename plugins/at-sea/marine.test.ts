import i18next from 'i18next';
import { DateTime } from 'luxon';

import { ForecastStepRecord } from '@/lib/forecast/types';
import { DetailStep } from '@/lib/forecast/day-detail';
import { MarineArea } from './settings';
import { toMetresPerSecond } from '@/lib/units';
import {
  PartSummary, nightSymbol, partsOfDay, rain24h, rainBand24h, rainBandFor, skyForPart, summarisePart,
  areaName, matchAreas, nearestArea, selectedArea, suggestAreas, summaryBanner, windBand,
} from './marine';
import { MARINE_AREAS, parseMarineAreas } from './settings';
import configFile from './config.json';

const DEFAULT_MARINE_AREAS = MARINE_AREAS;

const TZ = 'Africa/Dar_es_Salaam';
const DATE = '2026-11-26';

const i18n = i18next.createInstance();
i18n.init({
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
const en = i18n.getFixedT('en');
const sw = i18n.getFixedT('sw');

const local = (time: string) => DateTime.fromISO(`${DATE}T${time}`, { zone: TZ });
const kt = (knots: number) => toMetresPerSecond(knots, 'knots');

const detail = (windKnots?: number, symbol = 'cloudy'): DetailStep => ({
  start: local('12:00').toISO()!,
  end: local('15:00').toISO()!,
  symbol,
  windSpeed: windKnots === undefined ? undefined : kt(windKnots),
});

// --- settings ------------------------------------------------------------------

describe('settings', () => {
  test('the bundled config.json has every threshold, in order', () => {
    const { wind_kt: wind, rain_24h_mm: rain } = configFile.thresholds;
    for (const water of [wind.lake, wind.ocean]) expect(water.moderate).toBeLessThan(water.strong);
    expect(rain.light).toBeLessThan(rain.moderate);
    expect(rain.moderate).toBeLessThan(rain.heavy);
  });

  test('invalid areas are left out; a broken file gives none', () => {
    const name = { en: 'Lake Kivu' };
    expect(parseMarineAreas({ areas: [
      { id: 'kivu', type: 'lake', lat: -2, lon: 29.2, name },
      { id: 'river', type: 'river', lat: 0, lon: 0, name },
      { id: 'noName', type: 'lake', lat: 0, lon: 0 },
      { id: 'far', type: 'ocean', lat: 95, lon: 0, name },
    ] })).toEqual([{ id: 'kivu', type: 'lake', lat: -2, lon: 29.2, name }]);
    expect(parseMarineAreas({})).toEqual([]);
    expect(parseMarineAreas(null)).toEqual([]);
  });

  // What a templated config.json must also pass.
  test('the bundled config.json areas are all valid, with unique ids and English and Swahili names', () => {
    expect(MARINE_AREAS.length).toBeGreaterThan(0);
    expect(MARINE_AREAS).toHaveLength(configFile.areas.length);
    expect(new Set(MARINE_AREAS.map(a => a.id)).size).toBe(MARINE_AREAS.length);
    for (const area of MARINE_AREAS) {
      expect(area.name.en).toBeTruthy();
      expect(area.name.sw).toBeTruthy();
    }
  });

  test('names fall back to English, then the id', () => {
    const area = { id: 'x', type: 'lake' as const, lat: 0, lon: 0, name: { en: 'Lake X', sw: 'Ziwa X' } };
    expect(areaName(area, 'sw')).toBe('Ziwa X');
    expect(areaName(area, 'sw-TZ')).toBe('Ziwa X');
    expect(areaName(area, 'am')).toBe('Lake X');
    expect(areaName({ ...area, name: {} }, 'sw')).toBe('x');
  });
});

// --- marine area ---------------------------------------------------------------

describe('nearestArea', () => {
  test.each([
    ['Dar es Salaam', -6.79, 39.21, 'darEsSalaam'],
    ['Zanzibar town', -6.16, 39.19, 'zanzibar'],
    ['Mtwara', -10.27, 40.18, 'mtwara'],
    ['Mwanza', -2.52, 32.9, 'victoriaMwanza'],
    ['Kigoma', -4.88, 29.63, 'tanganyikaKigoma'],
    ['Mbamba Bay', -11.28, 34.77, 'nyasaMbambaBay'],
  ])('%s gets %s', (_, lat, lon, id) => {
    expect(nearestArea({ lat, lon })?.id).toBe(id);
  });

  test('with no place, the first area', () => {
    expect(nearestArea(undefined)).toBe(DEFAULT_MARINE_AREAS[0]);
  });
});

describe('matchAreas', () => {
  const name = (area: MarineArea) => areaName(area, 'en');
  const ids = (query: string) => matchAreas(query, DEFAULT_MARINE_AREAS, name).map(a => a.id);

  test('an empty search lists every area', () => {
    expect(ids('  ')).toHaveLength(DEFAULT_MARINE_AREAS.length);
  });

  test('every word typed must appear, in any case', () => {
    expect(ids('VICTORIA mwa')).toEqual(['victoriaMwanza']);
    expect(ids('channel')).toEqual(['pemba', 'zanzibar', 'mafia']);
  });

  test('accents are ignored', () => {
    expect(ids('Kígoma')).toEqual(['tanganyikaKigoma']);
  });

  test('searches the names in the user\'s language', () => {
    const swName = (area: MarineArea) => areaName(area, 'sw');
    expect(matchAreas('ziwa nyasa', DEFAULT_MARINE_AREAS, swName).map(a => a.id)).toEqual(['nyasaMatema', 'nyasaMbambaBay']);
  });

  test('nothing matching gives an empty list', () => {
    expect(ids('Atlantic')).toEqual([]);
  });
});

describe('suggestAreas', () => {
  const name = (area: MarineArea) => areaName(area, 'en');
  const dar = { lat: -6.79, lon: 39.21 };
  const ids = (query: string, origin?: { lat: number; lon: number }) =>
    suggestAreas(query, DEFAULT_MARINE_AREAS, name, origin).map(a => a.id);

  test('an empty search suggests the three nearest the place', () => {
    expect(ids('', dar)).toEqual(['darEsSalaam', 'zanzibar', 'mafia']);
  });

  test('without a place, the first three in list order', () => {
    expect(ids('')).toEqual(['tanga', 'pemba', 'zanzibar']);
  });

  test('matches are capped at four, nearest first', () => {
    expect(ids('lake', { lat: -2.52, lon: 32.9 })).toEqual(['victoriaMwanza', 'victoriaMusoma', 'victoriaBukoba', 'tanganyikaKigoma']);
  });
});

describe('selectedArea', () => {
  const dar = { lat: -6.79, lon: 39.21 };

  test('the user\'s choice wins over the nearest', () => {
    expect(selectedArea('victoriaMwanza', dar)?.id).toBe('victoriaMwanza');
  });

  test('no choice, or one no longer configured, falls back to the nearest', () => {
    expect(selectedArea(undefined, dar)?.id).toBe('darEsSalaam');
    expect(selectedArea('gone', dar)?.id).toBe('darEsSalaam');
  });
});

// --- wind ----------------------------------------------------------------------

describe('windBand', () => {
  test.each([
    ['lake', 9.9, 'light'],
    ['lake', 10, 'moderate'],
    ['lake', 14.9, 'moderate'],
    ['lake', 15, 'strong'],
    ['ocean', 9.9, 'light'],
    ['ocean', 10, 'moderate'],
    ['ocean', 15, 'moderate'],
    ['ocean', 19.9, 'moderate'],
    ['ocean', 20, 'strong'],
  ] as const)('%s at %s kt is %s', (water, knots, band) => {
    expect(windBand([detail(knots)], water)).toBe(band);
  });

  test('takes the highest wind in the part', () => {
    expect(windBand([detail(5), detail(21), detail(8)], 'ocean')).toBe('strong');
  });

  test('a six-hour block is judged by its highest reading, not its average', () => {
    const block: DetailStep = { ...detail(8), windSpeedMax: kt(21) };
    expect(windBand([block], 'ocean')).toBe('strong');
  });

  test('is undefined with no wind data', () => {
    expect(windBand([detail(undefined)], 'ocean')).toBeUndefined();
  });
});

// --- sky -----------------------------------------------------------------------

describe('skyForPart', () => {
  test('rain above cloud above clear', () => {
    expect(skyForPart([detail(5, 'clearsky_day'), detail(5, 'lightrain'), detail(5, 'cloudy')]))
      .toEqual({ symbol: 'lightrain', labelKey: 'lightrain' });
  });

  test('thunder above everything', () => {
    expect(skyForPart([detail(5, 'heavyrain'), detail(5, 'rainandthunder')])?.symbol).toBe('rainandthunder');
  });

  test('the label is the symbol\'s own name', () => {
    expect(en(skyForPart([detail(5, 'partlycloudy_day')])!.labelKey)).toBe('Partly cloudy');
    expect(en(skyForPart([detail(5, 'rainshowers_day')])!.labelKey)).toBe('Rain showers');
    expect(en(skyForPart([detail(5, 'rain')])!.labelKey)).toBe('Rain');
    expect(sw(skyForPart([detail(5, 'rain')])!.labelKey)).toBe('Mvua');
  });

  test('the night part uses night icons', () => {
    expect(skyForPart([detail(5, 'partlycloudy_day')], 'night')).toEqual({ symbol: 'partlycloudy_night', labelKey: 'partlycloudy_night' });
    expect(nightSymbol('cloudy')).toBe('cloudy');
  });

  test('is undefined with no known symbol', () => {
    expect(skyForPart([detail(5, '??')])).toBeUndefined();
  });
});

// --- rain ----------------------------------------------------------------------

describe('rain', () => {
  test.each([
    [0, 'none'],
    [0.09, 'none'],
    [0.1, 'light'],
    [24.9, 'light'],
    [25, 'moderate'],
    [49.9, 'moderate'],
    [50, 'heavy'],
  ] as const)('%s mm in 24 hours is %s', (mm, band) => {
    expect(rainBandFor(mm)).toBe(band);
  });

  const step = (time: string, precipitation: number | '-', period?: number): ForecastStepRecord => ({
    time: local(time).toISO()!, precipitation, period, weatherSymbol: 'rain',
  });

  test('6-hour amounts on 3-hourly steps are not counted twice', () => {
    const series = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map(time => step(time, 6, 6));
    expect(rain24h(series, local('06:00'))).toBeCloseTo(18);
  });

  test('hourly amounts add up, and only the next 24 hours count', () => {
    const series = Array.from({ length: 30 }, (_, i) => ({
      ...step('00:00', 1, 1),
      time: local('06:00').plus({ hours: i }).toISO()!,
    }));
    expect(rain24h(series, local('06:00'))).toBeCloseTo(24);
  });

  test('a block cut by the window counts in part', () => {
    expect(rain24h([step('06:00', 6, 6)], local('09:00'))).toBeCloseTo(3);
  });

  test('no amounts means no rain data', () => {
    expect(rainBand24h([step('06:00', '-', 6)], local('06:00'))).toBeUndefined();
  });
});

// --- parts of the day ----------------------------------------------------------

const HOURS = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

// 3-hourly steps with 6-hour blocks from 06:00 to 03:00 the next day. Wind
// per part (morning, afternoon, evening, night), in knots; rain spread over
// the four 6-hour blocks that get counted.
function series(winds: [number, number, number, number], rainMm = 0): ForecastStepRecord[] {
  const times = [...HOURS.map(local), local('00:00').plus({ days: 1 }), local('03:00').plus({ days: 1 })];
  return times.map((time, i) => ({
    time: time.toISO()!,
    windSpeed: kt(winds[Math.floor(i / 2)]),
    precipitation: rainMm / 4,
    period: 6,
    weatherSymbol: 'cloudy',
  }));
}

const L = 5, M = 12, S = 22; // knots: light, moderate, strong on the ocean

function bannerFor(winds: [number, number, number, number], rainMm: number, now = local('06:00'), t = en) {
  const data = series(winds, rainMm);
  const parts = partsOfDay(data, DATE, TZ, now).map(part => part && summarisePart(part, 'ocean'));
  return summaryBanner(t, parts, rainBand24h(data, now));
}

describe('partsOfDay', () => {
  test('morning, afternoon, evening, then the night after', () => {
    const parts = partsOfDay(series([L, L, L, L]), DATE, TZ);
    expect(parts.map(p => p?.name)).toEqual(['morning', 'afternoon', 'evening', 'night']);
    expect(parts.map(p => p?.steps.map(s => DateTime.fromISO(s.start).toFormat('dd HH')))).toEqual([
      ['26 06', '26 09'], ['26 12', '26 15'], ['26 18', '26 21'], ['27 00', '27 03'],
    ]);
  });

  test('a part with no steps is null', () => {
    const data = series([L, L, L, L]).filter(step => DateTime.fromISO(step.time).setZone(TZ).hour >= 12 || DateTime.fromISO(step.time).setZone(TZ).hour < 6);
    expect(partsOfDay(data, DATE, TZ)[0]).toBeNull();
  });

  test('a part that is over is null once its steps have ended', () => {
    const parts = partsOfDay(series([L, L, L, L]), DATE, TZ, local('13:00'));
    expect(parts[0]).toBeNull();
    expect(parts[1]?.steps).toHaveLength(2); // 12:00 is still running
  });

  test('parts follow the place\'s time zone, not UTC', () => {
    // 21:00 UTC is 00:00 the next day in Dar es Salaam: tonight's Night.
    // 02:00 UTC is 05:00 on the date itself: the night before, not shown.
    const data: ForecastStepRecord[] = [
      { time: '2026-11-26T02:00:00Z', precipitation: 0, weatherSymbol: 'cloudy', windSpeed: kt(S) },
      { time: '2026-11-26T09:00:00Z', precipitation: 0, weatherSymbol: 'cloudy', windSpeed: kt(L) },
      { time: '2026-11-26T21:00:00Z', precipitation: 0, weatherSymbol: 'cloudy', windSpeed: kt(M) },
    ];
    const parts = partsOfDay(data, DATE, TZ);
    expect(parts.map(p => p?.name ?? null)).toEqual([null, 'afternoon', null, 'night']);
    expect(windBand(parts[3]!.steps, 'ocean')).toBe('moderate');
  });
});

// --- banner --------------------------------------------------------------------

describe('summaryBanner', () => {
  test.each([
    [[L, L, L, L], 4, 'okay', 'Okay all day', 'Light wind. Light rain today.'],
    [[L, S, M, L], 30, 'danger', 'Danger this afternoon', 'Strong wind from 12 to 6 pm. Moderate rain today.'],
    [[L, L, L, L], 30, 'takeCare', 'Take care today', 'Moderate rain expected today. Light wind.'],
    [[L, M, M, L], 0, 'takeCare', 'Take care this afternoon and evening', 'Moderate wind from noon to midnight. No rain today.'],
    [[M, M, M, L], 4, 'takeCare', 'Take care most of the day', 'Moderate wind from 6 am to midnight. Light rain today.'],
    [[L, S, L, L], 60, 'danger', 'Danger this afternoon', 'Strong wind from 12 to 6 pm. Heavy rain today.'],
  ] as const)('wind %j, %s mm: %s "%s"', (winds, rainMm, level, title, line) => {
    expect(bannerFor([...winds] as [number, number, number, number], rainMm)).toEqual({ level, title, line });
  });

  test('two parts apart are named, not spanned', () => {
    expect(bannerFor([M, L, M, L], 0)).toMatchObject({
      title: 'Take care this morning and evening',
      line: 'Moderate wind this morning and evening. No rain today.',
    });
  });

  test('a part with no data is left out', () => {
    // At 13:00 the morning is over, so its strong wind no longer counts.
    expect(bannerFor([S, L, L, L], 0, local('13:00'))).toMatchObject({ level: 'okay', title: 'Okay all day' });
  });

  test('nothing to go on gives no banner', () => {
    expect(summaryBanner(en, [null, null, null, null], undefined)).toBeNull();
  });

  test('Swahili has its own word order and a 24-hour clock', () => {
    expect(bannerFor([L, S, M, L], 30, local('06:00'), sw)).toEqual({
      level: 'danger',
      title: 'Hatari leo mchana',
      line: 'Upepo mkali kuanzia 12:00 hadi 18:00. Mvua ya wastani leo.',
    });
  });

  test('the parts it is given may be unsorted', () => {
    const data = series([L, M, M, L]);
    const parts = partsOfDay(data, DATE, TZ).map(part => part && summarisePart(part, 'ocean')) as PartSummary[];
    expect(summaryBanner(en, [...parts].reverse(), 'none')?.title).toBe('Take care this afternoon and evening');
  });
});
