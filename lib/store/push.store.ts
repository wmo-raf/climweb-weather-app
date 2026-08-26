import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Constants from 'expo-constants';

import { jsonStorage } from '@/lib/storage';
import { readAlertAreas } from '@/lib/hooks/alert-areas.hook';
import { Place } from '@/lib/geo/places';
import { requestNotificationPermission, getPushToken } from '@/lib/push/token';
import { registerDevice } from '@/lib/push/devices-api';

type PushState = {
  notificationsEnabled: boolean;
  lastRegisteredToken?: string;
  lastRegisteredAreasKey?: string;
  error?: string;
};

type PushActions = {
  // Drives the Settings toggle: on enable, requests notification permission
  // and registers immediately. On disable, just flips the flag — the backend
  // already reaps dead tokens on its own via push receipts
  // (backend/src/push/receipts.ts), so there's nothing else to unwind
  // client-side.
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  // Re-registers with the backend if the push token or the user's chosen
  // alert areas (lib/hooks/alert-areas.hook.ts) changed since the last
  // successful registration. Called on app open, on foreground, and after
  // the user edits their areas — safe to call liberally since it no-ops
  // when nothing changed. No GPS or background location involved: areas are
  // static, user-picked places, not a live position.
  syncRegistration: () => Promise<void>;
};

// "Did the set of chosen areas change" is what matters here, not any one
// field, so areas are compared via a single stable serialized key rather
// than field-by-field.
function areasKey(areas: Place[]): string {
  return JSON.stringify(
    areas
      .map(p => ({ name: p.name, lat: p.latitude, lon: p.longitude }))
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}

export const usePushStore = create<PushState & PushActions>()(
  persist(
    (set, get) => ({
      notificationsEnabled: false,
      lastRegisteredToken: undefined,
      lastRegisteredAreasKey: undefined,
      error: undefined,

      setNotificationsEnabled: async (enabled) => {
        if (Platform.OS === 'web') {
          set({ error: 'Push notifications are not supported on web.' });
          return;
        }

        if (!enabled) {
          set({ notificationsEnabled: false });
          return;
        }

        try {
          const granted = await requestNotificationPermission();
          if (!granted) {
            set({ error: 'Notification permission denied.' });
            return;
          }

          set({ notificationsEnabled: true, error: undefined });
          await get().syncRegistration();
        } catch (error) {
          console.error('Failed to enable weather alert notifications.', error);
          set({ error: 'There was a problem enabling notifications.' });
        }
      },

      syncRegistration: async () => {
        if (!get().notificationsEnabled || Platform.OS === 'web') {
          return;
        }

        const areas = readAlertAreas();
        if (areas.length === 0) {
          return;
        }

        try {
          const token = await getPushToken();
          const key = areasKey(areas);
          const { lastRegisteredToken, lastRegisteredAreasKey } = get();
          if (token === lastRegisteredToken && key === lastRegisteredAreasKey) {
            return;
          }

          await registerDevice({
            expoPushToken: token,
            areas: areas.map(place => ({
              name: place.name,
              lat: place.latitude,
              lon: place.longitude,
            })),
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
            appVersion: Constants.expoConfig?.version,
          });

          set({ lastRegisteredToken: token, lastRegisteredAreasKey: key });
        } catch (error) {
          console.warn('Failed to register device for weather alert notifications.', error);
        }
      },
    }),
    {
      name: 'push-store',
      storage: createJSONStorage(() => jsonStorage),
      partialize: (state) => ({
        notificationsEnabled: state.notificationsEnabled,
        lastRegisteredToken: state.lastRegisteredToken,
        lastRegisteredAreasKey: state.lastRegisteredAreasKey,
      }),
    }
  )
);
