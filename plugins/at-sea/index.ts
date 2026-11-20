import { definePlugin } from '../types';
import AtSeaScreen from './AtSeaScreen';

export default definePlugin({
  info: {
    name: 'At sea',
    version: '1.0.0',
    description: 'Wind in plain words, wind and marine warnings, sun times and marine links for people at sea.',
    author: 'WMO RAF',
    author_url: 'https://github.com/wmo-raf',
    url: 'https://github.com/wmo-raf/climweb-weather-app',
    license: '', // the repository has no licence file yet
    contact: '',
  },
  icon: 'waves',
  titleKey: 'atSea.title',
  descriptionKey: 'more.atSea.description',
  Screen: AtSeaScreen,
});
