import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Axios from 'axios';
import { DateTime } from 'luxon';

import { ForecastRecord } from '@/lib/forecast/types';
import { createForecastProvider } from '@/lib/forecast/providers';

const forecastProvider = createForecastProvider();

type ForecastPayload = { lat: number, lon: number };
export const getLocationForecast = createAsyncThunk('forecast/getLocationForecast', async ({ lat, lon }: ForecastPayload): Promise<ForecastRecord> => {
  console.log('[Thunk] getLocationForecast DISPATCHED with', { lat, lon });
  return await forecastProvider.getForecast(lat, lon);
});

type InitialState = {
  loading: boolean;
  error?: string;
  forecast?: ForecastRecord;
  // ISO timestamp of the last successful forecast fetch, set regardless of
  // whether it arrived via the getLocationForecast thunk or a direct
  // setForecast dispatch (e.g. picking a city on NoLocation/Places).
  lastFetchedAt?: string;
};
const initialState: InitialState = {
  loading: false,
  error: undefined,
  forecast: undefined,
  lastFetchedAt: undefined,
};

const forecastSlice = createSlice({
  name: 'forecast',
  initialState,
  reducers: {
    setForecastLoading: (state) => { state.forecast = undefined; state.error = undefined; state.loading = true; },
    setForecast: (state, action) => { state.forecast = action.payload; state.lastFetchedAt = DateTime.now().toISO()! },
    setForecastError: (state, action) => { state.error = action.payload },
    resetForecastError: (state) => {
      console.log('[Redux] clearing forecast error...');
      state.error = undefined;
    },
  },
  extraReducers(builder) {
    builder.addCase(getLocationForecast.pending, state => {
      console.log('Loading forecast...');
      state.loading = true;
    });
    builder.addCase(getLocationForecast.fulfilled, (state, action) => {
      console.log('Loading forecast fulfilled.');
      state.loading = false;
      state.forecast = action.payload;
      state.lastFetchedAt = DateTime.now().toISO()!;
    });
    builder.addCase(getLocationForecast.rejected, (state, action) => {
      state.loading = false;
      let err = ""
      if (Axios.isAxiosError(action.error)) {
        err = action.error.response?.data || action.error.message;
      } else if (action.error.message) {
        err = action.error.message;
      }
      console.error('Loading forecast rejected: ' + err);
      state.error = 'There was a problem getting the weather. Please try again later.';
    });
  },
})

export const { setForecast, setForecastError, setForecastLoading, resetForecastError } = forecastSlice.actions;
export const { reducer: forecastReducer } = forecastSlice;
