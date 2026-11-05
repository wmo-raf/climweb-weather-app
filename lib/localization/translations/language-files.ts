// Every *.json file directly in this folder, collected by Metro when the app
// is bundled (require.context), so adding a language is just adding its
// file. Files are validated and ordered in index.ts.
//
// Jest has no require.context; tests use language-files.node.ts instead
// (mapped in package.json's jest.moduleNameMapper).
export type RawLanguageFile = { file: string; data: unknown };

const context = require.context('./', false, /\.json$/);

export const RAW_LANGUAGE_FILES: RawLanguageFile[] = context
  .keys()
  .map(file => ({ file, data: context(file) }));
