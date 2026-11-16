import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

// Kept out of app/ so expo-router doesn't treat it as a route.

let mockParams: { plugin?: string } = {};

jest.mock('expo-router', () => {
  const { Text } = require('react-native');
  return {
    useLocalSearchParams: () => mockParams,
    Redirect: ({ href }: { href: string }) => <Text testID="redirect">{href}</Text>,
  };
});
// Only At sea is enabled for this deployment.
jest.mock('@/config', () => ({ ...jest.requireActual('@/config'), MORE_PLUGINS: ['at-sea'] }));
jest.mock('@/plugins/at-sea/AtSeaScreen', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="at-sea-screen" /> };
});
jest.mock('@/plugins/farming/FarmingScreen', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="farming-screen" /> };
});

// eslint-disable-next-line import/first
import PluginScreen from '@/app/(tabs)/More/[plugin]';

const render = (plugin?: string) => {
  mockParams = { plugin };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<PluginScreen /> as unknown as Parameters<typeof TestRenderer.create>[0]);
  });
  return renderer.root;
};

const testIDs = (root: TestRenderer.ReactTestInstance) =>
  root.findAll(n => typeof n.type === 'string' && !!n.props.testID).map(n => n.props.testID);

describe('More plugin route', () => {
  test('an enabled plugin shows its page', () => {
    expect(testIDs(render('at-sea'))).toEqual(['at-sea-screen']);
  });

  test.each([
    ['a disabled plugin', 'farming'],
    ['an unknown plugin', 'nowhere'],
    ['no id', undefined],
  ])('%s redirects to More conditions', (_case, id) => {
    const root = render(id);
    expect(testIDs(root)).toEqual(['redirect']);
    expect(root.find(n => n.props.testID === 'redirect' && typeof n.type === 'string').props.children).toBe('/More');
  });
});
