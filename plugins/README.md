# More tab plugins

A plugin adds one page to the More tab: a card on **More conditions** that opens the page at `/More/<name>`. Favourites is built in and always comes first; plugins follow it.

The design follows [ClimWeb's plugins](https://climweb.readthedocs.io/en/latest/_docs/technical/extending-climweb/index.html): a plugin is a folder named after itself, found by convention, with ClimWeb-style metadata and its own settings.

## Layout

```
plugins/
  <name>/                 folder name = plugin id = config value = URL
    index.ts              the manifest (required)
    <Name>Screen.tsx      the page
    settings.ts           its EXPO_PUBLIC_* settings and defaults
    ...                   anything only this plugin uses, with its tests
  types.ts                MorePlugin, PluginInfo, definePlugin
  registry.ts             which plugins are enabled, in what order
  plugin-discovery.ts     finds plugin folders (Metro require.context)
```

Every folder with an `index.ts(x)` is found automatically; nothing lists plugins by hand. Folders starting with `_` are skipped.

## The manifest

```ts
import { definePlugin } from '../types';
import RiversScreen from './RiversScreen';

export default definePlugin({
  info: {                   // same fields as ClimWeb's climweb_plugin_info.json
    name: 'Rivers',
    version: '1.0.0',
    description: 'River levels and flood outlooks.',
    author: '…', author_url: '…', url: '…', license: '…', contact: '…',
  },
  icon: 'waves-arrow-up',   // MaterialCommunityIcons name for the More card
  titleKey: 'rivers.title', // i18n keys for the More card
  descriptionKey: 'more.rivers.description',
  Screen: RiversScreen,      // rendered at /More/<name>, gets no props
});
```

## Enabling

A deployment lists the plugins to show, in order:

```env
EXPO_PUBLIC_MORE_PLUGINS='at-sea,farming'
```

Unset shows Favourites alone. A plugin that isn't listed is still bundled, but its card is hidden and `/More/<name>` redirects to More conditions.

## What goes in a plugin

- **In the plugin:** its screen, settings, and any component, hook or helper only it uses.
- **In the app:** anything a second plugin, or the app itself, uses. For example `SunTimesCard`, `ReadMoreCard`, `lib/sun` and `NAME_OF_THE_NHMS` are shared by At sea and For farming, so they stay outside `plugins/`.
- **Translations** stay in the app's language files (`lib/localization/translations`) for now, so they go through the same review as the rest of the app. `registry.test.ts` checks every plugin's card text exists in English and Swahili.
- **Imports:** use relative paths within the plugin, and `@/…` for the app. A plugin must not import another plugin.

## Testing

- Keep a plugin's tests next to its code. Jest finds them anywhere outside `app/`.
- Jest has no `require.context`, so tests discover plugins with `plugin-discovery.node.ts` (mapped in `package.json`).
- Tests that load the registry but don't render a plugin's page should stub its screen module, as `registry.test.ts` does.
