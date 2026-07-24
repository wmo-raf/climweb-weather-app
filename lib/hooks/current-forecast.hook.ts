import { useEffect, useState } from 'react';
import Axios from 'axios';

import { ForecastRecord } from '@/lib/forecast/types';
import { createForecastProvider } from '@/lib/forecast/providers';

type ReturnType = [
  loading: boolean,
  forecast: ForecastRecord | undefined,
  error: Error | undefined,
  retry: () => void,
];

export function useForecast(latitude: number, longitude: number): ReturnType {
  const [forecast, setForecast] = useState<ForecastRecord>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();
  // Bumped by retry() to re-run the effect below without depending on
  // latitude/longitude having changed.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(undefined);
      const provider = createForecastProvider();
      try {
        setForecast(await provider.getForecast(latitude, longitude));
        setLoading(false);
      } catch (error) {
        setLoading(false);
        if (Axios.isAxiosError(error)) {
          console.error('Axios error:', error.response?.data || error.message);
        } else {
          console.error('Non-Axios error:' + error);
        }
        setError(new Error("There was a problem getting the weather. Please try again later."))
      }
    }
    fetchData()
  }, [latitude, longitude, attempt]);

  const retry = () => setAttempt(a => a + 1);

  return [loading, forecast, error, retry];
}
