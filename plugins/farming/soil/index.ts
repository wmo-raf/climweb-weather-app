import { SOIL_PROVIDER } from '../settings';
import { SoilDataSource } from './soil-data-source';
import { OpenMeteoSoilDataSource } from './open-meteo';

export type { SoilData, SoilDataSource, SoilHour, SoilNow } from './soil-data-source';
export { soilNow } from './soil-data-source';

export function createSoilDataSource(): SoilDataSource {
  switch (SOIL_PROVIDER) {
    case 'open-meteo':
    default:
      return new OpenMeteoSoilDataSource();
  }
}
