import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { storage } from '@/lib/storage';
import { Place } from '@/lib/geo/places';

const ALERT_AREAS_KEY = 'notifications.alertAreas';

export const MAX_ALERT_AREAS = 5;

type ReturnType = [
  loading: boolean,
  areas: Place[],
  saveAreas: (places: Place[]) => Promise<void>,
];

// Exported for non-component callers (push.store.ts's syncRegistration,
// which runs outside React and can't use the hook below).
export const readAlertAreas = (): Place[] => {
  const value = storage.getString(ALERT_AREAS_KEY);
  return value ? JSON.parse(value) : [];
};

const areasEqual = (a: Place[], b: Place[]): boolean =>
  a.length === b.length && JSON.stringify(a) === JSON.stringify(b);

// Areas the user wants weather warnings for — explicitly chosen (same
// picker/cap as favourites, see lib/hooks/favourites.hook.ts), not derived
// from GPS. This is what's sent to the notifications backend instead of a
// device location; see lib/store/push.store.ts.
export function useAlertAreas(): ReturnType {
  const [areas, setAreas] = useState<Place[]>(readAlertAreas);

  useFocusEffect(
    useCallback(() => {
      setAreas(prev => {
        const next = readAlertAreas();
        return areasEqual(prev, next) ? prev : next;
      });
    }, [])
  );

  const saveAreas = useCallback(async (places: Place[]) => {
    setAreas(places);
    storage.set(ALERT_AREAS_KEY, JSON.stringify(places));
  }, []);

  return [false, areas, saveAreas];
}
