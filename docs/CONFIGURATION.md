# Configuration Guide

## Overview

This document describes how to configure the ClimWeb Weather App, including language setup and available translation keys.

## Localization & Language Setup

### Architecture

The app uses **i18next** for internationalization (i18n) with the following structure:

- **[lib/localization/i18n.ts](lib/localization/i18n.ts)** - i18n configuration and initialization
- **[lib/localization/translations/index.ts](lib/localization/translations/index.ts)** - Centralized LANGUAGES configuration
- **[lib/localization/translations](lib/localization/translations)** - Translation resource files
- **[app/Settings.tsx](app/Settings.tsx)** - Language selection UI

Languages are managed through a centralized `LANGUAGES` object that defines each language's key, display label, and translation resources.

### How to Add a Language

Follow these steps to add a new language to the app:

1. **Create a translation resource file**
   - Create a new JSON file in `lib/localization/translations/` (e.g., `french.json`)
   - Copy all keys from [english.json](lib/localization/translations/english.json) and translate the values
   - Ensure all keys match exactly (case-sensitive)

2. **Update translations/index.ts**
   - Import the new translation resource:
     ```typescript
     import frResources from './french.json';
       - Add an entry to the `LANGUAGES` object:
     ```typescript
     export const LANGUAGES = {
       en: {
         label: 'English',
         resources: enResources,
       },
       fr: {
         label: 'Français',
         resources: frResources,
       },
     };
     ```

3. **Verify**
   - The language will automatically appear in the Settings language dropdown
   - The app will properly detect and cache the user's language preference
   - The language toggle will be available immediately without additional code changes

### Translation Keys Reference

#### Navigation & UI
- **`Settings`** - Settings page title
- **`Language`** - Language selection label

#### About Pages
- **`About us`** - About Us page title
- **`About the app`** - About the App page title
- **`how.we.started`** - Section title for "How we started" story
- **`how.we.started.desc`** - Description of the organization's history
- **`our.mandate`** - Organization mandate title
- **`our.mandate.desc`** - Detailed mandate description
- **`our.mission`** - Organization mission title
- **`our.mission.desc`** - Detailed mission description
- **`our.vision`** - Organization vision title
- **`our.vision.desc`** - Detailed vision description
- **`app.and.forecasts`** - Section title about the app and forecasts
- **`app.and.forecasts.desc`** - Description of app development and forecast authority

#### Organization Info
- **`Department of Climate Change and Meteorological Services (DCCMS)`** - Full organization name
- **`partners`** - Label for project partners section
- **`Icons`** - Weather icons section title
- **`icons.disclaimer`** - Attribution text for weather icons
- **`warning.icons.disclaimer`** - Attribution for weather warning icons
- **`Geographical Data`** - Section title for geographical data
- **`geographical.data.disclaimer`** - Attribution for geographical data source
- **`Background photo`** - Background image title
- **`background.photo.disclaimer`** - Credit for background photo

#### Weather Information
- **`Today`** - Today's weather section
- **`Min`** - Minimum temperature label
- **`Max`** - Maximum temperature label
- **`Temp`** - Temperature label
- **`Km/h`** - Wind speed unit (kilometers per hour)
- **`Rain`** - Rainfall label
- **`mm`** - Rainfall unit (millimeters)
- **`Wind`** - Wind label
- **`Time`** - Time label
- **`Sun`** - Sunday day name
- **`Mon`** - Monday day name
- **`Tue`** - Tuesday day name
- **`Wed`** - Wednesday day name
- **`Thu`** - Thursday day name
- **`Fri`** - Friday day name
- **`Sat`** - Saturday day name

#### Weather Conditions (from meteorological API)
Weather condition keys describe various weather phenomena. Each follows the pattern: `[intensity]_[phenomenon][_modifier]`

Examples:
- **`clearsky_day`** - Clear sky during daytime
- **`clearsky_night`** - Clear sky during nighttime
- **`cloudy`** - Overcast/cloudy conditions
- **`rain`** - Rainfall
- **`rainandthunder`** - Rain with thunderstorms
- **`heavysnow`** - Heavy snowfall
- **`lightrain`** - Light rainfall
- **`sleet`** - Sleet (rain and snow mix)
- **`fog`** - Foggy conditions

Additional variants exist for:
- Different intensities: `light`, `heavy`
- Times of day: `_day`, `_night`, `_polartwilight`
- Phenomena: `rain`, `snow`, `sleet`, `thunder`, `showers`

#### User Interactions
- **`select.language.placeholder`** - Placeholder text for language dropdown
- **`Search location`** - Search field label/placeholder
- **`Not available`** - Generic unavailable message
- **`Loading`** - Loading indicator text
- **`Forecast not available at the moment. Please try again later.`** - Forecast unavailability message
- **`Forecast unavailable`** - Short forecast unavailable label
- **`There was an error getting the forecast`** - Error message for forecast retrieval
- **`English`** - English language name
- **`Chichewa`** - Chichewa language name (deprecated - pending removal)

Here’s a clean entry you can drop into `CONFIGURATION.md`.

## Forecast Source Configuration

Climweb Weather App supports configurable forecast sources through environment variables and a provider interface. There are two deployment paths:

1. **Yr-compatible API** — the source follows the Yr / MET Norway Locationforecast response format. Only the URL needs to change.
2. **Custom API** — the source uses a different format. A custom provider is implemented, registered in the factory, and selected via an environment variable.

The rest of the app — screens, components, and the Redux store — is not aware of which provider is active.

---

### 1. Using a Yr-compatible forecast API

If the forecast API follows the Yr / MET Norway Locationforecast response structure, only the URL and supporting environment variables need to be configured. No code changes are required.

#### Required environment variables

```env
EXPO_PUBLIC_PRIMARY_API_URL=https://example.com/weatherapi/locationforecast/2.0/compact
EXPO_PUBLIC_FALLBACK_API_URL=https://fallback.example.com/weatherapi/locationforecast/2.0/compact
EXPO_PUBLIC_APP_USER_AGENT=Climweb Weather App/1.0 contact@example.com
EXPO_PUBLIC_APP_TIMEZONE=Africa/Blantyre
```

`EXPO_PUBLIC_FORECAST_PROVIDER` can be omitted or explicitly set to `yr`, which is the default.

#### URL format

The configured URL must accept requests with the following query parameters:

```txt
?lat=<latitude>&lon=<longitude>&altitude=<altitude>
```

For example:

```txt
https://example.com/weatherapi/locationforecast/2.0/compact?lat=-13.9626&lon=33.7741&altitude=1050
```

#### Primary and fallback APIs

The app uses the primary API first. If the primary API fails repeatedly, a circuit breaker opens and all requests fall through to the fallback API until the primary recovers. Configure both to ensure the app continues serving forecasts during outages.

#### User-Agent

Some APIs based on the Yr / MET Norway pattern require a valid `User-Agent` header that identifies the application and provides a contact address. Use a value specific to the deploying organization:

```env
EXPO_PUBLIC_APP_USER_AGENT=Kenya Meteorological Department Weather App/1.0 forecast@meteo.go.ke
```

#### Timezone

Forecast days are grouped and daily summaries are calculated in the configured timezone. Set this to the local timezone for the deployment region:

```env
EXPO_PUBLIC_APP_TIMEZONE=Africa/Dar_es_Salaam
```

---

### 2. Using a different forecast API

If the forecast source does not follow the Yr / MET Norway response format, a custom provider must be implemented. The custom provider is responsible for fetching data from the API and converting it into the app’s forecast data structure.

#### The provider interface

All forecast providers — built-in and custom — implement the same interface, defined in [lib/forecast/interfaces/forecast-provider.interface.ts](lib/forecast/interfaces/forecast-provider.interface.ts):

```ts
export interface ForecastProviderInterface {
  getForecast(lat: number, lon: number, alt?: number): Promise<ForecastRecord>;
}
```

`ForecastRecord` is the app’s internal forecast representation. It is provider-agnostic and stored directly in Redux. Its structure is defined in [lib/forecast/types.ts](lib/forecast/types.ts):

```ts
export interface ForecastRecord {
  days: ForecastDayRecord[];
}

export interface ForecastDayRecord {
  day: string;            // ISO date string, start of day in configured timezone
  weatherSymbol?: string;
  maxTemperature?: number;
  minTemperature?: number;
  windSpeed?: number;     // km/h
  steps: ForecastStepRecord[];
}

export interface ForecastStepRecord {
  time: string;                 // ISO string in configured timezone
  temperature?: number;         // °C
  windSpeed?: number;           // km/h
  precipitation: number | "-";  // mm, or "-" if unavailable
  weatherSymbol: string;        // symbol code
}
```

The custom provider must fetch data from its API and return a fully populated `ForecastRecord`. All unit conversions, symbol selection, and day grouping should happen inside the provider.

#### Example custom provider

```ts
import { ForecastProviderInterface } from ‘@/lib/forecast/interfaces’;
import { ForecastRecord } from ‘@/lib/forecast/types’;

export class CustomForecastProvider implements ForecastProviderInterface {
  async getForecast(lat: number, lon: number, alt?: number): Promise<ForecastRecord> {
    // 1. Fetch data from the custom API
    // 2. Convert to ForecastRecord
    // 3. Return the result
  }
}
```

#### Registering the custom provider

Open [lib/forecast/providers/factory.ts](lib/forecast/providers/factory.ts) and add a case for the new provider:

```ts
import { CustomForecastProvider } from ‘./custom-forecast.provider’;

export function createForecastProvider(): ForecastProviderInterface {
  switch (FORECAST_PROVIDER) {
    case "my-provider": return new CustomForecastProvider();
    case "yr":
    default:            return new YrForecastProvider();
  }
}
```

Then set the provider key in the environment:

```env
EXPO_PUBLIC_FORECAST_PROVIDER=my-provider
```

---

### 3. Quick reference

```txt
Yr-compatible API  →  set EXPO_PUBLIC_PRIMARY_API_URL (and optionally FALLBACK)
Different API      →  implement ForecastProviderInterface, register in factory.ts,
                      set EXPO_PUBLIC_FORECAST_PROVIDER
```

---

### 4. Recommended setup flow

For a new deployment:

1. Confirm whether the forecast API follows the Yr / MET Norway Locationforecast format.
2. If it does, set `EXPO_PUBLIC_PRIMARY_API_URL`, `EXPO_PUBLIC_FALLBACK_API_URL`, `EXPO_PUBLIC_APP_USER_AGENT`, and `EXPO_PUBLIC_APP_TIMEZONE`. Leave `EXPO_PUBLIC_FORECAST_PROVIDER` unset or set it to `yr`.
3. Test forecast loading for several locations across the deployment region.
4. If the source uses a different format, implement `ForecastProviderInterface`, register the provider in `factory.ts`, and set `EXPO_PUBLIC_FORECAST_PROVIDER` to the registered key.

The screens, components, and Redux store do not need to change regardless of which provider is used.

---

## Alerts Source Configuration

Climweb Weather App supports configurable alert sources through environment variables and a provider interface. There are two deployment paths:

1. **CAP-standard RSS feed** — the source publishes alerts as a CAP RSS feed. Only the URL needs to change.
2. **Custom source** — the source uses a different format. A custom provider is implemented, registered in the factory, and selected via an environment variable.

The rest of the app — screens, components, and the Redux store — is not aware of which provider is active.

---

### 1. Using a CAP-standard alerts feed

If the alerts source publishes a CAP RSS feed (each item linking to a CAP XML document), only the URL and supporting environment variables need to be configured. No code changes are required.

#### Required environment variables

```env
EXPO_PUBLIC_PRIMARY_ALERTS_URL=https://example.com/alerts/rss.xml
EXPO_PUBLIC_FALLBACK_ALERTS_URL=https://fallback.example.com/alerts/rss.xml
EXPO_PUBLIC_APP_ALERTS_SENDER_ID=alerts@example.com
```

`EXPO_PUBLIC_ALERTS_PROVIDER` can be omitted or explicitly set to `cap`, which is the default.

#### Sender ID filtering

Active alerts are filtered to only those where `alert.sender` matches `EXPO_PUBLIC_APP_ALERTS_SENDER_ID`. Set this to the sender address used in the CAP messages for the deployment region:

```env
EXPO_PUBLIC_APP_ALERTS_SENDER_ID=forecasts@meteo.go.ke
```

#### Primary and fallback feed URLs

The app uses the primary URL first. A circuit breaker opens after repeated failures and routes requests to the fallback URL until the primary recovers.

---

### 2. Using a different alerts source

If the alerts source does not publish a CAP RSS feed, a custom provider must be implemented. The custom provider is responsible for fetching alerts and converting them into `CAPAlert[]`.

#### The provider interface

All alerts providers — built-in and custom — implement the same interface, defined in [lib/alerts/interfaces/alerts-provider.interface.ts](lib/alerts/interfaces/alerts-provider.interface.ts):

```ts
export interface AlertsProviderInterface {
  getAlerts(): Promise<CAPAlert[]>;
}
```

`CAPAlert` is the app's internal alert representation. Its structure is defined in [lib/alerts/alert.ts](lib/alerts/alert.ts) and follows the CAP (Common Alerting Protocol) schema. The custom provider must fetch data from its source and return a fully populated `CAPAlert[]`.

#### Example custom provider

```ts
import { AlertsProviderInterface } from '@/lib/alerts/interfaces';
import { CAPAlert } from '@/lib/alerts/alert';

export class CustomAlertsProvider implements AlertsProviderInterface {
  async getAlerts(): Promise<CAPAlert[]> {
    // 1. Fetch data from the custom source
    // 2. Convert to CAPAlert[]
    // 3. Return the result
  }
}
```

#### Registering the custom provider

Open [lib/alerts/providers/factory.ts](lib/alerts/providers/factory.ts) and add a case for the new provider:

```ts
import { CustomAlertsProvider } from './custom-alerts.provider';

export function createAlertsProvider(): AlertsProviderInterface {
  switch (ALERTS_PROVIDER) {
    case "my-provider": return new CustomAlertsProvider();
    case "cap":
    default:            return new CAPAlertsProvider();
  }
}
```

Then set the provider key in the environment:

```env
EXPO_PUBLIC_ALERTS_PROVIDER=my-provider
```

---

### 3. Quick reference

```txt
CAP-standard feed  →  set EXPO_PUBLIC_PRIMARY_ALERTS_URL (and optionally FALLBACK),
                      set EXPO_PUBLIC_APP_ALERTS_SENDER_ID
Different source   →  implement AlertsProviderInterface, register in factory.ts,
                      set EXPO_PUBLIC_ALERTS_PROVIDER
```

---

### 4. Recommended setup flow

For a new deployment:

1. Confirm whether the alerts source publishes a CAP RSS feed.
2. If it does, set `EXPO_PUBLIC_PRIMARY_ALERTS_URL`, `EXPO_PUBLIC_FALLBACK_ALERTS_URL`, and `EXPO_PUBLIC_APP_ALERTS_SENDER_ID`. Leave `EXPO_PUBLIC_ALERTS_PROVIDER` unset or set it to `cap`.
3. Test alert loading and verify that relevant alerts appear for locations within the deployment region.
4. If the source uses a different format, implement `AlertsProviderInterface`, register the provider in `factory.ts`, and set `EXPO_PUBLIC_ALERTS_PROVIDER` to the registered key.

The screens, components, and Redux store do not need to change regardless of which provider is used.

