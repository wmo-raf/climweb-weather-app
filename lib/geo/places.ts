import { Location } from '@/lib/geo/location';
import { closestPlace, type Place } from '@/lib/geo/geonames';

export type { Place } from '@/lib/geo/geonames';

export function snapToPlace(location: Location): Place | undefined {
  if (!insideCountry(location)) {
    return;
  }
  return closestPlace(location);
}

function insideCountry(position: Location): boolean {
  // lon_min, lat_min, lon_max, lat_max
  const raw = process.env.EXPO_PUBLIC_APP_COUNTRY_BBOX ?? '';
  const bbox = raw.split(',').map(Number);

  return (
    position.lat > bbox[1] &&
    position.lat < bbox[3] &&
    position.long > bbox[0] &&
    position.long < bbox[2]
  );
}
