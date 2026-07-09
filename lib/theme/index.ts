import { Platform } from 'react-native';

// Design tokens mirrored from docs/STYLE.md — do not invent new colors, always pull from here.
export const colors = {
  primary: '#0C447C',
  primaryHov: '#176C9C',
  primaryPrs: '#093766',
  accent: '#226296',
  info: '#3E8ED0',
  bgTint: '#E6F1FB',
  bgTintLight: '#EAF2F9',
  bgOverlay: '#0A2240',
  bgFooter: '#0C447C',

  bg: '#FFFFFF',
  bgAlt: '#F8F9FB',
  bgHover: '#F4F6F9',
  bgMuted: '#E0E0E0',
  border: '#DCDCDC',

  text: '#363636',
  textStrong: '#1A1A1A',
  textSubtle: '#707070',
  textMuted: '#999999',
  textInverse: '#FFFFFF',
  focus: '#176C9C',

  success: '#0B612D',
  successBg: '#D1FAE5',
  warning: '#92400E',
  warningBg: '#FEF3C7',
  danger: '#B91C1C',
  dangerBg: '#FEE2E2',
  infoText: '#1E40AF',
  infoBg: '#DBEAFE',
} as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 } as const;

export const radius = { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 } as const;

export const fonts = {
  regular: 'OpenSans_400Regular',
  medium: 'OpenSans_500Medium',
  semiBold: 'OpenSans_600SemiBold',
  bold: 'OpenSans_700Bold',
  extraBold: 'OpenSans_800ExtraBold',
} as const;

export const type = {
  display: { fontSize: 40, fontFamily: fonts.extraBold },
  h1: { fontSize: 32, fontFamily: fonts.bold },
  h2: { fontSize: 26, fontFamily: fonts.bold },
  h3: { fontSize: 20, fontFamily: fonts.semiBold },
  h4: { fontSize: 17, fontFamily: fonts.semiBold },
  h5: { fontSize: 15, fontFamily: fonts.semiBold },
  bodyLg: { fontSize: 16, fontFamily: fonts.regular },
  body: { fontSize: 14, fontFamily: fonts.regular },
  bodySm: { fontSize: 13, fontFamily: fonts.regular },
  caption: { fontSize: 12, fontFamily: fonts.regular },
  label: { fontSize: 11, fontFamily: fonts.semiBold },
} as const;

const elevation = (elev: number) =>
  Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elev / 2 },
      shadowOpacity: 0.1 + elev * 0.005,
      shadowRadius: elev * 1.5,
    },
    android: { elevation: elev },
    default: {},
  });

export const shadow = {
  sm: elevation(2),
  md: elevation(4),
  lg: elevation(8),
  xl: elevation(12),
} as const;

export const touchTarget = { min: 44 };
