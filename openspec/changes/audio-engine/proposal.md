## Why

Auris needs a reliable, browser-native audio playback layer before any exercise module can be built. Without a centralized audio engine, every exercise page would reinvent AudioContext management, buffer loading, and A/B switching — leading to duplicated logic, timing bugs, and inconsistent playback behavior across modules.

## What Changes

- Introduce a singleton `AudioContext` managed lazily on first user gesture (required by browser autoplay policy)
- Add a buffer cache: fetch bundled MP3 samples from `static/samples/`, decode via `decodeAudioData()`, and store in a `Map<string, AudioBuffer>`
- Expose `play()`, `stop()`, `playWithEffect()`, and `toggleAB()` methods with reactive state (`$state` via Svelte 5 runes)
- Add a permanent master `GainNode` between all processing and `destination` for volume control
- Add pure effect factory functions: `createGainEffect`, `createEQEffect`, `createPanEffect`, `createCompressorEffect`
- Add math utilities: `dbToLinear`, `linearToDb`, `randomInRange`, `randomChoice`, `clamp`

## Capabilities

### New Capabilities
- `audio-engine`: Singleton AudioContext lifecycle, buffer loading/caching, A/B playback with pluggable effect chains, master volume control
- `audio-effects`: Pure factory functions that build Web Audio API node chains for each exercise module type
- `audio-utils`: Math helpers for dB conversion, random parameter generation, and value clamping

### Modified Capabilities
<!-- none -->

## Impact

- All four exercise modules (decibel, eq, panning, compression) depend on this
- No npm dependencies required — Web Audio API is browser-native
- Files: `src/lib/audio/engine.svelte.ts`, `src/lib/audio/effects.svelte.ts`, `src/lib/audio/utils.ts`
- Bundled audio samples must exist in `static/samples/` before first load
