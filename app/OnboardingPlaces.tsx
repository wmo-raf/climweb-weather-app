import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import FavouritePlacesPicker from '@/components/FavouritePlacesPicker';
import { useOnboarding } from '@/lib/hooks/onboarding.hook';
import { useFavourites } from '@/lib/hooks/favourites.hook';
import { Place } from '@/lib/geo/places';
import { colors, fonts, space } from '@/lib/theme';

// Second and final onboarding step, reached from Welcome's language
// screen. Selecting places is optional — finishing with none selected
// is how a user skips this step.
function OnboardingPlacesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [, , markOnboarded] = useOnboarding();
  const [, , saveFavourites] = useFavourites();

  const onFinish = async (places: Place[]) => {
    await saveFavourites(places);
    await markOnboarded();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <SystemBars style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('places.pickerTitle')}</Text>
      </View>
      <FavouritePlacesPicker finishLabel={t('welcome.getStarted')} onFinish={onFinish} theme="dark" />
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
