import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { jsonStorage } from '@/lib/storage';

// The marine area picked on the At sea page, per place, so a new place
// starts again from its nearest area. Kept on the device; nothing else
// reads it.
type AreaChoiceState = {
  choices: Record<string, string>;
  choose: (placeKey: string, areaId: string) => void;
};

// Places are told apart by position, to about a kilometre.
export const placeKey = (place: { lat: number; lon: number } | undefined): string =>
  place ? `${place.lat.toFixed(2)},${place.lon.toFixed(2)}` : 'none';

export const useAreaChoiceStore = create<AreaChoiceState>()(
  persist(
    set => ({
      choices: {},
      choose: (key, areaId) => set(state => ({ choices: { ...state.choices, [key]: areaId } })),
    }),
    {
      name: 'at-sea-area',
      storage: createJSONStorage(() => jsonStorage),
    },
  ),
);
