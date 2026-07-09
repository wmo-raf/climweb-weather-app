import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Icon, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, space, touchTarget } from '@/lib/theme';

type TabIconProps = {
  name: string;
  focused: boolean;
  label: string;
};

function TabIcon({ name, focused, label }: TabIconProps) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Icon source={name} size={22} color={focused ? colors.primary : colors.textSubtle} />
      <Text style={[styles.tabLabel, { color: focused ? colors.primary : colors.textSubtle }]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: space[1],
        },
        tabBarItemStyle: { minHeight: touchTarget.nav },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="weather-sunny" focused={focused} label={t('Today')} />,
          tabBarAccessibilityLabel: t('Today'),
        }}
      />
      <Tabs.Screen
        name="FiveDays"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="calendar-month" focused={focused} label={t('5 days')} />,
          tabBarAccessibilityLabel: t('5 days'),
        }}
      />
      <Tabs.Screen
        name="Warnings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="alert" focused={focused} label={t('Warnings')} />,
          tabBarAccessibilityLabel: t('Warnings'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[2],
    paddingHorizontal: space[4],
    borderRadius: radius.lg,
    minWidth: 72,
    minHeight: touchTarget.nav,
  },
  tabItemFocused: {
    backgroundColor: colors.bgTint,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: fonts.semiBold,
    marginTop: 2,
  },
});
