import React, { JSX, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';
import { Icon, Text } from 'react-native-paper';
import { useRouter, Redirect, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useOnboarding } from '@/lib/hooks/onboarding.hook';
import { useOnboardingToggle } from '@/lib/hooks/use-onboarding-toggle';
import { usePushStore } from '@/lib/store/push.store';
import { SCREENS } from '@/lib/layout/constants';
// Fixed to the light palette — same reasoning as Welcome/OnboardingPlaces:
// this screen's dark-navy hero doesn't retint with the app's dark-mode
// setting.
import { Fonts, Colors, Radius, Spacing, touchTarget } from '@/lib/theme';

const colors = Colors.light;
// Third onboarding step, reached from OnboardingPlaces. "Not Now" marks
// onboarding complete immediately, same as before. Enabling notifications
// instead moves on to OnboardingAlertAreas (which is the step that actually
// marks onboarding complete) so the user can pick which areas they want
// warnings for — skipped entirely if permission is denied, since there'd be
// nothing to notify them with.
function OnboardingNotificationsScreen(): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const [onboardingLoading, hasOnboarded, markOnboarded] = useOnboarding();
  const { alwaysShowOnboarding: alwaysShowStartPage } = useOnboardingToggle();
  const setNotificationsEnabled = usePushStore(s => s.setNotificationsEnabled);
  const [requesting, setRequesting] = useState(false);

  const finish = async () => {
    await markOnboarded();
    router.replace('/');
  };

  const onEnable = async () => {
    setRequesting(true);
    // Requests the notification permission — never throws, denial just sets
    // the store's own error state.
    await setNotificationsEnabled(true);
    if (usePushStore.getState().notificationsEnabled) {
      router.replace(SCREENS.OnboardingAlertAreas.toString() as Href);
    } else {
      await finish();
    }
  };

  // Guards against reaching this screen once onboarding is already done —
  // same stale-navigation/deep-link case as Welcome/OnboardingPlaces.
  if (!onboardingLoading && hasOnboarded && !alwaysShowStartPage) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <SystemBars style="light" />
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Icon source="bell-ring-outline" size={44} color={colors.bgOverlay} />
        </View>
        <Text style={styles.title}>{t('onboarding.notifications.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.notifications.description')}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.enableButton}
          onPress={onEnable}
          disabled={requesting}
          accessibilityLabel={t('onboarding.notifications.enable')}
        >
          <Text style={styles.enableText}>{t('onboarding.notifications.enable')}</Text>
          <Icon source="arrow-right" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={finish}
          disabled={requesting}
          accessibilityLabel={t('onboarding.notifications.skip')}
        >
          <Text style={styles.skipText}>{t('onboarding.notifications.skip')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default OnboardingNotificationsScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bgOverlay,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: Radius.extraLarge,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.sans.bold,
    color: colors.textInverse,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
    color: colors.textInverse,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  footer: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  enableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    minHeight: touchTarget.nav,
    borderRadius: Radius.large,
    backgroundColor: colors.bg,
  },
  enableText: {
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.primary,
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget.nav,
  },
  skipText: {
    fontSize: 16,
    fontFamily: Fonts.sans.bold,
    color: colors.textInverse,
  },
});
