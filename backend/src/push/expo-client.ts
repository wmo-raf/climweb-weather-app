import { Expo } from 'expo-server-sdk';
import { config } from '../config';

export const expo = new Expo({ accessToken: config.expoAccessToken });
