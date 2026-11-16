import en from '@/lib/localization/translations/english.json';
import sw from '@/lib/localization/translations/swahili.json';

import { AVAILABLE_PLUGINS, resolveEnabledPlugins } from './registry';
import { RegisteredPlugin } from './types';

// Discovery imports each plugin's screen; these tests don't render them, so
// stub them rather than pull in what they need (native storage, queries).
// (jest.mock calls are hoisted above the imports.)
jest.mock('./at-sea/AtSeaScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('./farming/FarmingScreen', () => ({ __esModule: true, default: () => null }));

const plugin = (id: string): RegisteredPlugin => ({
  id,
  info: { name: id, version: '1.0.0', description: '', author: '', author_url: '', url: '', license: '', contact: '' },
  icon: 'star',
  titleKey: `${id}.title`,
  descriptionKey: `${id}.description`,
  Screen: () => null,
});

const lookup = (dict: object, key: string) => key.split('.').reduce<any>((obj, k) => obj?.[k], dict);

describe('resolveEnabledPlugins', () => {
  const available = [plugin('at-sea'), plugin('farming'), plugin('hydro')];
  const ids = (plugins: RegisteredPlugin[]) => plugins.map(p => p.id);

  test('nothing configured enables nothing', () => {
    expect(resolveEnabledPlugins(available, [])).toEqual([]);
  });

  test('keeps the configured order, not the folder order', () => {
    expect(ids(resolveEnabledPlugins(available, ['farming', 'at-sea']))).toEqual(['farming', 'at-sea']);
  });

  test('skips unknown ids with a warning that names the available ones', () => {
    const warn = jest.fn();
    expect(ids(resolveEnabledPlugins(available, ['at-sea', 'at_sea'], warn))).toEqual(['at-sea']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"at_sea"');
    expect(warn.mock.calls[0][0]).toContain('at-sea, farming, hydro');
  });

  test('drops repeated ids', () => {
    expect(ids(resolveEnabledPlugins(available, ['farming', 'farming']))).toEqual(['farming']);
  });
});

describe('discovered plugins', () => {
  test('finds every plugin folder', () => {
    expect(AVAILABLE_PLUGINS.map(p => p.id)).toEqual(['at-sea', 'farming']);
  });

  test.each(AVAILABLE_PLUGINS.map(p => [p.id, p] as const))('%s has complete info, a screen and translated card text', (_id, p) => {
    for (const field of ['name', 'version', 'description', 'author', 'url'] as const) {
      expect(p.info[field]).toBeTruthy();
    }
    expect(p.icon).toBeTruthy();
    expect(typeof p.Screen).toBe('function');
    for (const dict of [en, sw]) {
      expect(typeof lookup(dict, p.titleKey)).toBe('string');
      expect(typeof lookup(dict, p.descriptionKey)).toBe('string');
    }
  });
});
