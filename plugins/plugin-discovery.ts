import { MorePlugin, RegisteredPlugin } from './types';

// Finds every plugin folder: plugins/<id>/index.ts(x). Metro resolves
// require.context when bundling, so adding a folder is all it takes to make
// a plugin available; nothing lists plugins by hand. Folders starting with
// "_" are skipped (reserved for templates and shared helpers).
//
// Jest has no require.context, so tests use plugin-discovery.node.ts (see
// moduleNameMapper in package.json), which does the same with fs.
const context = require.context('./', true, /^\.\/[^/_][^/]*\/index\.tsx?$/);

export function discoverPlugins(): RegisteredPlugin[] {
  return context.keys().map(key => {
    const id = key.split('/')[1];
    const plugin = context<{ default: MorePlugin }>(key).default;
    return { ...plugin, id };
  });
}
