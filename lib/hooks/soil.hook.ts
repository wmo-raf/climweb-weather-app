import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { createSoilDataSource, SoilData } from '@/lib/soil';

const soilDataSource = createSoilDataSource();

export const soilQueryKey = (latitude: number | undefined, longitude: number | undefined) =>
  ['soil', latitude, longitude] as const;

// Soil data changes slowly; refetch at most hourly, or later if the source's
// cache headers say so.
const SOIL_MIN_STALE_TIME = 60 * 60 * 1000;

export function useSoilQuery(latitude: number | undefined, longitude: number | undefined): UseQueryResult<SoilData, Error> {
  return useQuery({
    queryKey: soilQueryKey(latitude, longitude),
    queryFn: async () => {
      try {
        return await soilDataSource.getSoilData(latitude!, longitude!);
      } catch (error) {
        console.error('Loading soil data rejected:', error);
        throw new Error('There was a problem getting the soil conditions. Please try again later.');
      }
    },
    enabled: latitude !== undefined && longitude !== undefined,
    staleTime: query => {
      const { data, dataUpdatedAt } = query.state;
      const fromHeaders = data?.expiresAt !== undefined ? data.expiresAt - dataUpdatedAt : 0;
      return Math.max(SOIL_MIN_STALE_TIME, fromHeaders);
    },
  });
}
