import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';
import { Text } from 'react-native-paper';
import { useRouter, Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import FavouritePlacesPicker from '@/components/FavouritePlacesPicker';
import { useOnboarding } from '@/lib/hooks/onboarding.hook';
import { useAlwaysShowStartPage } from '@/lib/hooks/always-show-start-page.hook';
import { useAlertAreas, MAX_ALERT_AREAS } from '@/lib/hooks/alert-areas.hook';
import { usePushStore } from '@/lib/store/push.store';
import { Place } from '@/lib/geo/places';
// Fixed to the light palette — same reasoning as Welcome/OnboardingPlaces:
// this screen's dark-navy hero doesn't retint with the app's dark-mode
// setting.
import { fonts, lightColors as colors, space } from '@/lib/theme';

// Fourth and final onboarding step, reached from OnboardingNotifications
// only after notification permission was granted — this is the one that
// marks onboarding complete. Lets the user pick which areas (up to
// MAX_ALERT_AREAS) they want severe weather warnings for; the backend
// matches warning polygons against these explicitly-chosen areas instead of
// the device's GPS position (see lib/store/push.store.ts).
function OnboardingAlertAreasScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [onboardingLoading, hasOnboarded, markOnboarded] = useOnboarding();
  const [alwaysShowLoading, alwaysShowStartPage] = useAlwaysShowStartPage();
  const [areasLoading, areas, saveAreas] = useAlertAreas();

  const loading = onboardingLoading || alwaysShowLoading || areasLoading;

  const onFinish = async (places: Place[]) => {
    await saveAreas(places);
    await usePushStore.getState().syncRegistration();
    await markOnboarded();
    router.replace('/');
  };

  // Same stale-navigation/deep-link guard as the earlier onboarding steps.
  if (!loading && hasOnboarded && !alwaysShowStartPage) {
    return <Redirect href="/" />;
  }

  if (loading) {
    return <SafeAreaView style={styles.wrapper}><SystemBars style="light" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <SystemBars style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('notifications.areas.title')}</Text>
      </View>
      <FavouritePlacesPicker
        initialSelected={areas}
        finishLabel={t('welcome.getStarted')}
        onFinish={onFinish}
        theme="dark"
        max={MAX_ALERT_AREAS}
        subtitleKey="notifications.areas.subtitle"
        maxReachedKey="notifications.areas.maxReached"
      />
    </SafeAreaView>
  );
}

export default OnboardingAlertAreasScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bgOverlay,
  },
  header: {
    paddingHorizontal: space[4],
    paddingTop: space[4],
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.bold,
    color: colors.textInverse,
  },
});
