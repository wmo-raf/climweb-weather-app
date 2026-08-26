// Framework-agnostic geonames lookup, shared between the Expo client and the
// backend (see backend/Dockerfile, which copies this file into the backend's
// build context the same way it does lib/alerts). Keep this free of
// React Native / Expo imports so it can run under plain Node.
import geonames from '../../assets/geonames.json';

export type Place = {
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number | null;
  admin1?: string | null;
  admin2?: string | null;
  feature?: string | null;
};

export type LatLon = { lat: number; long: number };

// Identifies a place by name rather than by coordinates — this is what the
// app sends the backend instead of GPS coordinates, and what the backend
// resolves back to a lat/lon against its own copy of assets/geonames.json.
export type PlaceQuery = {
  name: string;
  admin1?: string | null;
  admin2?: string | null;
  feature?: string | null;
};

const places = geonames as Place[];

export function closestPlace(location: LatLon): Place | undefined {
  let closest: { distance: number; place: Place | undefined } = { distance: 9_000_000, place: undefined };

  for (const place of places) {
    const distance = haversineDistance(location, { lat: place.latitude, long: place.longitude });
    if (distance < closest.distance) {
      closest = { distance, place };
    }
  }

  return closest.place;
}

// Name/admin1/admin2/feature doesn't uniquely identify a place in every case
// (~7% of entries share all four fields with at least one other entry) — an
// acceptable tradeoff since this is already an approximate, snapped-to-place
// location rather than a precise one. Returns the first match deterministically.
export function resolvePlace(query: PlaceQuery): Place | undefined {
  return places.find(
    (place) =>
      place.name === query.name &&
      (place.admin1 ?? null) === (query.admin1 ?? null) &&
      (place.admin2 ?? null) === (query.admin2 ?? null) &&
      (place.feature ?? null) === (query.feature ?? null)
  );
}

function haversineDistance(point1: LatLon, point2: LatLon): number {
  const radlat1 = (Math.PI * point1.lat) / 180;
  const radlat2 = (Math.PI * point2.lat) / 180;
  const theta = point1.long - point2.long;
  const radtheta = (Math.PI * theta) / 180;

  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) {
    dist = 1;
  }

  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  dist = dist * 1.609344;

  return dist;
}
