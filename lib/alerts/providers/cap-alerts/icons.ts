import { ImageSourcePropType } from 'react-native';

const warningRed = require('@/assets/warning-red.png');
const warningOrange = require('@/assets/warning-orange.png');
const warningYellow = require('@/assets/warning-yellow.png');

export const WEATHER_WARNING_ICONS: { [k: string]: ImageSourcePropType } = {
  red: warningRed,
  orange: warningOrange,
  yellow: warningYellow,
};

// Flat, opaque alert-level colors (no transparency — see docs/STYLE.md "flat colors only").
// These 5 CAP severity levels aren't all covered by STYLE.md's 4 core status colors;
// full contrast/legend treatment is redesigned in Step 4.
export const WARNING_COLORS: { [k in 'Red' | 'Yellow' | 'Orange' | 'Cyan' | 'Blue']: string} = {
  Red: '#C60000',
  Yellow: '#FFE600',
  Orange: '#FF9D00',
  Cyan: '#399CC7',
  Blue: '#82A8DF',
};
