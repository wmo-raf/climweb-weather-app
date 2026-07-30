import { Buffer } from 'buffer';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persistOptions } from '@/lib/query/client';
import { MD3LightTheme, MD3DarkTheme, PaperProvider, configureFonts } from 'react-native-paper';
import {
  useFonts,
  OpenSans_400Regular,
  OpenSans_500Medium,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
  OpenSans_800ExtraBold,
} from '@expo-google-fonts/open-sans';

import '../lib/localization/i18n';
import { AutocompleteDropdownContextProvider } from "@/lib/autocomplete";
import { fonts } from '@/lib/theme';
import { ThemeProvider, useAppTheme } from '@/lib/theme/ThemeContext';

global.Buffer = global.Buffer || Buffer;

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 2000,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { colors, scheme } = useAppTheme();

  const theme = {
    ...(scheme === 'dark' ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(scheme === 'dark' ? MD3DarkTheme.colors : MD3LightTheme.colors),
      primary: colors.primary,
      secondary: colors.accent,
      error: colors.danger,
      background: colors.bg,
      surface: colors.bg,
      onSurface: colors.text,
    },
    fonts: configureFonts({ config: { fontFamily: fonts.regular } }),
  };

  return (
    <PaperProvider theme={theme}>
      <AutocompleteDropdownContextProvider>
        {/* Default follows the resolved theme; Welcome/OnboardingPlaces (dark
            background regardless of theme) push their own "light" override
            while mounted. */}
        <SystemBars style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{
          // Hide the default expo header
          headerShown: false,
        }} />
      </AutocompleteDropdownContextProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_500Medium,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    OpenSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  SplashScreen.hideAsync();

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
