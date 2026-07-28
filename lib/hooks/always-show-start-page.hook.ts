import { useState } from 'react';

import { storage } from '@/lib/storage';

const ALWAYS_SHOW_START_PAGE_KEY = 'settings.alwaysShowStartPage';

type ReturnType = [
  loading: boolean,
  alwaysShowStartPage: boolean,
  setAlwaysShowStartPage: (value: boolean) => Promise<void>,
];

// Device-local setting, not domain data. MMKV reads are synchronous, so
// `loading` is always false — kept in the tuple for API compatibility
// with call sites.
export function useAlwaysShowStartPage(): ReturnType {
  const [alwaysShowStartPage, setAlwaysShowStartPageState] = useState(() => storage.getBoolean(ALWAYS_SHOW_START_PAGE_KEY) ?? false);

  const setAlwaysShowStartPage = async (value: boolean) => {
    setAlwaysShowStartPageState(value);
    storage.set(ALWAYS_SHOW_START_PAGE_KEY, value);
  };

  return [false, alwaysShowStartPage, setAlwaysShowStartPage];
}
