import React, { JSX, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import AlertCard from '@/components/AlertCard';

import { useAlertsQuery } from '@/lib/hooks/alerts.hook';
import { ThemeColors, Fonts, Spacing } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';
import AlertLegend from '@/components/AlertLegend';

function WeatherWarningScreen(): JSX.Element {
  const { t } = useTranslation();
  const { location, alertID } = useLocalSearchParams<{ location: string, alertID: string }>()
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { data: alerts = [], refetch } = useAlertsQuery();
  const alert = alerts.find(alert => alert.identifier === alertID);

  // A notification can deep-link here for an alert that arrived after the
  // cached feed was last polled — the CAP RSS feed only reveals an item's
  // identifier once its own XML is fetched and parsed (see
  // lib/alerts/providers/cap-alerts/collector.ts), so an identifier the
  // cache doesn't recognize isn't necessarily invalid, just not fetched
  // yet. Force one fresh fetch of the alerts feed before concluding it's
  // genuinely missing.
  const [checkedFreshFeed, setCheckedFreshFeed] = useState(false);
  useEffect(() => {
    if (alert || checkedFreshFeed || !alertID) {
      return;
    }
    refetch().finally(() => setCheckedFreshFeed(true));
  }, [alert, alertID, checkedFreshFeed, refetch]);

  const isResolving = !alert && !checkedFreshFeed;

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
          ) : isResolving ? (
            <View style={styles.contentContainer}>
              <ActivityIndicator animating color={colors.primary} size="large" />
            </View>
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
    padding: Spacing.lg,
  },
  scrollView: {
    height: '100%',
    width: '100%',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  whiteText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: Fonts.sans.regular,
  },
});

export default WeatherWarningScreen;
