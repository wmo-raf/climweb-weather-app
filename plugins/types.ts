import { ComponentType } from 'react';

// Metadata about a plugin, the same fields ClimWeb's climweb_plugin_info.json
// uses (see the "Extending Climweb" docs), so a website plugin and its app
// counterpart can be described alike.
export type PluginInfo = {
  name: string;
  version: string;
  description: string;
  author: string;
  author_url: string;
  url: string;
  license: string;
  contact: string;
};

// What a plugin's index.ts exports as default. A plugin adds one page to the
// More tab: a card on "More conditions" that opens its Screen.
export type MorePlugin = {
  info: PluginInfo;
  // MaterialCommunityIcons name for the More card's tile.
  icon: string;
  // i18n keys for the More card. Strings live in the app's language files
  // for now, so they go through the same translation review as the rest.
  titleKey: string;
  descriptionKey: string;
  // The page itself, rendered at /More/<id>. Gets no props: read the place,
  // forecast etc. from the app's hooks and stores like any other screen.
  Screen: ComponentType;
};

// A discovered plugin. Its id is its folder name under plugins/, which is
// also its value in EXPO_PUBLIC_MORE_PLUGINS and its URL (/More/<id>).
export type RegisteredPlugin = MorePlugin & { id: string };

// Identity helper so a plugin's index.ts is type-checked against MorePlugin
// without a type annotation.
export const definePlugin = (plugin: MorePlugin): MorePlugin => plugin;
