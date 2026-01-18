# Helper Extension (Хелпер) - Development Reference

**Version**: 3.0
**Type**: Chrome/Firefox Browser Extension
**Repository**: https://github.com/JohnBra/vite-web-extension

## Project Overview

A browser extension designed to assist telecom operators with their daily work, specifically integrating with the ARM (
ertelecom.ru) billing system, Genesys call center platform, and Line messenger.

The extension enhances existing telecom systems by adding productivity features like one-click copying, client card
management, compensation processing, and UI improvements.

## Tech Stack

- **Build System**: Vite 7.3.0
- **Frontend**: React 19.2.3 + TypeScript 5.9.3
- **Styling**: Tailwind CSS 4.1.18
- **Extension Framework**: @crxjs/vite-plugin 2.3.0
- **Cross-browser**: webextension-polyfill 0.12.0
- **Code Quality**: Biome 0.3.3 (linting/formatting)
- **Dev Tools**: Nodemon 3.1.11 (hot reload)

## Development Scripts

```bash
# Development (with hot reload)
npm run dev              # Chrome (default)
npm run dev:chrome       # Chrome
npm run dev:firefox      # Firefox

# Production builds
npm run build            # Chrome (default)
npm run build:chrome     # Chrome
npm run build:firefox    # Firefox

# Code quality
npm run format           # Biome format
npm run check            # Biome check
npm run lint             # Biome lint
```

## Directory Structure

```
src/
├── pages/
│   ├── background/              # Service worker (background scripts)
│   ├── content/                 # Content scripts for third-party sites
│   │   ├── arm/                # ARM billing system integration
│   │   │   ├── features/       # Feature modules (anticipation, copy, network, etc.)
│   │   │   │   ├── anticipation/
│   │   │   │   ├── compensation/
│   │   │   │   ├── copy-client-card/
│   │   │   │   ├── network-info/
│   │   │   │   └── ...
│   │   │   ├── ui/             # UI components for ARM
│   │   │   └── index.ts        # ARM module initializer
│   │   ├── genesys/            # Genesys call center integration
│   │   │   ├── features/       # Chat customization, content management
│   │   │   └── index.ts
│   │   ├── line/               # Line messenger integration
│   │   └── index.ts            # Content script entry point
│   ├── devtools/               # Developer tools panel
│   ├── newtab/                 # Custom new tab page
│   ├── options/                # Extension settings/options page
│   └── popup/                  # Extension popup UI
├── shared/                     # Shared utilities and types
│   ├── browser/                # Browser API wrappers
│   └── types/                  # TypeScript type definitions
└── modules/                    # Additional modules (notifications, etc.)

public/                         # Static assets (icons, images)
locales/                        # i18n translation files (optional)
```

## Key Architecture Patterns

### Content Script System

The extension uses a sophisticated modular content script system:

1. **Singleton Initialization**: Each system (ARM/Genesys/Line) has a singleton initializer to prevent duplicate
   injections
2. **Feature-Based Organization**: Features are organized by domain and functionality
3. **URL Pattern Matching**: Features activate based on current page URL patterns
4. **Smart Loading**: Content scripts only load when matching specific URL patterns

### Message Routing

Communication between content scripts and background service worker:

- Content scripts send messages via `chrome.runtime.sendMessage()`
- Background worker handles API calls and returns responses
- Email sending and MAC address lookup handled in background

### Build Configuration

- **vite.config.base.ts**: Shared settings (Tailwind, TypeScript paths, custom plugins)
- **vite.config.chrome.ts**: Chrome-specific manifest and settings
- **vite.config.firefox.ts**: Firefox-specific settings
- **Custom plugins**: `stripDevIcons` (removes dev icons from prod), `crxI18n` (i18n support)

## Main Modules

### ARM Module (`src/pages/content/arm/`)

Primary integration with the telecom billing system. Features include:

- **Client Card**: Copy and email client information
- **Network Info**: Copy IP/MAC addresses
- **Compensation**: Process compensation claims
- **UI Enhancements**: Add copy buttons, display agreements
- **Anticipation**: Folding and anticipation features

Key files:

- `index.ts`: Module initializer with singleton pattern
- `features/*/index.ts`: Feature entry points with URL pattern matching

### Genesys Module (`src/pages/content/genesys/`)

Call center system integration with features for:

- Chat customization (colors, sounds, layout)
- Chat content management
- UI enhancements for call center workflows

### Background Service (`src/pages/background/`)

Handles background tasks:

- Email sending via external API
- MAC address vendor lookup with caching
- Message routing between components

## Permissions & Host Access

### Permissions

- `activeTab`: Access current tab
- `tabs`: Tab management
- `storage`: Settings persistence
- `management`: Extension management
- `contextMenus`: Right-click menu
- `browsingData`: Clear browsing data

### Host Permissions

- `*://*.ertelecom.ru/*` - Main ARM system
- `https://helper.chrsnv.ru/*` - Extension backend API
- `https://api.allorigins.win/*` - CORS proxy

## Development Workflow

1. **Development Mode**: Run `npm run dev:chrome` or `npm run dev:firefox`
2. **Load Extension**:
    - Chrome: Load unpacked from `dist_chrome/` at `chrome://extensions`
    - Firefox: Load temporary from `dist_firefox/` at `about:debugging`
3. **Hot Reload**: Changes trigger automatic rebuild, just reload the extension
4. **Build**: Run `npm run build:chrome` or `npm run build:firefox` for production

## Code Conventions

1. **TypeScript**: Strict typing throughout, use shared types from `src/shared/types/`
2. **Feature Organization**: Each feature is self-contained with its own entry point
3. **URL Pattern Matching**: Use URL patterns to control feature activation
4. **Error Handling**: Comprehensive try-catch blocks with proper error logging
5. **Caching**: Cache expensive operations (e.g., MAC address lookups)
6. **Modular Design**: Features can be enabled/disabled independently
7. **Biome Formatting**: Run `npm run check` before committing

## Adding New Features

1. Create feature directory in appropriate system module (e.g., `src/pages/content/arm/features/my-feature/`)
2. Create `index.ts` with URL pattern matching and initialization logic
3. Import and register in the system's main `index.ts`
4. Add any UI components to the system's `ui/` directory
5. Test by loading extension in development mode

## Testing URL Patterns

The extension targets specific URL patterns:

- **ARM**: `*://*.ertelecom.ru/*`
- **Genesys**: Specific call center URLs
- **Line**: Line messenger URLs

## External Dependencies

- React ecosystem for UI
- Tailwind CSS for styling
- @crxjs/vite-plugin for Chrome extension build
- webextension-polyfill for cross-browser compatibility

## Important Notes

- The extension is non-intrusive - it enhances existing systems rather than replacing them
- Cross-browser compatible with Chrome and Firefox (with appropriate adaptations)
- Uses environment detection for dev vs production builds
- Settings system allows enabling/disabling features
- Performance optimized with caching and smart initialization

## Git Workflow

- Main branch: `main`
- Current working branch: `3.0`
- Recent work includes: MAC address lookup, client agreement copying, notifications module
