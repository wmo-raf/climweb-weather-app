import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import FavouritePlacesPicker from '@/components/FavouritePlacesPicker';
import { useFavourites } from '@/lib/hooks/favourites.hook';
import { Place } from '@/lib/geo/places';
import { colors } from '@/lib/theme';

// Reached from the Places tab (empty state or edit action) to add/remove
// favourites after onboarding — same picker as OnboardingPlaces, but the
// finish button just saves and returns instead of completing onboarding.
function EditFavouritesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, favourites, saveFavourites] = useFavourites();

  const onFinish = async (places: Place[]) => {
    await saveFavourites(places);
    router.back();
  };

  if (loading) {
    return <SafeAreaView style={styles.wrapper} />;
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <AppBar location={t('places.pickerTitle')} />
        <FavouritePlacesPicker initialSelected={favourites} finishLabel={t('places.finish')} onFinish={onFinish} />
      </View>
    </SafeAreaView>
  );
}

export default EditFavouritesScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bgAlt,
  },
});
