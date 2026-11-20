import { DateTime } from 'luxon';

// Soil data behind one interface, so the For farming page doesn't care where
// it comes from. Today that's Open-Meteo (open-meteo.ts); moving to the main
// forecast feed means another implementation plus EXPO_PUBLIC_SOIL_PROVIDER
// (see index.ts).

export type SoilHour = {
  time: string;               // ISO, with offset
  temperature: number | null; // °C
  moisture: number | null;    // m³/m³
};

export type SoilData = {
  hours: SoilHour[];
  // When the source says the data goes stale (Cache-Control / Expires), epoch ms.
  expiresAt?: number;
};

export interface SoilDataSource {
  getSoilData(lat: number, lon: number): Promise<SoilData>;
}

export type SoilNow = {
  temperature?: number;
  moisture?: number;
};

// Values for the hour nearest to `now`. A null there stays missing rather
// than borrowing a neighbouring hour, so the card hides instead.
export function soilNow(data: SoilData | undefined, now: DateTime = DateTime.now()): SoilNow {
  if (!data?.hours.length) return {};
  const nearest = data.hours.reduce((best, hour) =>
    Math.abs(DateTime.fromISO(hour.time).toMillis() - now.toMillis()) <
    Math.abs(DateTime.fromISO(best.time).toMillis() - now.toMillis()) ? hour : best);
  return {
    temperature: nearest.temperature ?? undefined,
    moisture: nearest.moisture ?? undefined,
  };
}
