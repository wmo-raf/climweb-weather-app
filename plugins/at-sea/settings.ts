import { csv } from '@/config/parse';

// At sea plugin settings. The defaults are TMA's (Tanzania); another
// deployment enabling this plugin should override them in its .env.

// A CAP alert counts as an at-sea advisory when its event, headline or an
// eventCode value contains one of these words (whole word, case-insensitive,
// plural "s" allowed — see warnings.ts). Covers English and Swahili wording;
// override with a comma-separated EXPO_PUBLIC_AT_SEA_WARNING_KEYWORDS.
export const AT_SEA_WARNING_KEYWORDS = csv(process.env.EXPO_PUBLIC_AT_SEA_WARNING_KEYWORDS, [
  'wind', 'gale', 'marine', 'sea', 'wave', 'swell', 'cyclone', 'tropical storm', 'storm surge', 'tsunami', 'coastal',
  'upepo', 'bahari', 'mawimbi', 'kimbunga',
]);
// "Read more" links.
export const MARINE_FORECAST_URL = process.env.EXPO_PUBLIC_MARINE_FORECAST_URL ?? 'https://www.meteo.go.tz/services/marine-weather-forecast';
export const TSUNAMI_CENTRE_URL = process.env.EXPO_PUBLIC_TSUNAMI_CENTRE_URL ?? 'https://www.meteo.go.tz/services/tsunami-centre';
