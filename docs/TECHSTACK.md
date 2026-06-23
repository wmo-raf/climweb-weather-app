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
* **Server State**: **React Query** (`@tanstack/react-query`)
  * Handles data fetching, caching, synchronization, and updating of server state.
  * Manages background updates, stale data, and loading/error states out of the box, significantly reducing boilerplate code in the application layer.

## 3. Storage
* **Local Storage**: **MMKV** (`react-native-mmkv`)
  * An extremely fast, synchronous key-value storage engine natively written in C++.
  * *Use cases*: Persistent client-side storage, such as user settings, fast-loading preferences, and caching layer for repositories.

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
│                    Data Layer                        │
│  ┌──────────────────┐  ┌──────────────────────┐      │
│  │ApiForecast       │  │CachedForecast        │      │
│  │Repository (REST) │  │Repository (MMKV)     │      │
│  └──────────────────┘  └──────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Technology | Responsibility |
| :--- | :--- | :--- |
| **UI/Presentation** | React Components + i18n | Renders UI, uses translation keys, handles user interactions. |
| **State (Client)** | Zustand | Manages UI state (theme, unit system, language, local preferences). |
| **State (Server)** | React Query | Manages cache, re-fetching, loading/error states for server data. |
| **Application Logic** | Custom Hooks | Orchestrates data fetching, combines stores, prepares data for UI. |
| **Data Abstraction** | Repository Pattern | Abstracts data sources, implements caching strategy using domain interfaces. |
| **Storage** | MMKV | Persistent client-side storage (settings, cache, language). |
| **Localization** | i18next | Handles translations and internationalization. |