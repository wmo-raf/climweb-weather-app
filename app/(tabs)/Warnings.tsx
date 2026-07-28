import React, { useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter, Href } from 'expo-router';
import { isUndefined } from 'lodash';

import AppBar from '@/components/AppBar';
import AlertCard from '@/components/AlertCard';
import AlertLegend from '@/components/AlertLegend';
import LastUpdatedFooter from '@/components/LastUpdatedFooter';
import StatusCard from '@/components/StatusCard';

import { useLocationStore } from '@/lib/store/location.store';
import { useAlertsQuery } from '@/lib/hooks/alerts.hook';
import { CAPAlert, alertInLocation } from '@/lib/alerts/providers/cap-alerts/alert';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { ThemeColors, fonts, navRailWidth, radius, shadow, space } from '@/lib/theme';
import { useThemeColors } from '@/lib/theme/ThemeContext';

// Unlike the small Alerts banner (shown on Today/5 Days/etc., which stays
// location-sensitive), this tab is the canonical list of every valid
// alert the configured feed currently has — no location filtering. It's
// grouped into "Your area" vs "Elsewhere in the country" (when a location
// is set) so a long nationwide list doesn't bury what's actually relevant
// to the user behind everything else.
const WarningsScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isXL = useBreakpoint() === 'xl';

  const { data: alerts = [], error: alertsErrorObj, refetch: refetchAlerts } = useAlertsQuery();
  const alertsError = alertsErrorObj?.message;
  const location = useLocationStore(s => s.name);
  const lat = useLocationStore(s => s.lat);
  const lon = useLocationStore(s => s.lon);
  const hasLocation = !isUndefined(lat) && !isUndefined(lon);

  const yourAreaAlerts = hasLocation ? alerts.filter(alert => alertInLocation(alert, { latitude: lat, longitude: lon })) : [];
  const elsewhereAlerts = hasLocation ? alerts.filter(alert => !alertInLocation(alert, { latitude: lat, longitude: lon })) : alerts;

  const onSelectAlert = (alert: CAPAlert) =>
    router.push({ pathname: '/WeatherWarning', params: { location, alertID: alert.identifier } } as Href);

  return (
    <SafeAreaView style={[styles.wrapper, isXL && styles.xlPadding]}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={t('Warnings')} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {alertsError ? (
              <StatusCard
                icon="cloud-off-outline"
                iconColor={colors.danger}
                title={t('warnings.error.title')}
                text={alertsError}
                onRetry={() => refetchAlerts()}
              />
            ) : alerts.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon source="shield-check" size={32} color={colors.success} />
                <Text style={styles.emptyTitle}>{t('warnings.empty.title')}</Text>
                <Text style={styles.emptyText}>{t('warnings.empty.text')}</Text>
              </View>
            ) : null}

            {hasLocation ? (
              <>
                {yourAreaAlerts.length > 0 && (
                  <View style={styles.group}>
                    <Text style={styles.groupHeader}>{t('warnings.group.yourArea')}</Text>
                    {yourAreaAlerts.map((alert, idx) => (
                      <View key={alert.identifier ?? idx} style={styles.cardWrapper}>
                        <AlertCard alert={alert} compact onPress={() => onSelectAlert(alert)} />
                      </View>
                    ))}
                  </View>
                )}
                {elsewhereAlerts.length > 0 && (
                  <View style={styles.group}>
                    <Text style={styles.groupHeader}>{t('warnings.group.elsewhere')}</Text>
                    {elsewhereAlerts.map((alert, idx) => (
                      <View key={alert.identifier ?? idx} style={styles.cardWrapper}>
                        <AlertCard alert={alert} compact onPress={() => onSelectAlert(alert)} />
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              alerts.map((alert, idx) => (
                <View key={alert.identifier ?? idx} style={styles.cardWrapper}>
                  <AlertCard alert={alert} compact onPress={() => onSelectAlert(alert)} />
                </View>
              ))
            )}

            <AlertLegend />
            <LastUpdatedFooter />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WarningsScreen;

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
  content: {
    padding: space[4],
    paddingBottom: space[8],
  },
  cardWrapper: {
    marginBottom: space[4],
  },
  group: {
    marginBottom: space[2],
  },
  groupHeader: {
    fontSize: 14,
    fontFamily: fonts.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textSubtle,
    marginBottom: space[3],
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
