import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from "luxon";
import { ActivityIndicator } from 'react-native';
import { useRouter, Href, Redirect } from 'expo-router';
import { isUndefined } from 'lodash';
import { useTranslation } from 'react-i18next';

import AppBar from '@/components/AppBar';
import Today from '@/components/Today';
import Alerts from '@/components/Alerts';
import CurrentConditionsCard from '@/components/CurrentConditionsCard';
import DayPartsGrid from '@/components/DayPartsGrid';
import FiveDays from '@/components/FiveDays';
import LastUpdatedFooter from '@/components/LastUpdatedFooter';
import StatusCard from '@/components/StatusCard';

import { SCREENS } from '@/lib/layout/constants';
import { useLocationStore } from '@/lib/store/location.store';
import { useForecastQuery } from '@/lib/hooks/current-forecast.hook';
import { useAlertsQuery } from '@/lib/hooks/alerts.hook';
import { CAPAlert, alertInLocation } from '@/lib/alerts/providers/cap-alerts/alert';
import { useOnboarding } from '@/lib/hooks/onboarding.hook';
import { useOnboardingToggle } from '@/lib/hooks/use-onboarding-toggle';
import { useFavourites } from '@/lib/hooks/favourites.hook';
import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { getDayParts } from '@/lib/forecast/day-parts';
import { ThemeColors, Fonts, navRailWidth, Spacing, tempSize } from '@/lib/theme';
import { useTheme } from '@/lib/hooks/use-theme';

// Module-level, not component state — persists only for the lifetime of
// the JS process. Resets on a real app relaunch (cold start), but not
// when the user navigates away from and back to Home within the same
// session, which is what makes "always show start page" mean "once per
// launch" rather than "every time you land on Home."
let hasShownStartPageThisLaunch = false;

const MainScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [, hasOnboarded] = useOnboarding();
  const { alwaysShowOnboarding: alwaysShowStartPage } = useOnboardingToggle();
  const [favouritesLoading, favourites] = useFavourites();
  const breakpoint = useBreakpoint();
  const isXL = breakpoint === 'xl';

  const location = useLocationStore(s => s.name);
  const lat = useLocationStore(s => s.lat);
  const lon = useLocationStore(s => s.lon);
  const locationLoading = useLocationStore(s => s.loading);
  const locationError = useLocationStore(s => s.error);
  const getPreciseLocation = useLocationStore(s => s.getPreciseLocation);
  const resetLocationError = useLocationStore(s => s.resetError);
  const { data: forecast, isLoading: loading, error: forecastErrorObj, refetch: refetchForecast } = useForecastQuery(lat, lon);
  const forecastError = forecastErrorObj?.message;
  const { data: alerts = [], refetch: refetchAlerts } = useAlertsQuery();
  const [refreshing, setRefreshing] = React.useState(false);

  // Whether to force Welcome, decided ONCE per mount as real state rather
  // than re-derived every render from onboarding/alwaysShow — both resolve
  // synchronously from storage, but re-deriving "should show welcome" fresh
  // on every render would let a later, unrelated re-render (e.g. the
  // locationError-triggered one below) see a freshly-mutated
  // hasShownStartPageThisLaunch and flip the decision to false before the
  // Redirect ever actually took hold — silently cancelling it.
  //
  // Computed in the useState initializer itself, not a useEffect that runs
  // after mount: the underlying reads are already synchronous, so there's
  // no real async gap to wait out — deferring to an effect just meant this
  // component's first render returned null before a second render actually
  // carried the Redirect, and on a slow device that gap between "blank
  // landing shell paints" and "effect fires" was long enough to see.
  // Computing it here means the very first render already returns the
  // right thing.
  const [welcomeDecision] = React.useState<'show' | 'skip'>(() => {
    if (!hasOnboarded) {
      return 'show';
    }
    if (alwaysShowStartPage && !hasShownStartPageThisLaunch) {
      hasShownStartPageThisLaunch = true;
      return 'show';
    }
    return 'skip';
  });

  const onRefresh = async () => {
    if (isUndefined(lat) || isUndefined(lon)) {
      return;
    }

    setRefreshing(true);
    await Promise.all([refetchForecast(), refetchAlerts()]);
    setRefreshing(false);
  };

  const onTryAgain = () => {
    if (isUndefined(lat) || isUndefined(lon)) {
      return;
    }

    refetchForecast();
    refetchAlerts();
  }

  // Get GPS location after first(empty)render.
  useEffect(() => {
    if (isUndefined(lat) || isUndefined(lon)) {
      getPreciseLocation();
    }
  }, []);

  // If GPS/location resolution fails, send the user to their saved
  // favourite places instead of the generic city list, when they have any.
  // Waits until welcomeDecision has settled, and skips entirely when it's
  // 'show', so this can't race a forced Welcome redirect for the same
  // navigation.
  //
  // router.canGoBack() (expo-router's own history), not useNavigation() —
  // this screen sits inside the (tabs) navigator, so useNavigation() here
  // would resolve to the tabs navigator (nearest enclosing one), not the
  // root stack. The tabs navigator keeps its own visited-tab history
  // (default backBehavior: 'history'), so its canGoBack() answers "does
  // the tab bar remember a prior tab" rather than "did the user actually
  // navigate back to Home" — see the same fix in AppBar.tsx.
  useEffect(() => {
    if (welcomeDecision !== 'skip') return;
    if (locationError && !router.canGoBack() && !favouritesLoading) {
      resetLocationError();
      router.replace((favourites.length > 0 ? '/Places' : SCREENS.NoLocation.toString()) as Href);
    }
  }, [locationError, favouritesLoading, favourites, welcomeDecision]);

  if (welcomeDecision === 'show') {
    return <Redirect href="/Welcome" />;
  }

  const today = DateTime.now();
  const onSelectDay = (day: DateTime) =>
    router.push({
      pathname: "/Hourly", params: {
        location: location,
        dayString: day.toISO(),
        startAtCurrentTime: "no",
        title: day.toLocaleString({ weekday: 'long' })
      }
    });

  const onSelectAlert = (alert: CAPAlert) =>
    router.push({
      pathname: "/WeatherWarning", params: { location, alertID: alert.identifier }
    });

  let relevantAlerts: CAPAlert[] = [];
  if (lat && lon) {
    relevantAlerts = alerts.filter(alert => alertInLocation(alert, { latitude: lat, longitude: lon }));
  }

  // empty page as default content
  let mainContent: React.JSX.Element = (
    <View style={styles.opacity}>
    </View>
  )

  if (loading || locationLoading) {
    mainContent = (
      <View style={styles.opacity}>
        <TouchableOpacity onPress={() => { }}>
          <View style={styles.loader}>
            <ActivityIndicator animating={true} color={colors.primary} size='large' />
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  // Reachable whenever this screen renders with no coordinates and nothing
  // in flight — e.g. GPS was denied and the user tab-navigated here
  // directly instead of picking a place on NoLocation/Places.
  if (!loading && !locationLoading && (isUndefined(lat) || isUndefined(lon))) {
    mainContent = (
      <StatusCard
        icon="map-marker-off-outline"
        title={t('location.notSet.title')}
        text={t('location.notSet.text')}
        actionLabel={t('location.notSet.action')}
        onRetry={() => router.push(SCREENS.Search.toString() as Href)}
      />
    )
  }

  if (forecast) {
    const todaySummary = forecast.days.find(d => DateTime.fromISO(d.day).hasSame(today, "day"));

    if (isXL && todaySummary) {
      mainContent = (
        <View style={styles.xlRow}>
          <View style={styles.xlLeftPane}>
            <Alerts lat={lat} lon={lon} location={location} />
            <CurrentConditionsCard daySummary={todaySummary} location={location} tempFontSize={tempSize.xl} showWindSummary />
          </View>
          <View style={styles.xlRightPane}>
            <DayPartsGrid dayParts={getDayParts(todaySummary)} columns={4} />
            <View style={styles.xlFiveDaysSection}>
              <Text style={styles.xlSectionHeader}>{t('Next 5 days')}</Text>
              <FiveDays name={location} startDate={today.plus({ days: 1 })} forecast={forecast} onClick={onSelectDay} alerts={relevantAlerts} onSelectAlert={onSelectAlert} />
            </View>
          </View>
        </View>
      )
    } else {
      mainContent = (
        <View style={styles.opacity}>
          <Today daySummary={todaySummary} location={location} tempFontSize={tempSize[breakpoint]} compact={breakpoint === 'small'} />
        </View>
      )
    }
  }

  if (forecastError) {
    mainContent = (
      <StatusCard
        icon="cloud-off-outline"
        iconColor={colors.danger}
        title={t('forecast.error.title')}
        text={forecastError}
        onRetry={onTryAgain}
      />
    )
  }

  // On phones the custom bottom tab bar (components/AppTabBar.tsx) already
  // reserves its own flex space below this screen and pads itself by
  // insets.bottom — this screen never actually reaches the device's true
  // bottom edge, so SafeAreaView's default bottom inset here just adds a
  // second, redundant chunk of empty padding, shrinking the usable content
  // area for no reason. At the XL breakpoint the tab bar becomes a
  // left-side rail (position: absolute) that doesn't reserve flex space,
  // so the screen DOES extend to the true bottom edge there and needs the
  // normal bottom inset.
  return (
    <SafeAreaView style={[styles.wrapper, isXL && styles.xlPadding]} edges={isXL ? undefined : ['top', 'right', 'left']}>
      <View style={styles.wrapper}>
        <View style={styles.bg}>
          <AppBar location={location} isPlace />
          {!isXL &&
            <View style={styles.alertsWrapper}>
              <Alerts lat={lat} lon={lon} location={location} />
            </View>
          }
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} snapToStart={false} accessible={true} accessibilityLabel='Landing page' refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }>
            <View style={styles.contentWrapper}>
              {mainContent}
              <LastUpdatedFooter />
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default MainScreen;

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    margin: 0,
    padding: 0,
    backgroundColor: colors.bgAlt,
  },
  bg: {
    flex: 1,
    backgroundColor: colors.bgAlt,
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    marginRight: Spacing.lg,
    marginLeft: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxxl,
  },
  alertsWrapper: {
    marginRight: Spacing.lg,
    marginLeft: Spacing.lg,
    marginTop: Spacing.lg,
  },
  opacity: {},
  loader: {
    marginTop: Spacing.xxxl,
    marginBottom: Spacing.xxxl,
  },
  xlRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xl,
  },
  xlLeftPane: {
    flex: 1,
  },
  xlRightPane: {
    flex: 1.3,
  },
  xlFiveDaysSection: {
    marginTop: Spacing.xl,
  },
  xlSectionHeader: {
    fontSize: 20,
    fontFamily: Fonts.sans.bold,
    color: colors.textStrong,
    marginBottom: Spacing.sm,
  },
  xlPadding: {
    paddingLeft: navRailWidth,
  },
});
