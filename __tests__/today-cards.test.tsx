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
import LandingPage from '@/app/(tabs)/index';

const step = (time: string, wind: Partial<ForecastStepRecord>): ForecastStepRecord => ({
  time,
  temperature: 28,
  precipitation: 0,
  weatherSymbol: 'partlycloudy_day',
  ...wind,
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

beforeEach(() => {
  mockLanguage.current = 'en';
  mockUnits.wind = 'kmh';
});

describe('Landing page sections', () => {
  // Today in the device's zone, which is how the landing page picks the day:
  // an hour that has started and one still to come (hour by hour).
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
      n.props.testID === 'sun-times-card' ||
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

  test('a sparse forecast shows the sun card, not hour by hour', () => {
    expect(sectionOrder(renderLanding(true))).toEqual(['sun-times-card']);
  });

  test('an hourly forecast shows hour by hour, not the sun card', () => {
    expect(sectionOrder(renderLanding(false))).toEqual(['hourly']);
  });

  test('defaults to sparse', () => {
    expect(sectionOrder(renderLanding())).toEqual(['sun-times-card']);
  });

  test('the sun card is for the selected place', () => {
    const root = renderLanding(true);
    expect(byTestID(root, 'sun-times-card')[0].props).toMatchObject({ lat: -6.8, lon: 39.28 });
  });
});
