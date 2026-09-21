import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Physical-device and EAS-project-id checks mirror Expo's own guidance for
// getExpoPushTokenAsync — simulators/emulators don't have push capability,
// and the token request is scoped to a specific EAS project.
export async function getPushToken(): Promise<string> {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device.');
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    throw new Error('Missing EAS project ID (extra.eas.projectId in app.json).');
  }
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  console.log(data);
  return data;
}
