# Auris — Findings

Research notes, patterns, and discoveries made during development sessions.

---

## Architecture

### Game Engine Pattern
- **Config factory**: `createFreqIdConfig(options)` → `GameConfig<TRound, TGuess>` — one function, all game behaviour
- **Store factory**: `createGameStore(config)` → reactive `{ phase, currentRound, score, start, submit, next, reset }`
- **Stats factory**: `createStatsStore(gameId)` → `auris:stats:{gameId}` in localStorage, `record(score, meta?)`
- Adding a new game: define `Round` type + `GameConfig` + audio chain + UI snippets. See `src/lib/game/README.md`.

### Audio Chain
- `AudioPlayer` (load/cache WAV) → `AudioChain` (connect effects, A/B routing) → `createPeakingEq` (effect factory)
- A mode = source → destination (dry). B mode = source → filter → destination.
- All `AudioContext` code is SSR-guarded with `typeof window !== 'undefined'` or `browser` check.

### State Persistence
- Key format: `auris:stats:{gameId}` (e.g. `auris:stats:freq-id`)
- Entry shape: `{ timestamp, score, meta? }` — `meta` carries game-specific data (freq heatmap rounds, difficulty, zone)
- Stats panel reads `freqId.history` to compute per-octave-band accuracy for the heatmap

### Frequency Math
- Global: `posToFreq(x, width)`, `freqToPct(freq)` — hardcoded 20–20000 Hz
- Range-aware: `posToFreqInRange(x, width, min, max)`, `freqToPctInRange(freq, min, max)` — for zone practice
- All in `src/lib/frequency.ts`

---

## Conventions

- Svelte 5 runes only — `$state`, `$derived`, `$effect`. No `$:`.
- Business logic in `.ts`, UI in `.svelte`.
- `rtk` prefix on all bash commands (RTK token-saving proxy).
- `pnpm check` + `pnpm lint` once per story, after all code written — not mid-implementation.
- Tailwind v4 `@theme inline` tokens in `layout.css`. No `tailwind.config`.
- Animations: `@keyframes` in `layout.css`, referenced via `--animate-*` `@theme inline` tokens.

---

## Known Constraints

- `FreqStrip` `$derived` values using IIFE pattern for complex derived state (Svelte 5 requirement — `$derived` must be a direct expression, not a block)
- `createGameStore` holds the config at creation time — to change options (difficulty/zone/round count), recreate the store via `game = createGameStore(createFreqIdConfig(options))`
- Audio samples are in `static/audio/` — 8 tracks (rock/metal/drum). `pickTrack()` in `src/lib/audio/samples.ts` selects randomly.
