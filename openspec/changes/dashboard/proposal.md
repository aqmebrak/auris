## Why

Without a dashboard, users land directly in an exercise with no overview of their overall progress or quick access to other modules. The dashboard is the "home base" of Auris — it shows all four modules at a glance, surfaces progress metrics, and sets the visual tone for the entire app. It also provides the root layout and navigation that wraps every page, plus the exercise layout that wraps all exercise pages.

## What Changes

- Add `ModuleCard.svelte`: dashboard card showing module name, accuracy, streak, and Start button — reads from scores store
- Add `ProgressBar.svelte`: reusable horizontal progress bar used in module cards and potentially exercise pages
- Add `/+page.svelte`: dashboard page with a four-card grid and overall stats summary
- Add `/+layout.svelte`: root app shell with "Auris" title in top nav and links to all pages — applies dark theme wrapper; initializes audio engine sample loading in `onMount`
- Add `/exercise/+layout.svelte` (if not yet present from decibel-training): exercise chrome with back button, module title, DifficultySelector, and ScoreDisplay

## Capabilities

### New Capabilities
- `dashboard-page`: Home page displaying all four module cards with live progress from the scores store, plus overall stats
- `module-card-ui`: Rack-style card component per training module showing accuracy, streak, and navigation
- `progress-bar-ui`: Reusable visual progress indicator
- `root-layout`: App shell with navigation, dark theme, and audio engine initialization
- `exercise-layout`: Shared exercise page chrome (if not already built in decibel-training)

### Modified Capabilities
<!-- none -->

## Impact

- Depends on: all four exercise modules (decibel, eq, panning, compression) and `score-storage`
- Files: `src/lib/components/ModuleCard.svelte`, `src/lib/components/ProgressBar.svelte`, `src/routes/+page.svelte`, `src/routes/+layout.svelte`, `src/routes/+layout.ts`
- This is the last feature in the build sequence — it brings everything together
