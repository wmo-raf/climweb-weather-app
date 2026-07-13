import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Place } from '@/lib/geo/places';

const FAVOURITES_KEY = 'places.favourites';

export const MAX_FAVOURITE_PLACES = 5;

type ReturnType = [
  loading: boolean,
  favourites: Place[],
  saveFavourites: (places: Place[]) => Promise<void>,
];

// Mirrors the AsyncStorage-backed pattern used for onboarding/language —
// favourites are a device-local setting, not domain data, so they live
// outside Redux like those do. Re-reads on focus (not just on mount) so
// the Places tab picks up edits made on EditFavourites/OnboardingPlaces
// without needing to remount.
export function useFavourites(): ReturnType {
  const [loading, setLoading] = useState(true);
  const [favourites, setFavourites] = useState<Place[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(FAVOURITES_KEY)
        .then(value => setFavourites(value ? JSON.parse(value) : []))
        .catch(() => setFavourites([]))
        .finally(() => setLoading(false));
    }, [])
  );

  const saveFavourites = useCallback(async (places: Place[]) => {
    setFavourites(places);
    await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(places));
  }, []);

  return [loading, favourites, saveFavourites];
}
