import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

// Show alerts while the app is foregrounded rather than staying silent
// until backgrounded — a severe weather warning is exactly the kind of
// thing a user should see immediately, not just find in the tray later.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type AlertNotificationData = {
  alertID?: string;
  areaDesc?: string;
};

// Deep-links a tapped notification into the same detail screen the in-app
// alert banner uses (components/Alerts.tsx) — the backend sends `alertID`/
// `areaDesc` in the push payload (see backend/src/push/dispatch.ts) to match
// this exact { location, alertID } route param contract.
export function registerNotificationResponseListener(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as AlertNotificationData;
    if (!data?.alertID) {
      return;
    }
    router.push({
      pathname: '/WeatherWarning',
      params: { location: data.areaDesc ?? '', alertID: data.alertID },
    });
  });

  return () => subscription.remove();
}
