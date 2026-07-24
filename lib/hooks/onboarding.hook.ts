import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDED_KEY = 'settings.onboarded';

type ReturnType = [
  loading: boolean,
  hasOnboarded: boolean,
  markOnboarded: () => Promise<void>,
];

// Mirrors the AsyncStorage-backed pattern already used for language
// persistence in lib/localization/i18n.ts, rather than a Redux slice —
// this is a single app-level flag, not domain data.
export function useOnboarding(): ReturnType {
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then(value => setHasOnboarded(value === 'true'))
      .catch(() => setHasOnboarded(false))
      .finally(() => setLoading(false));
  }, []);

  const markOnboarded = async () => {
    setHasOnboarded(true);
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
  };

  return [loading, hasOnboarded, markOnboarded];
}
