import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ALWAYS_SHOW_START_PAGE_KEY = 'settings.alwaysShowStartPage';

type ReturnType = [
  loading: boolean,
  alwaysShowStartPage: boolean,
  setAlwaysShowStartPage: (value: boolean) => Promise<void>,
];

// Mirrors the AsyncStorage-backed pattern used for onboarding/language —
// a device-local setting, not domain data.
export function useAlwaysShowStartPage(): ReturnType {
  const [loading, setLoading] = useState(true);
  const [alwaysShowStartPage, setAlwaysShowStartPageState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ALWAYS_SHOW_START_PAGE_KEY)
      .then(value => setAlwaysShowStartPageState(value === 'true'))
      .catch(() => setAlwaysShowStartPageState(false))
      .finally(() => setLoading(false));
  }, []);

  const setAlwaysShowStartPage = async (value: boolean) => {
    setAlwaysShowStartPageState(value);
    await AsyncStorage.setItem(ALWAYS_SHOW_START_PAGE_KEY, value ? 'true' : 'false');
  };

  return [loading, alwaysShowStartPage, setAlwaysShowStartPage];
}
