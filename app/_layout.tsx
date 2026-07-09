import { Buffer } from 'buffer';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from "expo-router";
import { store } from '@/lib/store';
import { Provider as StoreProvider } from 'react-redux';
import { MD3LightTheme as DefaultTheme, PaperProvider, configureFonts } from 'react-native-paper';
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
import { colors, fonts } from '@/lib/theme';

global.Buffer = global.Buffer || Buffer;

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    secondary: colors.accent,
    error: colors.danger,
    background: colors.bg,
    surface: colors.bg,
    onSurface: colors.text,
  },
  fonts: configureFonts({ config: { fontFamily: fonts.regular } }),
};

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 2000,
  fade: true,
});

SplashScreen.preventAutoHideAsync();

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
    <StoreProvider store={store}>
      <PaperProvider theme={theme}>
        <AutocompleteDropdownContextProvider>
          <Stack screenOptions={{
            // Hide the default expo header
            headerShown: false,
          }} />
        </AutocompleteDropdownContextProvider>
      </PaperProvider>
    </StoreProvider>
  );
}
