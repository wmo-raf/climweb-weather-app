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
import { useFavourites } from '@/lib/hooks/favourites.hook';
import { Place } from '@/lib/geo/places';
// Fixed to the light palette — same reasoning as Welcome.tsx: this screen's
// dark-navy hero doesn't retint with the app's dark-mode setting.
import { fonts, lightColors as colors, space } from '@/lib/theme';

// Second and final onboarding step, reached from Welcome's language
// screen. Selecting places is optional — finishing with none selected
// is how a user skips this step.
function OnboardingPlacesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [onboardingLoading, hasOnboarded, markOnboarded] = useOnboarding();
  const [alwaysShowLoading, alwaysShowStartPage] = useAlwaysShowStartPage();
  const [favouritesLoading, favourites, saveFavourites] = useFavourites();

  const loading = onboardingLoading || alwaysShowLoading || favouritesLoading;

  const onFinish = async (places: Place[]) => {
    await saveFavourites(places);
    await markOnboarded();
    router.replace('/');
  };

  // Same stale-navigation/deep-link guard as Welcome — see its comment.
  if (!loading && hasOnboarded && !alwaysShowStartPage) {
    return <Redirect href="/" />;
  }

  // Wait for existing favourites to load before rendering the picker, so
  // a re-shown onboarding (via "Always Show Start Page") starts from the
  // user's current picks instead of a flash of an empty list.
  if (loading) {
    return <SafeAreaView style={styles.wrapper}><SystemBars style="light" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <SystemBars style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('places.pickerTitle')}</Text>
      </View>
      <FavouritePlacesPicker initialSelected={favourites} finishLabel={t('welcome.getStarted')} onFinish={onFinish} theme="dark" />
    </SafeAreaView>
  );
}

export default OnboardingPlacesScreen;

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
