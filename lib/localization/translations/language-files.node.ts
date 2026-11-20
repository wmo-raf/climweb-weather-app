// Jest stand-in for language-files.ts (Jest has no require.context): reads
// the same *.json files from disk. Mapped in package.json's
// jest.moduleNameMapper; never bundled into the app.
import fs from 'fs';
import path from 'path';

import type { RawLanguageFile } from './language-files';

export const RAW_LANGUAGE_FILES: RawLanguageFile[] = fs
  .readdirSync(__dirname)
  .filter(name => name.endsWith('.json'))
  .sort()
  .map(name => ({
    file: `./${name}`,
    data: JSON.parse(fs.readFileSync(path.join(__dirname, name), 'utf8')),
  }));
