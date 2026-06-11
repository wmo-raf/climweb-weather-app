import { useEffect, useState } from 'react';
import Axios from 'axios';

import { ForecastRecord } from '@/lib/forecast/types';
import { createForecastProvider } from '@/lib/forecast/providers';

type ReturnType = [
  loading: boolean,
  forecast?: ForecastRecord,
  error?: Error,
];

export function useForecast(latitude: number, longitude: number): ReturnType {
  const [forecast, setForecast] = useState<ForecastRecord>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    const fetchData = async () => {
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
  }, [latitude, longitude]);

  return [loading, forecast, error];
}
