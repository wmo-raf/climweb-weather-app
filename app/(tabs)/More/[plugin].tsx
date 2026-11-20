import React from 'react';
import { Redirect, useLocalSearchParams, Href } from 'expo-router';

import { findEnabledPlugin } from '@/plugins/registry';
import { SCREENS } from '@/lib/layout/constants';

// A More tab plugin's page, at /More/<id> (see plugins/). A plugin that
// isn't enabled for this deployment, or doesn't exist, redirects to More
// conditions, so stale and deep links can't open it.
export default function PluginScreen() {
  const { plugin: id } = useLocalSearchParams<{ plugin: string }>();
  const plugin = findEnabledPlugin(id);

  if (!plugin) {
    return <Redirect href={SCREENS.More as Href} />;
  }

  const Screen = plugin.Screen;
  return <Screen />;
}
