import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import FavouritePlacesPicker from '@/components/FavouritePlacesPicker';
import { useAlertAreas, MAX_ALERT_AREAS } from '@/lib/hooks/alert-areas.hook';
import { usePushStore } from '@/lib/store/push.store';
import { Place } from '@/lib/geo/places';
import { ThemeColors } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';

// Reached from Settings ("Manage alert areas") to add/remove which places
// the user wants severe weather warnings for after onboarding — same picker
// as OnboardingAlertAreas, but the finish button just saves and returns
// instead of completing onboarding. Re-registers with the backend
// immediately so a change takes effect without waiting for the next
// app-open/foreground sync.
function EditAlertAreasScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loading, areas, saveAreas] = useAlertAreas();

  const onFinish = async (places: Place[]) => {
    await saveAreas(places);
    await usePushStore.getState().syncRegistration();
    router.back();
  };

  if (loading) {
    return <SafeAreaView style={styles.wrapper} />;
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <AppBar location={t('notifications.areas.title')} />
        <FavouritePlacesPicker
          initialSelected={areas}
          finishLabel={t('places.finish')}
          onFinish={onFinish}
          max={MAX_ALERT_AREAS}
          subtitleKey="notifications.areas.subtitle"
          maxReachedKey="notifications.areas.maxReached"
        />
      </View>
    </SafeAreaView>
  );
}

export default EditAlertAreasScreen;

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bgAlt,
  },
});
