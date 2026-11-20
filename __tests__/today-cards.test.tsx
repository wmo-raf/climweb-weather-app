import React from 'react';
import TestRenderer, { act, ReactTestInstance } from 'react-test-renderer';
import { DateTime } from 'luxon';

import { ForecastRecord, ForecastStepRecord } from '@/lib/forecast/types';
import { WindUnit } from '@/lib/units';

// Kept out of app/ so expo-router doesn't treat it as a route.

const mockLanguage = { current: 'en' };
const mockUnits: { wind: WindUnit } = { wind: 'kmh' };

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
  return { useTranslation: () => ({ t: instance.getFixedT(mockLanguage.current) }) };
});
jest.mock('expo-router', () => ({
  Redirect: () => null,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useNavigation: () => ({ canGoBack: () => false, goBack: jest.fn(), addListener: () => () => {} }),
}));
jest.mock('expo-font', () => ({ ...jest.requireActual('expo-font'), isLoaded: () => true }));
jest.mock('@/lib/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
jest.mock('@/lib/hooks/use-units', () => {
  const { formatWind } = jest.requireActual('@/lib/units');
  return {
    useUnits: () => ({
      prefs: { temperature: 'celsius', wind: mockUnits.wind, precipitation: 'mm' },
      temp: (v?: number) => `${Math.round(v ?? 0)}°C`,
      tempValue: (v: number) => Math.round(v),
      tempSpoken: (v: number) => `${Math.round(v)} degrees Celsius`,
      wind: (v?: number) => formatWind(v, mockUnits.wind),
      rain: (v: number) => `${v} mm`,
    }),
  };
});
jest.mock('@/components/SunTimesCard', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: (props: { lat: number; lon: number }) => <View testID="sun-times-card" {...props} /> };
});

// The landing page (app/(tabs)/index.tsx) and what it depends on.
const mockPlace: { lat?: number; lon?: number } = { lat: -6.8, lon: 39.28 };
const mockForecast: { data?: ForecastRecord } = {};
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@/lib/store/location.store', () => ({
  useLocationStore: (select: (s: object) => unknown) => select({
    name: 'Dar es Salaam', ...mockPlace, loading: false, error: undefined,
    getPreciseLocation: () => {}, resetError: () => {},
  }),
}));
jest.mock('@/lib/hooks/current-forecast.hook', () => ({
  useForecastQuery: () => ({ data: mockForecast.data, isLoading: false, error: null, refetch: async () => {}, dataUpdatedAt: Date.now() }),
}));
jest.mock('@/lib/hooks/alerts.hook', () => ({ useAlertsQuery: () => ({ data: [], refetch: async () => {} }) }));
jest.mock('@/lib/hooks/onboarding.hook', () => ({ useOnboarding: () => [false, true] }));
jest.mock('@/lib/hooks/use-onboarding-toggle', () => ({ useOnboardingToggle: () => ({ alwaysShowOnboarding: false }) }));
jest.mock('@/lib/hooks/favourites.hook', () => ({ useFavourites: () => [false, []] }));
jest.mock('@/lib/hooks/breakpoint.hook', () => ({ useBreakpoint: () => 'large' }));
jest.mock('@/lib/hooks/use-review', () => ({ useReviewPrompt: () => {} }));
jest.mock('@/components/AppBar', () => () => null);
jest.mock('@/components/Alerts', () => () => null);
jest.mock('@/components/LastUpdatedFooter', () => () => null);

// eslint-disable-next-line import/first
import TodayWindCard from '@/components/TodayWindCard';
// eslint-disable-next-line import/first
import LandingPage from '@/app/(tabs)/index';

const NOW = DateTime.fromISO('2026-11-19T10:20:00+03:00');

const step = (time: string, wind: Partial<ForecastStepRecord>): ForecastStepRecord => ({
  time,
  temperature: 28,
  precipitation: 0,
  weatherSymbol: 'partlycloudy_day',
  ...wind,
});

// 5 m/s = 18 km/h. The 10:00 step covers "now"; 11:00 hasn't started.
const forecastWith = (wind: Partial<ForecastStepRecord>): ForecastRecord => ({
  days: [{
    day: '2026-11-19T00:00:00+03:00',
    maxTemperature: 31,
    minTemperature: 24,
    windSpeed: 5,
    steps: [
      step('2026-11-19T09:00:00+03:00', { windSpeed: 1, windDirection: 0 }),
      step('2026-11-19T10:00:00+03:00', wind),
      step('2026-11-19T11:00:00+03:00', { windSpeed: 9, windDirection: 270 }),
    ],
  }],
});

const render = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element as unknown as Parameters<typeof TestRenderer.create>[0]);
  });
  return renderer.root;
};

const byTestID = (root: ReactTestInstance, testID: string) =>
  root.findAll(n => n.props.testID === testID && typeof n.type === 'string');
const textOf = (node: ReactTestInstance): string =>
  node.children.map(c => (typeof c === 'string' ? c : textOf(c))).join('');

beforeEach(() => {
  mockLanguage.current = 'en';
  mockUnits.wind = 'kmh';
});

describe('TodayWindCard', () => {
  test('shows direction and speed for the current hour, read as one item', () => {
    const root = render(<TodayWindCard forecast={forecastWith({ windSpeed: 5, windDirection: 135 })} now={NOW} />);
    const [card] = byTestID(root, 'today-wind-card');

    expect(textOf(card)).toContain('WindWind from the south-east at 18 km/h.');
    expect(card.props.accessible).toBe(true);
    expect(card.props.accessibilityLabel).toBe('Wind. Wind from the south-east at 18 kilometres per hour.');
  });

  test('the arrow points downwind and is labelled with where the wind comes from', () => {
    const root = render(<TodayWindCard forecast={forecastWith({ windSpeed: 5, windDirection: 135 })} now={NOW} />);
    const [arrow] = byTestID(root, 'wind-arrow');

    expect(arrow.props.style.transform).toEqual([{ rotate: '135deg' }]);
    expect(arrow.props.accessibilityLabel).toBe('from south-east');
  });

  test('uses the chosen units', () => {
    mockUnits.wind = 'knots';
    const root = render(<TodayWindCard forecast={forecastWith({ windSpeed: 5, windDirection: 135 })} now={NOW} />);
    const [card] = byTestID(root, 'today-wind-card');

    expect(textOf(card)).toContain('Wind from the south-east at 10 kn.');
    expect(card.props.accessibilityLabel).toBe('Wind. Wind from the south-east at 10 knots.');
  });

  test('is hidden when the provider has no wind for now', () => {
    const root = render(<TodayWindCard forecast={forecastWith({ windDirection: 135 })} now={NOW} />);
    expect(byTestID(root, 'today-wind-card')).toHaveLength(0);
  });

  test('gives speed only, and no arrow, when the direction is missing', () => {
    const root = render(<TodayWindCard forecast={forecastWith({ windSpeed: 5 })} now={NOW} />);
    const [card] = byTestID(root, 'today-wind-card');

    expect(textOf(card)).toContain('Wind at 18 km/h.');
    expect(byTestID(root, 'wind-arrow')).toHaveLength(0);
  });

  test('gives no direction or arrow at zero speed', () => {
    const root = render(<TodayWindCard forecast={forecastWith({ windSpeed: 0, windDirection: 135 })} now={NOW} />);
    const [card] = byTestID(root, 'today-wind-card');

    expect(textOf(card)).toContain('Wind speed 0 km/h.');
    expect(byTestID(root, 'wind-arrow')).toHaveLength(0);
  });

  test('works in Swahili', () => {
    mockLanguage.current = 'sw';
    const root = render(<TodayWindCard forecast={forecastWith({ windSpeed: 5, windDirection: 135 })} now={NOW} />);
    const [card] = byTestID(root, 'today-wind-card');

    expect(textOf(card)).toContain('UpepoUpepo kutoka kusini-mashariki kwa kasi ya 18 km/h.');
    expect(card.props.accessibilityLabel).toBe('Upepo. Upepo kutoka kusini-mashariki kwa kasi ya kilomita 18 kwa saa.');
    expect(byTestID(root, 'wind-arrow')[0].props.accessibilityLabel).toBe('kutoka kusini-mashariki');
  });
});

describe('Landing page sections', () => {
  // Today in the device's zone, which is how the landing page picks the day:
  // an hour that has started (wind now) and one still to come (hour by hour).
  const todayForecast = (): ForecastRecord => {
    const now = DateTime.now();
    return {
      days: [{
        day: now.startOf('day').toISO()!,
        maxTemperature: 31,
        minTemperature: 24,
        windSpeed: 5,
        steps: [
          step(now.minus({ minutes: 30 }).toISO()!, { windSpeed: 5, windDirection: 135 }),
          step(now.plus({ hours: 1 }).toISO()!, { windSpeed: 6, windDirection: 135 }),
        ],
      }],
    };
  };

  const sectionOrder = (root: ReactTestInstance) =>
    root.findAll(n => typeof n.type === 'string' && (
      ['today-wind-card', 'sun-times-card'].includes(n.props.testID) ||
      (n.props.accessibilityLabel ?? '').startsWith('Today, hour by hour')
    )).map(n => n.props.testID ?? 'hourly');

  // index.tsx reads SPARSE_FORECAST from config at render (config/flags.test.ts
  // covers parsing it from the env), so tests set it on the module.
  const config = require('@/config') as { SPARSE_FORECAST: boolean };
  const defaultSparse = config.SPARSE_FORECAST;
  const renderLanding = (sparse = defaultSparse) => {
    config.SPARSE_FORECAST = sparse;
    return render(<LandingPage />);
  };

  afterAll(() => {
    config.SPARSE_FORECAST = defaultSparse;
  });

  beforeEach(() => {
    mockPlace.lat = -6.8;
    mockPlace.lon = 39.28;
    mockForecast.data = todayForecast();
  });

  test('a sparse forecast shows wind and sun, not hour by hour', () => {
    expect(sectionOrder(renderLanding(true))).toEqual(['today-wind-card', 'sun-times-card']);
  });

  test('an hourly forecast shows hour by hour, not wind and sun', () => {
    expect(sectionOrder(renderLanding(false))).toEqual(['hourly']);
  });

  test('defaults to sparse', () => {
    expect(sectionOrder(renderLanding())).toEqual(['today-wind-card', 'sun-times-card']);
  });

  test('the sun card is for the selected place', () => {
    const root = renderLanding(true);
    expect(byTestID(root, 'sun-times-card')[0].props).toMatchObject({ lat: -6.8, lon: 39.28 });
  });
});
