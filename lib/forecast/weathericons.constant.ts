import React from 'react';
import type { IconSource } from 'react-native-paper/lib/typescript/components/Icon';
import { SvgProps } from 'react-native-svg';

import ClearskyDay from '../../assets/weather_icon/svg/clearsky_day.svg';
import ClearskyNight from '../../assets/weather_icon/svg/clearsky_night.svg';
import ClearskyPolartwilight from '../../assets/weather_icon/svg/clearsky_polartwilight.svg';
import Cloudy from '../../assets/weather_icon/svg/cloudy.svg';
import FairDay from '../../assets/weather_icon/svg/fair_day.svg';
import FairNight from '../../assets/weather_icon/svg/fair_night.svg';
import FairPolartwilight from '../../assets/weather_icon/svg/fair_polartwilight.svg';
import Fog from '../../assets/weather_icon/svg/fog.svg';
import HeavyrainAndThunder from '../../assets/weather_icon/svg/heavyrainandthunder.svg';
import Heavyrain from '../../assets/weather_icon/svg/heavyrain.svg';
import HeavyrainshowersAndThunderDay from '../../assets/weather_icon/svg/heavyrainshowersandthunder_day.svg';
import HeavyrainshowersAndThunderNight from '../../assets/weather_icon/svg/heavyrainshowersandthunder_night.svg';
import HeavyrainshowersAndThunderPolartwilight from '../../assets/weather_icon/svg/heavyrainshowersandthunder_polartwilight.svg';
import HeavyrainshowersDay from '../../assets/weather_icon/svg/heavyrainshowers_day.svg';
import HeavyrainshowersNight from '../../assets/weather_icon/svg/heavyrainshowers_night.svg';
import HeavyrainshowersPolartwilight from '../../assets/weather_icon/svg/heavyrainshowers_polartwilight.svg';
import HeavysleetAndThunder from '../../assets/weather_icon/svg/heavysleetandthunder.svg';
import Heavysleet from '../../assets/weather_icon/svg/heavysleet.svg';
import HeavysleetshowersAndThunderDay from '../../assets/weather_icon/svg/heavysleetshowersandthunder_day.svg';
import HeavysleetshowersAndThunderNight from '../../assets/weather_icon/svg/heavysleetshowersandthunder_night.svg';
import HeavysleetshowersAndThunderPolartwilight from '../../assets/weather_icon/svg/heavysleetshowersandthunder_polartwilight.svg';
import HeavysleetshowersDay from '../../assets/weather_icon/svg/heavysleetshowers_day.svg';
import HeavysleetshowersNight from '../../assets/weather_icon/svg/heavysleetshowers_night.svg';
import HeavysleetshowersPolartwilight from '../../assets/weather_icon/svg/heavysleetshowers_polartwilight.svg';
import HeavysnowAndThunder from '../../assets/weather_icon/svg/heavysnowandthunder.svg';
import Heavysnow from '../../assets/weather_icon/svg/heavysnow.svg';
import HeavysnowshowersAndThunderDay from '../../assets/weather_icon/svg/heavysnowshowersandthunder_day.svg';
import HeavysnowshowersAndThunderNight from '../../assets/weather_icon/svg/heavysnowshowersandthunder_night.svg';
import HeavysnowshowersAndThunderPolartwilight from '../../assets/weather_icon/svg/heavysnowshowersandthunder_polartwilight.svg';
import HeavysnowshowersDay from '../../assets/weather_icon/svg/heavysnowshowers_day.svg';
import HeavysnowshowersNight from '../../assets/weather_icon/svg/heavysnowshowers_night.svg';
import HeavysnowshowersPolartwilight from '../../assets/weather_icon/svg/heavysnowshowers_polartwilight.svg';
import LightrainAndThunder from '../../assets/weather_icon/svg/lightrainandthunder.svg';
import Lightrain from '../../assets/weather_icon/svg/lightrain.svg';
import LightrainshowersAndThunderDay from '../../assets/weather_icon/svg/lightrainshowersandthunder_day.svg';
import LightrainshowersAndThunderNight from '../../assets/weather_icon/svg/lightrainshowersandthunder_night.svg';
import LightrainshowersAndThunderPolartwilight from '../../assets/weather_icon/svg/lightrainshowersandthunder_polartwilight.svg';
import LightrainshowersDay from '../../assets/weather_icon/svg/lightrainshowers_day.svg';
import LightrainshowersNight from '../../assets/weather_icon/svg/lightrainshowers_night.svg';
import LightrainshowersPolartwilight from '../../assets/weather_icon/svg/lightrainshowers_polartwilight.svg';
import LightsleetAndThunder from '../../assets/weather_icon/svg/lightsleetandthunder.svg';
import Lightsleet from '../../assets/weather_icon/svg/lightsleet.svg';
import LightsleetshowersAndThunderDay from '../../assets/weather_icon/svg/lightsleetshowersandthunder_day.svg';
import LightsleetshowersAndThunderNight from '../../assets/weather_icon/svg/lightsleetshowersandthunder_night.svg';
import LightsleetshowersAndThunderPolartwilight from '../../assets/weather_icon/svg/lightsleetshowersandthunder_polartwilight.svg';
import LightsleetshowersDay from '../../assets/weather_icon/svg/lightsleetshowers_day.svg';
import LightsleetshowersNight from '../../assets/weather_icon/svg/lightsleetshowers_night.svg';
import LightsleetshowersPolartwilight from '../../assets/weather_icon/svg/lightsleetshowers_polartwilight.svg';
import LightsnowAndThunder from '../../assets/weather_icon/svg/lightsnowandthunder.svg';
import Lightsnow from '../../assets/weather_icon/svg/lightsnow.svg';
import LightsnowshowersAndThunderDay from '../../assets/weather_icon/svg/lightsnowshowersandthunder_day.svg';
import LightsnowshowersAndThunderNight from '../../assets/weather_icon/svg/lightsnowshowersandthunder_night.svg';
import LightsnowshowersAndThunderPolartwilight from '../../assets/weather_icon/svg/lightsnowshowersandthunder_polartwilight.svg';
import LightsnowshowersDay from '../../assets/weather_icon/svg/lightsnowshowers_day.svg';
import LightsnowshowersNight from '../../assets/weather_icon/svg/lightsnowshowers_night.svg';
import LightsnowshowersPolartwilight from '../../assets/weather_icon/svg/lightsnowshowers_polartwilight.svg';
import PartlycloudyDay from '../../assets/weather_icon/svg/partlycloudy_day.svg';
import PartlycloudyNight from '../../assets/weather_icon/svg/partlycloudy_night.svg';
import PartlycloudyPolartwilight from '../../assets/weather_icon/svg/partlycloudy_polartwilight.svg';
import RainAndThunder from '../../assets/weather_icon/svg/rainandthunder.svg';
import Rain from '../../assets/weather_icon/svg/rain.svg';
import RainshowersAndThunderDay from '../../assets/weather_icon/svg/rainshowersandthunder_day.svg';
import RainshowersAndThunderNight from '../../assets/weather_icon/svg/rainshowersandthunder_night.svg';
import RainshowersAndThunderPolartwilight from '../../assets/weather_icon/svg/rainshowersandthunder_polartwilight.svg';
import RainshowersDay from '../../assets/weather_icon/svg/rainshowers_day.svg';
import RainshowersNight from '../../assets/weather_icon/svg/rainshowers_night.svg';
import RainshowersPolartwilight from '../../assets/weather_icon/svg/rainshowers_polartwilight.svg';
import SleetAndThunder from '../../assets/weather_icon/svg/sleetandthunder.svg';
import Sleet from '../../assets/weather_icon/svg/sleet.svg';
import SleetshowersAndThunderDay from '../../assets/weather_icon/svg/sleetshowersandthunder_day.svg';
import SleetshowersAndThunderNight from '../../assets/weather_icon/svg/sleetshowersandthunder_night.svg';
import SleetshowersAndThunderPolartwilight from '../../assets/weather_icon/svg/sleetshowersandthunder_polartwilight.svg';
import SleetshowersDay from '../../assets/weather_icon/svg/sleetshowers_day.svg';
import SleetshowersNight from '../../assets/weather_icon/svg/sleetshowers_night.svg';
import SleetshowersPolartwilight from '../../assets/weather_icon/svg/sleetshowers_polartwilight.svg';
import SnowAndThunder from '../../assets/weather_icon/svg/snowandthunder.svg';
import Snow from '../../assets/weather_icon/svg/snow.svg';
import SnowshowersAndThunderDay from '../../assets/weather_icon/svg/snowshowersandthunder_day.svg';
import SnowshowersAndThunderNight from '../../assets/weather_icon/svg/snowshowersandthunder_night.svg';
import SnowshowersAndThunderPolartwilight from '../../assets/weather_icon/svg/snowshowersandthunder_polartwilight.svg';
import SnowshowersDay from '../../assets/weather_icon/svg/snowshowers_day.svg';
import SnowshowersNight from '../../assets/weather_icon/svg/snowshowers_night.svg';
import SnowshowersPolartwilight from '../../assets/weather_icon/svg/snowshowers_polartwilight.svg';

const icon_warning_wind_yellow = require('../../assets/weather_icon/png/icon-warning-wind-yellow.png');
const icon_warning_wind_red = require('../../assets/weather_icon/png/icon-warning-wind-red.png');

// react-native-paper's <Icon source={...} /> accepts a render function of the
// shape (props: { size: number; color: string }) => ReactNode, so each SVG
// component is wrapped to size itself to the requested icon size.
const svgIcon = (Svg: React.FC<SvgProps>): IconSource => ({ size }) =>
  React.createElement(Svg, { width: size, height: size });

const icons: { [key: string]: IconSource } = {
  clearsky_day: svgIcon(ClearskyDay),
  clearsky_night: svgIcon(ClearskyNight),
  clearsky_polartwilight: svgIcon(ClearskyPolartwilight),
  cloudy: svgIcon(Cloudy),
  fair_day: svgIcon(FairDay),
  fair_night: svgIcon(FairNight),
  fair_polartwilight: svgIcon(FairPolartwilight),
  fog: svgIcon(Fog),
  heavyrainandthunder: svgIcon(HeavyrainAndThunder),
  heavyrain: svgIcon(Heavyrain),
  heavyrainshowersandthunder_day: svgIcon(HeavyrainshowersAndThunderDay),
  heavyrainshowersandthunder_night: svgIcon(HeavyrainshowersAndThunderNight),
  heavyrainshowersandthunder_polartwilight: svgIcon(HeavyrainshowersAndThunderPolartwilight),
  heavyrainshowers_day: svgIcon(HeavyrainshowersDay),
  heavyrainshowers_night: svgIcon(HeavyrainshowersNight),
  heavyrainshowers_polartwilight: svgIcon(HeavyrainshowersPolartwilight),
  heavysleetandthunder: svgIcon(HeavysleetAndThunder),
  heavysleet: svgIcon(Heavysleet),
  heavysleetshowersandthunder_day: svgIcon(HeavysleetshowersAndThunderDay),
  heavysleetshowersandthunder_night: svgIcon(HeavysleetshowersAndThunderNight),
  heavysleetshowersandthunder_polartwilight: svgIcon(HeavysleetshowersAndThunderPolartwilight),
  heavysleetshowers_day: svgIcon(HeavysleetshowersDay),
  heavysleetshowers_night: svgIcon(HeavysleetshowersNight),
  heavysleetshowers_polartwilight: svgIcon(HeavysleetshowersPolartwilight),
  heavysnowandthunder: svgIcon(HeavysnowAndThunder),
  heavysnow: svgIcon(Heavysnow),
  heavysnowshowersandthunder_day: svgIcon(HeavysnowshowersAndThunderDay),
  heavysnowshowersandthunder_night: svgIcon(HeavysnowshowersAndThunderNight),
  heavysnowshowersandthunder_polartwilight: svgIcon(HeavysnowshowersAndThunderPolartwilight),
  heavysnowshowers_day: svgIcon(HeavysnowshowersDay),
  heavysnowshowers_night: svgIcon(HeavysnowshowersNight),
  heavysnowshowers_polartwilight: svgIcon(HeavysnowshowersPolartwilight),
  lightrainandthunder: svgIcon(LightrainAndThunder),
  lightrain: svgIcon(Lightrain),
  lightrainshowersandthunder_day: svgIcon(LightrainshowersAndThunderDay),
  lightrainshowersandthunder_night: svgIcon(LightrainshowersAndThunderNight),
  lightrainshowersandthunder_polartwilight: svgIcon(LightrainshowersAndThunderPolartwilight),
  lightrainshowers_day: svgIcon(LightrainshowersDay),
  lightrainshowers_night: svgIcon(LightrainshowersNight),
  lightrainshowers_polartwilight: svgIcon(LightrainshowersPolartwilight),
  lightsleetandthunder: svgIcon(LightsleetAndThunder),
  lightsleet: svgIcon(Lightsleet),
  lightssleetshowersandthunder_day: svgIcon(LightsleetshowersAndThunderDay),
  lightssleetshowersandthunder_night: svgIcon(LightsleetshowersAndThunderNight),
  lightssleetshowersandthunder_polartwilight: svgIcon(LightsleetshowersAndThunderPolartwilight),
  lightsleetshowers_day: svgIcon(LightsleetshowersDay),
  lightsleetshowers_night: svgIcon(LightsleetshowersNight),
  lightsleetshowers_polartwilight: svgIcon(LightsleetshowersPolartwilight),
  lightsnowandthunder: svgIcon(LightsnowAndThunder),
  lightsnow: svgIcon(Lightsnow),
  lightssnowshowersandthunder_day: svgIcon(LightsnowshowersAndThunderDay),
  lightssnowshowersandthunder_night: svgIcon(LightsnowshowersAndThunderNight),
  lightssnowshowersandthunder_polartwilight: svgIcon(LightsnowshowersAndThunderPolartwilight),
  lightsnowshowers_day: svgIcon(LightsnowshowersDay),
  lightsnowshowers_night: svgIcon(LightsnowshowersNight),
  lightsnowshowers_polartwilight: svgIcon(LightsnowshowersPolartwilight),
  partlycloudy_day: svgIcon(PartlycloudyDay),
  partlycloudy_night: svgIcon(PartlycloudyNight),
  partlycloudy_polartwilight: svgIcon(PartlycloudyPolartwilight),
  rainandthunder: svgIcon(RainAndThunder),
  rain: svgIcon(Rain),
  rainshowersandthunder_day: svgIcon(RainshowersAndThunderDay),
  rainshowersandthunder_night: svgIcon(RainshowersAndThunderNight),
  rainshowersandthunder_polartwilight: svgIcon(RainshowersAndThunderPolartwilight),
  rainshowers_day: svgIcon(RainshowersDay),
  rainshowers_night: svgIcon(RainshowersNight),
  rainshowers_polartwilight: svgIcon(RainshowersPolartwilight),
  sleetandthunder: svgIcon(SleetAndThunder),
  sleet: svgIcon(Sleet),
  sleetshowersandthunder_day: svgIcon(SleetshowersAndThunderDay),
  sleetshowersandthunder_night: svgIcon(SleetshowersAndThunderNight),
  sleetshowersandthunder_polartwilight: svgIcon(SleetshowersAndThunderPolartwilight),
  sleetshowers_day: svgIcon(SleetshowersDay),
  sleetshowers_night: svgIcon(SleetshowersNight),
  sleetshowers_polartwilight: svgIcon(SleetshowersPolartwilight),
  snowandthunder: svgIcon(SnowAndThunder),
  snow: svgIcon(Snow),
  snowshowersandthunder_day: svgIcon(SnowshowersAndThunderDay),
  snowshowersandthunder_night: svgIcon(SnowshowersAndThunderNight),
  snowshowersandthunder_polartwilight: svgIcon(SnowshowersAndThunderPolartwilight),
  snowshowers_day: svgIcon(SnowshowersDay),
  snowshowers_night: svgIcon(SnowshowersNight),
  snowshowers_polartwilight: svgIcon(SnowshowersPolartwilight),
  icon_warning_wind_yellow,
  icon_warning_wind_red,
};

export default icons;
