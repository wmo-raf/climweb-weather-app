import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Dropdown from 'react-native-input-select';
import { useTranslation } from 'react-i18next';
import { useRouter, Href } from 'expo-router';

import Alerts from '@/components/Alerts';
import AppBar from '@/components/AppBar';
import { RootState } from '@/lib/store';
import { LANGUAGES } from '@/lib/localization/translations';
import { SCREENS } from '@/lib/layout/constants';
import { colors, fonts, radius, shadow, space, touchTarget } from '@/lib/theme';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const options = Object.entries(LANGUAGES).map(([key, { label }]) => ({
    label,
    value: key,
  }));

  const handleChangeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  const [, setLanguage] = useState<string>();
  const { name, lat, lon } = useSelector((state: RootState) => state.location);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t('Settings')} />
          <Alerts lat={lat} lon={lon} location={name} />
          <View style={styles.container}>
            <View style={styles.card}>
              <Text style={styles.title}>
                {t('Language')}
              </Text>
              <Dropdown
                label={t('Language')}
                placeholder={t('select.language.placeholder')}
                options={options}
                selectedValue={i18n.language}
                onValueChange={value => handleChangeLanguage(value as string)}
                primaryColor={colors.primary}
                dropdownStyle={styles.dropdownStyle}
                placeholderStyle={{ color: colors.textMuted }}
                selectedItemStyle={{ color: colors.text }}
              />
            </View>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.row}
                accessibilityLabel={t('About us')}
                onPress={() => router.push(SCREENS.AboutUs.toString() as Href)}
              >
                <Text style={styles.rowText}>{t('About us')}</Text>
                <Icon source="chevron-right" size={22} color={colors.textSubtle} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.row}
                accessibilityLabel={t('About the app')}
                onPress={() => router.push(SCREENS.AboutTheApp.toString() as Href)}
              >
                <Text style={styles.rowText}>{t('About the app')}</Text>
                <Icon source="chevron-right" size={22} color={colors.textSubtle} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
    padding: space[4],
  },
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space[4],
    marginBottom: space[4],
    ...shadow.sm,
  },
  dropdownStyle: {
    flexDirection: 'column',
    flex: 1,
    verticalAlign: 'middle',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.semiBold,
    marginBottom: space[2],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: touchTarget.nav,
  },
  rowText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  wrapper: {
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    margin: 0,
    padding: 0,
    overflow: 'scroll',
    backgroundColor: colors.bgAlt,
  },
  bg: {
    height: '100%',
    backgroundColor: colors.bgAlt,
  },
});
