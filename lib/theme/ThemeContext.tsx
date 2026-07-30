import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { storage } from '@/lib/storage';
import { darkColors, lightColors, ThemeColors } from './index';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

const THEME_MODE_KEY = 'settings.themeMode';

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: ResolvedScheme;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeMode(value: string | undefined): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = storage.getString(THEME_MODE_KEY);
    return isThemeMode(stored) ? stored : 'system';
  });

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    storage.set(THEME_MODE_KEY, next);
  };

  const scheme: ResolvedScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const colors = scheme === 'dark' ? darkColors : lightColors;

  const value = useMemo(() => ({ mode, scheme, colors, setMode }), [mode, scheme, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider');
  return ctx;
}

export function useThemeColors(): ThemeColors {
  return useAppTheme().colors;
}
