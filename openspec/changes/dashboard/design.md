## Context

The dashboard is the last feature to build because it depends on all four modules delivering their scores to the store. At this point the app has all its content — the dashboard just needs to surface it clearly. The root `+layout.svelte` is also built here: it initializes the audio engine's sample loading, applies the dark theme, and provides navigation. The exercise `+layout.svelte` may already exist from the decibel-training build; if so, it just needs polish.

## Goals / Non-Goals

**Goals:**
- Four module cards in a responsive grid with live accuracy and streak from scores store
- Overall stats (total attempts, total points, cross-module accuracy)
- Root layout with nav, dark theme, and `onMount` audio preloading
- Empty state for first-time users (no scores yet)

**Non-Goals:**
- Charts or graphs of score history (phase-2 `/stats` page)
- Module sorting or filtering
- Session replay or exercise history browser

## Decisions

**`ModuleCard` reads scores store internally (not via props)**
The card receives a `moduleId` prop and looks up `scores.getModuleScore(moduleId)` internally. This avoids the dashboard page computing and threading score data into each card, and means the card always reflects live state. Alternative (passing score as a prop) would require the dashboard to subscribe to all four module scores — verbose for no benefit.

**Audio preloading in root layout's `onMount`**
The root `+layout.svelte` calls `audioEngine.loadSamples(ALL_SAMPLE_IDS)` in `onMount`. This runs on every page load, so samples are ready before the user navigates to any exercise. Preloading in the exercise page itself would cause a loading delay on first Play click. `onMount` runs client-side only (consistent with `ssr = false`).

**DAW rack UI metaphor for module cards**
Each card is styled to evoke a hardware rack module — dark panel, subtle embossed border, indicator lights (streak dot), and a channel-strip-style layout. This reinforces the professional tool aesthetic. Implementation uses Tailwind only — no SVG illustrations initially; emoji or Unicode characters can serve as temporary module icons (🎚 🎛 📊 🎵).

**Empty state is minimal — just zeroed stats**
New users see "0%" accuracy and no streak, with a Start button. There is no onboarding flow. The experience is self-explanatory for sound engineers.

## Risks / Trade-offs

If audio samples fail to load (network error, missing file), the engine's `isLoaded` state will remain `false`. The exercise pages should disable the Play button and show a loading indicator while `!isLoaded` — this should be checked during exercise build phases but surfaced here if missed.

Root layout `onMount` runs on every page, including exercise pages. The `loadSamples` call should be idempotent — if buffers are already cached, it should return immediately without re-fetching.
