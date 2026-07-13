import React from 'react';
import { Tabs } from 'expo-router';

import AppTabBar from '@/components/AppTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="FiveDays" />
      <Tabs.Screen name="Places" />
      <Tabs.Screen name="Warnings" />
    </Tabs>
  );
}
