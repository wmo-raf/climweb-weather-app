import React from 'react';
import TestRenderer, { act, ReactTestInstance } from 'react-test-renderer';

// Kept out of app/ so expo-router doesn't treat it as a route.

const mockLanguage = { current: 'en' };
const mockWindow = { fontScale: 1 };

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
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  // A wide window, to show the grid ignores it and uses its measured width.
  default: () => ({ width: 1366, height: 1024, scale: 2, fontScale: mockWindow.fontScale }),
}));
jest.mock('expo-font', () => ({ ...jest.requireActual('expo-font'), isLoaded: () => true }));
jest.mock('@/lib/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
jest.mock('@/lib/hooks/use-units', () => {
  const { useTranslation } = require('react-i18next');
  return {
    useUnits: () => {
      const { t } = useTranslation();
      return {
        temp: (v?: number) => `${Math.round(v ?? 0)}°C`,
        tempSpoken: (v: number) => t('units.spoken.celsius', { value: Math.round(v) }),
      };
    },
  };
});

// eslint-disable-next-line import/first
import DayPartsGrid from '@/components/DayPartsGrid';

const dayParts = {
  morning: { temperature: 20, weatherSymbol: 'partlycloudy_day', precipitation: 0 },
  afternoon: { temperature: 27, weatherSymbol: 'cloudy', precipitation: 0 },
  evening: { temperature: 24, weatherSymbol: 'fair_night', precipitation: 0 },
  night: { temperature: 22, weatherSymbol: 'clearsky_night', precipitation: 0 },
};

const cards = (root: ReactTestInstance) =>
  root.findAll(n => typeof n.type === 'string' && /^day-part-/.test(n.props.testID ?? ''));
const cardWidth = (card: ReactTestInstance) =>
  ([] as object[]).concat(card.props.style).flat(Infinity).reduce<number | undefined>(
    (w, s) => (s && typeof s === 'object' && 'width' in s ? (s as { width: number }).width : w), undefined);

const renderAt = (width: number) => {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<DayPartsGrid dayParts={dayParts} />);
  });
  const grid = renderer.root.find(n => n.props.testID === 'day-parts-grid' && typeof n.type === 'string');
  const before = cards(renderer.root).length;
  act(() => {
    grid.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width, height: 0 } } });
  });
  return { root: renderer.root, grid, before };
};

beforeEach(() => {
  mockLanguage.current = 'en';
  mockWindow.fontScale = 1;
});

describe('DayPartsGrid', () => {
  test('renders no cards until its width is measured', () => {
    expect(renderAt(378).before).toBe(0);
  });

  test('iPad portrait right column: 2 × 2, whatever the window width', () => {
    const { root } = renderAt(378);
    expect(cards(root).map(cardWidth)).toEqual([180, 180, 180, 180]);
  });

  test('wide: 4 across', () => {
    const { root } = renderAt(700);
    expect(cards(root).map(cardWidth)).toEqual([162, 162, 162, 162]);
  });

  test('200% text: 1 column', () => {
    mockWindow.fontScale = 2;
    const { root } = renderAt(378);
    expect(cards(root).map(cardWidth)).toEqual([377, 377, 377, 377]);
  });

  test('recalculates when the width changes (rotation, Split View, folding)', () => {
    const { root, grid } = renderAt(700);
    act(() => {
      grid.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 378, height: 0 } } });
    });
    expect(cards(root).map(cardWidth)).toEqual([180, 180, 180, 180]);
  });

  test('keeps the day-part order, which is also the reading order', () => {
    const { root } = renderAt(378);
    expect(cards(root).map(c => c.props.testID)).toEqual([
      'day-part-morning', 'day-part-afternoon', 'day-part-evening', 'day-part-night',
    ]);
  });

  test('each card reads as one item', () => {
    const { root } = renderAt(378);
    const [morning] = cards(root);
    expect(morning.props.accessible).toBe(true);
    expect(morning.props.accessibilityLabel).toBe('Morning, 20 degrees Celsius, Partly cloudy');
  });

  test('works in Swahili', () => {
    mockLanguage.current = 'sw';
    const { root } = renderAt(378);
    expect(cards(root)[0].props.accessibilityLabel).toBe('Asubuhi, 20 digrii za Selsiasi, Mawingu kiasi');
  });

  test('temperature stays on one line; condition wraps to at most two', () => {
    const { root } = renderAt(378);
    const texts = cards(root)[0].findAll(n => typeof n.type === 'string' && typeof n.children[0] === 'string');
    const temp = texts.find(n => n.children[0] === '20°C')!;
    const condition = texts.find(n => n.children[0] === 'Partly cloudy')!;
    expect(temp.props.numberOfLines).toBe(1);
    expect(condition.props.numberOfLines).toBe(2);
  });
});
