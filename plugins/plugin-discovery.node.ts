import fs from 'fs';
import path from 'path';

import { MorePlugin, RegisteredPlugin } from './types';

// Jest stand-in for plugin-discovery.ts: same folders, found with fs instead
// of Metro's require.context.
export function discoverPlugins(): RegisteredPlugin[] {
  return fs
    .readdirSync(__dirname, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
    .filter(entry => ['index.ts', 'index.tsx'].some(file => fs.existsSync(path.join(__dirname, entry.name, file))))
    .map(entry => entry.name)
    .sort()
    .map(id => ({ ...(require(`./${id}`) as { default: MorePlugin }).default, id }));
}
