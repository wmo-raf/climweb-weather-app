import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { storage } from '@/lib/storage';
import { Place } from '@/lib/geo/places';

const FAVOURITES_KEY = 'places.favourites';

export const MAX_FAVOURITE_PLACES = 5;

type ReturnType = [
  loading: boolean,
  favourites: Place[],
  saveFavourites: (places: Place[]) => Promise<void>,
];

const readFavourites = (): Place[] => {
  const value = storage.getString(FAVOURITES_KEY);
  return value ? JSON.parse(value) : [];
};

// Favourites are a device-local setting, not domain data, so they live in
// storage rather than the location store. Re-reads on focus (not just on
// mount) so the Places tab picks up edits made on EditFavourites/
// OnboardingPlaces without needing to remount. MMKV reads are synchronous,
// so `loading` is always false — kept in the tuple for API compatibility.
export function useFavourites(): ReturnType {
  const [favourites, setFavourites] = useState<Place[]>(readFavourites);

  useFocusEffect(
    useCallback(() => {
      setFavourites(readFavourites());
    }, [])
  );

  const saveFavourites = useCallback(async (places: Place[]) => {
    setFavourites(places);
    storage.set(FAVOURITES_KEY, JSON.stringify(places));
  }, []);

  return [false, favourites, saveFavourites];
}
