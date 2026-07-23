import React, { JSX, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import AlertCard from '@/components/AlertCard';

import { RootState } from '@/lib/store';
import { ThemeColors, fonts, space } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';
import AlertLegend from '@/components/AlertLegend';

function WeatherWarningScreen(): JSX.Element {
  const { t } = useTranslation();
  const { location, alertID } = useLocalSearchParams<{ location: string, alertID: string }>()
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { alerts } = useSelector((state: RootState) => state.alerts);
  const alert = alerts.find(alert => alert.identifier === alertID)

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={location} />
          {alert ? (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <AlertCard alert={alert} />
              <View style={{ marginBottom: 14 }}></View>
              <AlertLegend />
            </ScrollView>
          ) : (
            <View style={styles.contentContainer}>
              <Text style={styles.whiteText}>{t('alert.missing')}</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: colors.bgAlt,
  },
  bg: {
    height: '100%',
    backgroundColor: colors.bgAlt,
  },
  contentContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
    margin: 0,
    padding: space[4],
  },
  scrollView: {
    height: '100%',
    width: '100%',
  },
  content: {
    padding: space[4],
    paddingBottom: space[8],
  },
  whiteText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.regular,
  },
});

export default WeatherWarningScreen;
