import { ImageSourcePropType } from 'react-native';

import { colors } from '@/lib/theme';

const warningRed = require('@/assets/warning-red.png');
const warningOrange = require('@/assets/warning-orange.png');
const warningYellow = require('@/assets/warning-yellow.png');

export const WEATHER_WARNING_ICONS: { [k: string]: ImageSourcePropType } = {
  red: warningRed,
  orange: warningOrange,
  yellow: warningYellow,
};

// Flat, opaque alert-level colors (no transparency — see docs/STYLE.md "flat colors only").
export const WARNING_COLORS: { [k in 'Red' | 'Yellow' | 'Orange' | 'Cyan' | 'Blue']: string} = {
  Red: '#C60000',
  Yellow: '#FFE600',
  Orange: '#FF9D00',
  Cyan: '#399CC7',
  Blue: '#82A8DF',
};

// Text/icon color to use on top of WARNING_COLORS — Yellow and Blue are too
// light for white text, so they get dark text instead.
export const WARNING_BAND_TEXT_COLORS: { [k in 'Red' | 'Yellow' | 'Orange' | 'Cyan' | 'Blue']: string } = {
  Red: colors.textInverse,
  Orange: colors.textInverse,
  Yellow: colors.textStrong,
  Cyan: colors.textInverse,
  Blue: colors.textStrong,
};

// Light tint + dark text pairs for "What to do" boxes, sourced from
// docs/STYLE.md's status colors (danger/warning/info) since the 5 CAP levels
// map onto fewer visually-distinct tints than raw severities.
export const WARNING_TINT_COLORS: { [k in 'Red' | 'Yellow' | 'Orange' | 'Cyan' | 'Blue']: { bg: string; text: string } } = {
  Red: { bg: colors.dangerBg, text: colors.danger },
  Orange: { bg: colors.warningBg, text: colors.warning },
  Yellow: { bg: colors.warningBg, text: colors.warning },
  Cyan: { bg: colors.infoBg, text: colors.infoText },
  Blue: { bg: colors.infoBg, text: colors.infoText },
};
