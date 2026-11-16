import { MORE_PLUGINS } from '@/config';
import { discoverPlugins } from './plugin-discovery';
import { RegisteredPlugin } from './types';

// Picks the plugins to show, in the order EXPO_PUBLIC_MORE_PLUGINS lists
// them. Every plugin folder is bundled, but only listed ones appear: unset
// means none, so the More tab shows Favourites alone. Unknown or repeated
// ids are skipped.
export function resolveEnabledPlugins(
  available: RegisteredPlugin[],
  enabledIds: string[],
  warn: (message: string) => void = message => { if (__DEV__) console.warn(message); },
): RegisteredPlugin[] {
  const byId = new Map(available.map(plugin => [plugin.id, plugin]));
  const enabled: RegisteredPlugin[] = [];

  for (const id of enabledIds) {
    const plugin = byId.get(id);
    if (!plugin) {
      warn(`EXPO_PUBLIC_MORE_PLUGINS lists "${id}", but there is no plugins/${id} folder. Available: ${[...byId.keys()].join(', ') || 'none'}.`);
    } else if (!enabled.includes(plugin)) {
      enabled.push(plugin);
    }
  }
  return enabled;
}

export const AVAILABLE_PLUGINS = discoverPlugins();
export const ENABLED_PLUGINS = resolveEnabledPlugins(AVAILABLE_PLUGINS, MORE_PLUGINS);

// Undefined for an unknown or disabled plugin, so its route can redirect.
export const findEnabledPlugin = (id: string | undefined): RegisteredPlugin | undefined =>
  ENABLED_PLUGINS.find(plugin => plugin.id === id);

export const pluginHref = (id: string) => `/More/${id}`;
