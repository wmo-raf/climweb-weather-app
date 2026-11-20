import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Kept out of app/ so expo-router doesn't treat it as a route. A file of its
// own because the enabled plugins are fixed when the registry loads, and
// more-tab.test.tsx loads it with both plugins on.

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useNavigation: () => ({ canGoBack: () => false, goBack: jest.fn(), addListener: () => () => {} }),
  useGlobalSearchParams: () => ({}),
}));
jest.mock('expo-font', () => ({ ...jest.requireActual('expo-font'), isLoaded: () => true }));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@/lib/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
// A deployment that hasn't set EXPO_PUBLIC_MORE_PLUGINS.
jest.mock('@/config', () => ({ ...jest.requireActual('@/config'), MORE_PLUGINS: [] }));
jest.mock('@/plugins/at-sea/AtSeaScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('@/plugins/farming/FarmingScreen', () => ({ __esModule: true, default: () => null }));

// eslint-disable-next-line import/first
import MoreConditionsScreen from '@/app/(tabs)/More/index';

test('with no plugins configured, Favourites is the only More entry', () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<MoreConditionsScreen /> as unknown as Parameters<typeof TestRenderer.create>[0]);
  });
  const cards = renderer.root.findAll(
    n => typeof n.type !== 'string' && n.props.accessibilityRole === 'button' && !!n.props.onPress,
    { deep: false },
  );

  expect(cards.map(c => c.props.testID)).toEqual(['more-favourites']);
});
