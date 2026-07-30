import React, { JSX, useMemo } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import Alerts from '@/components/Alerts';
import { useLocationStore } from '@/lib/store/location.store';
import { ThemeColors, fonts, space } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';

function PrivacyPolicyScreen(): JSX.Element {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const lat = useLocationStore(s => s.lat);
  const lon = useLocationStore(s => s.lon);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t('Privacy Policy')} />
          <Alerts lat={lat} lon={lon} location={t('Privacy Policy')} />
          <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <Text style={styles.whiteText}>{t('privacy.intro')}</Text>

            <Text style={styles.whiteHeader}>{t('privacy.dataCollected.title')}</Text>
            <Text style={styles.whiteText}>{t('privacy.dataCollected.text')}</Text>

            <Text style={styles.whiteHeader}>{t('privacy.location.title')}</Text>
            <Text style={styles.whiteText}>{t('privacy.location.text')}</Text>

            <Text style={styles.whiteHeader}>{t('privacy.favourites.title')}</Text>
            <Text style={styles.whiteText}>{t('privacy.favourites.text')}</Text>

            <Text style={styles.whiteHeader}>{t('privacy.security.title')}</Text>
            <Text style={styles.whiteText}>{t('privacy.security.text')}</Text>

            <Text style={styles.whiteHeader}>{t('privacy.children.title')}</Text>
            <Text style={styles.whiteText}>{t('privacy.children.text')}</Text>

            <Text style={styles.whiteHeader}>{t('privacy.thirdParty.title')}</Text>
            <Text style={styles.whiteText}>{t('privacy.thirdParty.text')}</Text>

            <Text style={styles.whiteHeader}>{t('privacy.changes.title')}</Text>
            <Text style={styles.whiteText}>{t('privacy.changes.text')}</Text>

            <Text style={styles.whiteHeader}>{t('privacy.contact.title')}</Text>
            <Text style={styles.whiteText}>{t('privacy.contact.text')}</Text>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default PrivacyPolicyScreen;

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space[6],
    paddingTop: space[6],
    paddingBottom: space[10],
  },
  whiteHeader: {
    color: colors.textStrong,
    fontSize: 18,
    fontFamily: fonts.bold,
    marginTop: space[6],
    marginBottom: space[2],
  },
  whiteText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
});
