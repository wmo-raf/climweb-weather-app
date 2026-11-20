import { definePlugin } from '../types';
import FarmingScreen from './FarmingScreen';

export default definePlugin({
  info: {
    name: 'For farming',
    version: '1.0.0',
    description: 'Water in the soil, soil temperature, sun times and agromet links for farmers.',
    author: 'WMO RAF',
    author_url: 'https://github.com/wmo-raf',
    url: 'https://github.com/wmo-raf/climweb-weather-app',
    license: '', // the repository has no licence file yet
    contact: '',
  },
  icon: 'grass',
  titleKey: 'farming.title',
  descriptionKey: 'more.farming.description',
  Screen: FarmingScreen,
});
