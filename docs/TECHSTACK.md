# Tech Stack & Architecture

This document outlines the technology stack, architectural patterns, and core libraries used in the Climweb Weather App.

## 1. Core Technologies
* **Framework**: React Native (with Expo)
* **Language**: TypeScript

## 2. State Management
We enforce a strict separation between client UI state and server-cached data to ensure high performance and maintainability.

* **Client State**: **Zustand**
  * A minimalist, hook-based library that has gained immense popularity.
  * It requires no provider to wrap your app and offers a simple, intuitive API.
  * Zustand is incredibly lightweight (~2KB) and its fine-grained updates minimize re-renders, making it highly performant for mobile apps.
  * *Use cases*: Theme preference, unit system (Metric/Imperial), language selection, local app settings.
* **Server State & Memory Cache**: **React Query** (`@tanstack/react-query`)
  * Handles data fetching, caching, synchronization, and updating of server state.
  * Works in tandem with our offline storage to serve stale data immediately while fetching fresh data in the background, significantly reducing boilerplate code in the application layer.

## 3. Storage & Offline-First Strategy
The application employs an **Offline-First Strategy**, ensuring users can view critical weather data seamlessly even without an active network connection.

* **Relational Data Cache**: **Expo SQLite**
  * A robust, local SQLite database used to persistently store complex, structured weather data.
  * *Use cases*: Storing forecast history, querying cached location data, and supporting robust offline viewing of extensive meteorological datasets.
* **Key-Value Storage**: **AsyncStorage**
  * An asynchronous, unencrypted, persistent, key-value storage system.
  * *Use cases*: Simple persistent client-side storage, such as user settings, UI preferences, and persisting React Query state or tokens.

## 4. Localization (i18n)
* **Library**: **i18next** (along with `react-i18next`)
  * Handles translations and internationalization seamlessly across the application, plugging easily into our state and UI layers.

## 5. Architectural Pattern: Layered Architecture
The application follows a **Layered Architecture** using the **Repository Pattern** to decouple the UI from data fetching and logic. This ensures that our UI components remain clean, testable, and strictly responsible for presentation.

### Architecture Diagram

```text
┌──────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │Forecast  │  │ Settings │  │ LanguageSwitcher │    │
│  │Screen    │  │ Screen   │  │ (uses i18n)      │    │
│  └──────────┘  └──────────┘  └──────────────────┘ .. │
└────────────────────────┬─────────────────────────────┘
                         │ (uses Custom Hooks)
┌────────────────────────▼─────────────────────────────┐
│                  Application/Logic Layer             │
│  ┌───────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │useWeather     │  │useSettings  │  │useLocation │  │
│  │(React Query)  │  │(Zustand)    │  │(permission)│  │
│  └───────┬───────┘  └──────┬──────┘  └──────┬─────┘  │
└──────────┼─────────────────┼──────────────────┼──────┘
           │                 │                  │
┌──────────▼─────────────────▼──────────────────▼──────┐
│                    Domain Layer                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ IForecastRepository  (interface)               │  │
│  └────────────────────────────────────────────────┘  │
└────────────────────────┬─────────────────────────────┘
                         │ (implemented by)
┌────────────────────────▼─────────────────────────────┐
│                    Data Layer (Offline-First)        │
│  ┌──────────────────┐  ┌──────────────────────┐      │
│  │ApiForecast       │  │CachedForecast        │      │
│  │Repository (REST) │  │Repository (SQLite)   │      │
│  └──────────────────┘  └──────────────────────┘      │
└─────────────────────────┬────────────────────────────┘
                          │ (Hydrates & Persists)
┌─────────────────────────▼────────────────────────────┐
│                    Storage Engine                    │
│  ┌──────────────────┐  ┌──────────────────────┐      │
│  │AsyncStorage      │  │Expo SQLite           │      │
│  │(Settings/Keys)   │  │(Structured Data)     │      │
│  └──────────────────┘  └──────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| **UI/Presentation** | React Components + i18n | Renders UI, uses translation keys, handles user interactions. |
| **State (Client)** | Zustand | Manages UI state (theme, unit system, language, local preferences). |
| **State (Server)** | React Query | Manages in-memory cache, re-fetching, and offline synchronization strategy. |
| **Application Logic** | Custom Hooks | Orchestrates data fetching, combines stores, prepares data for UI. |
| **Data Abstraction** | Repository Pattern | Abstracts data sources. Prioritizes local cache (SQLite) before fetching (REST) for an offline-first experience. |
| **Storage Engine** | AsyncStorage & Expo SQLite | Physical persistence layer. AsyncStorage for simple keys; SQLite for robust, queryable relational weather data. |
| **Localization** | i18next | Handles translations and internationalization. |