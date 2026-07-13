import React, { JSX, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';
import { Icon, Text } from 'react-native-paper';
import { useRouter, Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';

import { LANGUAGES, LanguageKey } from '@/lib/localization/translations';
import { SCREENS } from '@/lib/layout/constants';
import { colors, fonts, radius, space, touchTarget } from '@/lib/theme';

const appName = Constants.expoConfig?.name ?? 'Weather App';

function WelcomeScreen(): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [selectedLang, setSelectedLang] = useState<LanguageKey>((i18n.language as LanguageKey) ?? 'en');

  const onSelectLanguage = (lang: LanguageKey) => {
    setSelectedLang(lang);
    i18n.changeLanguage(lang);
  };

  // Language is chosen here; favourite places are chosen on the next
  // onboarding step (OnboardingPlaces), which is the one that actually
  // marks onboarding complete.
  const onNext = () => {
    router.push(SCREENS.OnboardingPlaces.toString() as Href);
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      {/* Dark navy background needs light status/nav bar icons, overriding
          the app-wide "dark" default pushed in the root layout. */}
      <SystemBars style="light" />
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Icon source="weather-partly-cloudy" size={44} color={colors.bgOverlay} />
        </View>
        <Text style={styles.title}>{appName}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.languagePrompt}>Choose your language · Chagua lugha yako</Text>
        <View style={styles.languageRow}>
          {(Object.keys(LANGUAGES) as LanguageKey[]).map(key => {
            const selected = selectedLang === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.languageButton, selected && styles.languageButtonSelected]}
                onPress={() => onSelectLanguage(key)}
                accessibilityLabel={LANGUAGES[key].label}
                accessibilityState={{ selected }}
              >
                {selected && <Icon source="check-circle" size={18} color={colors.primary} />}
                <Text style={[styles.languageButtonText, selected && styles.languageButtonTextSelected]}>
                  {LANGUAGES[key].label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.getStartedButton} onPress={onNext} accessibilityLabel={t('welcome.next')}>
          <Text style={styles.getStartedText}>{t('welcome.next')}</Text>
          <Icon source="arrow-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default WelcomeScreen;

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
    paddingHorizontal: space[8],
  },
  iconBadge: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[6],
  },
  title: {
    fontSize: 32,
    fontFamily: fonts.extraBold,
    color: colors.textInverse,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textInverse,
    textAlign: 'center',
    marginTop: space[3],
  },
  footer: {
    padding: space[6],
  },
  languagePrompt: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: space[3],
  },
  languageRow: {
    flexDirection: 'row',
    gap: space[3],
    marginBottom: space[4],
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    minHeight: touchTarget.nav,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.textInverse,
    backgroundColor: 'transparent',
  },
  languageButtonSelected: {
    backgroundColor: colors.bg,
    borderColor: colors.bg,
  },
  languageButtonText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textInverse,
  },
  languageButtonTextSelected: {
    color: colors.primary,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    minHeight: touchTarget.nav,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
  },
  getStartedText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.primary,
  },
});
