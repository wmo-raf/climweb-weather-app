import React from 'react';
import TestRenderer, { act, ReactTestInstance } from 'react-test-renderer';

import en from '@/lib/localization/translations/english.json';
import { SCREENS, TAB_ROUTES } from '@/lib/layout/constants';

// Kept out of app/ so expo-router doesn't treat it as a route.

const mockPush = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (require('@/lib/localization/translations/english.json') as Record<string, string>)[key] ?? key,
  }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useNavigation: () => ({ canGoBack: () => false, goBack: jest.fn() }),
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@/lib/hooks/use-color-scheme', () => ({ useColorScheme: () => 'light' }));
jest.mock('@/lib/hooks/alerts.hook', () => ({ useAlertsQuery: () => ({ data: [] }) }));

// eslint-disable-next-line import/first
import AppTabBar from '@/components/AppTabBar';
// eslint-disable-next-line import/first
import MoreConditionsScreen from '@/app/(tabs)/More/index';

const textOf = (node: ReactTestInstance): string =>
  node.children.map(c => (typeof c === 'string' ? c : textOf(c))).join('');

// Entries on the More conditions screen, top to bottom (each is a
// SettingItem's pressable row; AppBar's controls don't set a role).
const entriesOf = (root: ReactTestInstance) =>
  root.findAll(n => typeof n.type !== 'string' && n.props.accessibilityRole === 'button' && !!n.props.onPress, { deep: false });

const render = (element: React.ReactElement) => {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    // @types/react-test-renderer bundles an older @types/react whose
    // ReactElement doesn't accept React 19's — the runtime is the same.
    renderer = TestRenderer.create(element as unknown as Parameters<typeof TestRenderer.create>[0]);
  });
  return renderer;
};

describe('bottom tab bar', () => {
  test('tabs read Today, Five Days, Alerts, More in that order', () => {
    const state = { index: 0, routes: TAB_ROUTES.map(name => ({ key: `${name}-key`, name })) };
    const navigation = { emit: () => ({ defaultPrevented: false }), navigate: jest.fn() };

    const { root } = render(<AppTabBar state={state} navigation={navigation} />);
    const labels = root
      .findAll(n => n.props.accessibilityRole === 'button' && typeof n.type !== 'string')
      .filter((n, i, all) => all.findIndex(m => m.props.accessibilityLabel === n.props.accessibilityLabel) === i)
      .map(n => n.props.accessibilityLabel);

    expect(labels).toEqual(['Today', 'Five Days', 'Alerts', 'More']);
  });

  test('re-tapping the current tab on a sub-page returns to its first screen', () => {
    // Alerts tab focused, its stack showing warning details (index 1).
    const routes = TAB_ROUTES.map(name => ({
      key: `${name}-key`,
      name,
      ...(name === 'Warnings' ? { state: { key: 'warnings-stack', index: 1 } } : {}),
    }));
    const state = { index: TAB_ROUTES.indexOf('Warnings'), routes };
    const navigation = { emit: () => ({ defaultPrevented: false }), navigate: jest.fn(), dispatch: jest.fn() };

    const { root } = render(<AppTabBar state={state} navigation={navigation} />);
    const alertsTab = root.find(n => typeof n.type !== 'string' && n.props.accessibilityLabel === 'Alerts' && !!n.props.onPress);
    act(() => alertsTab.props.onPress());

    expect(navigation.dispatch).toHaveBeenCalledWith({ type: 'POP_TO_TOP', target: 'warnings-stack' });
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});

describe('More conditions screen', () => {
  beforeEach(() => mockPush.mockClear());

  test('is titled "More conditions"', () => {
    const { root } = render(<MoreConditionsScreen />);
    expect(root.findAll(n => typeof n.type === 'string' && textOf(n) === en['More conditions']).length).toBeGreaterThan(0);
  });

  test('Favourites card is the first entry', () => {
    const { root } = render(<MoreConditionsScreen />);
    const cards = entriesOf(root);

    expect(cards[0].props.testID).toBe('more-favourites');
    expect(textOf(cards[0])).toContain(en['Favourites']);
    expect(textOf(cards[0])).toContain(en['more.favourites.description']);
  });

  test('tapping the Favourites card opens the Favourites page', () => {
    const { root } = render(<MoreConditionsScreen />);
    const card = entriesOf(root)[0];

    act(() => card.props.onPress());

    expect(mockPush).toHaveBeenCalledWith(SCREENS.Favourites);
    expect(SCREENS.Favourites).toBe('/More/Favourites');
  });
});
