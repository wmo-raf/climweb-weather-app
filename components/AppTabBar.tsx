import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBreakpoint } from '@/lib/hooks/breakpoint.hook';
import { colors, fonts, navRailWidth, radius, space, touchTarget } from '@/lib/theme';

// Loosely typed on purpose: this is assigned the real BottomTabBarProps at
// the call site (app/(tabs)/_layout.tsx), whose exact shape isn't reliably
// importable across expo-router versions. Only state/navigation fields are
// read, both structurally compatible with the real prop at runtime.
type TabBarProps = {
  state: any;
  navigation: any;
};

const ICONS: Record<string, string> = {
  index: 'weather-sunny',
  FiveDays: 'calendar-month',
  Warnings: 'alert',
  Places: 'map-marker-multiple',
};

const LABEL_KEYS: Record<string, string> = {
  index: 'Today',
  FiveDays: '5 days',
  Warnings: 'Alerts',
  Places: 'Places',
};

// Renders as a bottom bar on phones and a left nav rail at the XL
// breakpoint (>=600dp), per the responsive viewport guide (Step 8). The
// rail is absolutely positioned over the left edge — screens are
// responsible for adding paddingLeft: navRailWidth at the XL breakpoint so
// content doesn't render underneath it (see useBreakpoint() call sites).
function AppTabBar({ state, navigation }: TabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const breakpoint = useBreakpoint();
  const isRail = breakpoint === 'xl';

  const items = state.routes.map((route: { key: string; name: string }, index: number) => {
    const focused = state.index === index;
    const label = t(LABEL_KEYS[route.name] ?? route.name);

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : {}}
        accessibilityLabel={label}
        style={[styles.item, isRail && styles.itemRail, focused && styles.itemFocused]}
      >
        <Icon source={ICONS[route.name] ?? 'circle'} size={22} color={focused ? colors.primary : colors.textSubtle} />
        <Text style={[styles.label, { color: focused ? colors.primary : colors.textSubtle }]} numberOfLines={1}>{label}</Text>
      </TouchableOpacity>
    );
  });

  if (isRail) {
    return (
      <View style={[styles.rail, { paddingTop: insets.top + space[4] }]}>
        <View style={styles.railBadge}>
          <Icon source="weather-partly-cloudy" size={26} color={colors.textInverse} />
        </View>
        {items}
      </View>
    );
  }

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom, height: 56 + insets.bottom }]}>
      {items}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: space[1],
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: navRailWidth,
    backgroundColor: colors.bg,
    borderRightColor: colors.border,
    borderRightWidth: 1,
    alignItems: 'center',
    zIndex: 10,
  },
  railBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[6],
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[2],
    paddingHorizontal: space[1],
    marginHorizontal: space[1],
    borderRadius: radius.lg,
    minHeight: touchTarget.nav,
  },
  itemRail: {
    flex: 0,
    width: 72,
    borderRadius: radius.lg,
    marginBottom: space[3],
  },
  itemFocused: {
    backgroundColor: colors.bgTint,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    marginTop: 2,
  },
});

export default AppTabBar;
