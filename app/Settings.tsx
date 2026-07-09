import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Dropdown from 'react-native-input-select';
import { useTranslation } from 'react-i18next';

import Alerts from '@/components/Alerts';
import AppBar from '@/components/AppBar';
import { RootState } from '@/lib/store';
import { LANGUAGES } from '@/lib/localization/translations';
import { colors, fonts, radius, space } from '@/lib/theme';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();

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
            <View style={styles.opacity}>
              <View style={styles.content}>
                <Text variant="bodyMedium">
                  <Text style={styles.title}>
                    {t('Language')}
                  </Text>
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
  },
  opacity: {
    flexDirection: 'column',
    flex: 1,
  },
  dropdownStyle: {
    flexDirection: 'column',
    flex: 1,
    verticalAlign: 'middle',
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  whiteHeader: {
    color: colors.textStrong,
    fontSize: 20,
    fontFamily: fonts.semiBold,
  },
  whiteText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  title: {
    color: colors.textStrong,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.semiBold,
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
  content: {
    marginTop: space[6],
    marginLeft: space[8],
    marginRight: 58,
  },
});