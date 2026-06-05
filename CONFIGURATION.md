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
     ```
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
