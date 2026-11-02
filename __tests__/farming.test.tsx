import React from 'react';
import TestRenderer, { act, ReactTestInstance } from 'react-test-renderer';

// Kept out of app/ so expo-router doesn't treat it as a route.

const mockSoil: { data?: unknown; isLoading: boolean } = { isLoading: false };

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options: Record<string, unknown> = {}) => {
      const dict = require('@/lib/localization/translations/english.json') as Record<string, any>;
      const value = typeof dict[key] === 'string' ? dict[key] : key.split('.').reduce<any>((obj, k) => obj?.[k], dict);
      return typeof value === 'string' ? value.replace(/{{(\w+)}}/g, (_: string, n: string) => String(options[n])) : key;
    },
  }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useNavigation: () => ({ canGoBack: () => true, goBack: jest.fn(), addListener: () => () => {} }),
}));
jest.mock('expo-font', () => ({ ...jest.requireActual('expo-font'), isLoaded: () => true }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@/lib/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
jest.mock('@/lib/hooks/use-units', () => ({
  useUnits: () => ({ tempValue: (v: number) => Math.round(v), tempSpoken: (v: number) => `${Math.round(v)} degrees Celsius` }),
}));
jest.mock('@/lib/store/location.store', () => ({
  useLocationStore: (select: (s: object) => unknown) => select({ name: 'Morogoro', lat: -6.82, lon: 37.66 }),
}));
jest.mock('@/lib/hooks/soil.hook', () => ({
  useSoilQuery: () => ({ ...mockSoil, dataUpdatedAt: mockSoil.data ? Date.now() : 0 }),
}));
jest.mock('@/components/SunTimesCard', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="sun-times-card" /> };
});

// eslint-disable-next-line import/first
import FarmingScreen from '@/app/(tabs)/More/Farming';

const render = () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<FarmingScreen /> as unknown as Parameters<typeof TestRenderer.create>[0]);
  });
  return renderer.root;
};

const has = (root: ReactTestInstance, testID: string) => root.findAll(n => n.props.testID === testID).length > 0;
const textOf = (node: ReactTestInstance): string =>
  node.children.map(c => (typeof c === 'string' ? c : textOf(c))).join('');

const now = new Date().toISOString();
const soilData = (temperature: number | null, moisture: number | null) => ({ hours: [{ time: now, temperature, moisture }] });

describe('For farming soil cards', () => {
  test('both cards show when both values are present', () => {
    mockSoil.data = soilData(24, 0.25);
    const root = render();

    expect(has(root, 'soil-moisture-card')).toBe(true);
    expect(has(root, 'soil-temperature-card')).toBe(true);
    const moisture = root.find(n => n.props.testID === 'soil-moisture-card' && typeof n.type === 'string');
    expect(moisture.props.accessibilityLabel).toBe(
      'Water in the soil: Good, Enough to plant. The soil is wet enough for planting this week.');
    expect(textOf(root.find(n => n.props.testID === 'soil-temperature-card' && typeof n.type === 'string'))).toContain('24°, warm enough');
    expect(root.findAll(n => typeof n.type === 'string' && /^Updated /.test(textOf(n))).length).toBeGreaterThan(0);
  });

  test('a null value hides only its own card', () => {
    mockSoil.data = soilData(null, 0.25);
    let root = render();
    expect(has(root, 'soil-moisture-card')).toBe(true);
    expect(has(root, 'soil-temperature-card')).toBe(false);

    mockSoil.data = soilData(24, null);
    root = render();
    expect(has(root, 'soil-moisture-card')).toBe(false);
    expect(has(root, 'soil-temperature-card')).toBe(true);
  });

  test('with no soil data the page shows only the sun card and Read more', () => {
    mockSoil.data = undefined; // failed request, nothing cached
    const root = render();

    expect(has(root, 'soil-moisture-card')).toBe(false);
    expect(has(root, 'soil-temperature-card')).toBe(false);
    expect(has(root, 'sun-times-card')).toBe(true);
    expect(root.findAll(n => typeof n.type === 'string' && textOf(n) === 'Read more from TMA').length).toBeGreaterThan(0);
    expect(root.findAll(n => n.props.accessibilityRole === 'link' && typeof n.type !== 'string', { deep: false }).map(n => n.props.accessibilityLabel))
      .toEqual(['Seasonal forecast', 'Agromet bulletins']);
    expect(root.findAll(n => typeof n.type === 'string' && /^Updated /.test(textOf(n)))).toHaveLength(0);
  });
});
