import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Text } from 'react-native-paper';
import { useRouter, Href } from 'expo-router';
import { isUndefined } from 'lodash';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import AlertCard from '@/components/AlertCard';
import AlertLegend from '@/components/AlertLegend';
import LastUpdatedFooter from '@/components/LastUpdatedFooter';
import StatusCard from '@/components/StatusCard';

import type { AppDispatch, RootState } from '@/lib/store';
import { SCREENS } from '@/lib/layout/constants';
import { CAPAlert, alertInLocation } from '@/lib/alerts/providers/cap-alerts/alert';
import { getAlerts } from '@/lib/store/alert.slice';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { colors, fonts, navRailWidth, radius, shadow, space } from '@/lib/theme';

const WarningsScreen = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const isXL = useBreakpoint() === 'xl';

  const { alerts, error: alertsError } = useSelector((state: RootState) => state.alerts, shallowEqual);
  const { name: location, lat, lon } = useSelector((state: RootState) => state.location, shallowEqual);
  const hasLocation = !isUndefined(lat) && !isUndefined(lon);

  let relevantAlerts: CAPAlert[] = [];
  if (lat && lon) {
    relevantAlerts = alerts.filter(alert => alertInLocation(alert, { latitude: lat, longitude: lon }));
  }

  return (
    <SafeAreaView style={[styles.wrapper, isXL && styles.xlPadding]}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t('Warnings')} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {!hasLocation ? (
              <StatusCard
                icon="map-marker-off-outline"
                title={t('location.notSet.title')}
                text={t('location.notSet.text')}
                actionLabel={t('location.notSet.action')}
                onRetry={() => router.push(SCREENS.Search.toString() as Href)}
              />
            ) : alertsError ? (
              <StatusCard
                icon="cloud-off-outline"
                iconColor={colors.danger}
                title={t('warnings.error.title')}
                text={alertsError}
                onRetry={() => dispatch(getAlerts())}
              />
            ) : relevantAlerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon source="shield-check" size={32} color={colors.success} />
                <Text style={styles.emptyTitle}>{t('warnings.empty.title')}</Text>
                <Text style={styles.emptyText}>{t('warnings.empty.text', { location })}</Text>
              </View>
            ) : null}

            {relevantAlerts.map((alert, idx) => (
              <View key={alert.identifier ?? idx} style={styles.cardWrapper}>
                <AlertCard alert={alert} />
              </View>
            ))}

            <AlertLegend />
            <LastUpdatedFooter />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WarningsScreen;

const styles = StyleSheet.create({
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
  content: {
    padding: space[4],
    paddingBottom: space[8],
  },
  cardWrapper: {
    marginBottom: space[4],
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space[6],
    marginBottom: space[4],
    ...shadow.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.textStrong,
    marginTop: space[3],
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: 'center',
    marginTop: space[1],
  },
  xlPadding: {
    paddingLeft: navRailWidth,
  },
});
