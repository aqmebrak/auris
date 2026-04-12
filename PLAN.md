# Auris — Development Plan

Iterative, phase-based. Each phase is a logical unit of shippable work.
Check items off as they land on `main`.

---

## Phase 1 — Foundation & Frequency ID MVP ✅

Core infrastructure + first working game.

- [x] SvelteKit + Svelte 5 scaffold
- [x] Tailwind v4 + shadcn-svelte component library
- [x] Dark monochrome theme (oklch tokens)
- [x] Top-bar navigation
- [x] Dashboard with game card grid
- [x] Stats panel (localStorage persistence)
- [x] Frequency ID game — state machine (`idle → guessing → roundResult → gameOver`)
- [x] FrequencyIdEngine — Web Audio API, A/B routing (dry vs peaking EQ), WAV buffer cache
- [x] FreqStrip — logarithmic frequency selector, touch + mouse
- [x] A/B toggle component
- [x] Playwright e2e — dashboard card grid

---

## Phase 2 — UI polish + Game UX fixes ✅

Fixes found during first playthrough on a 33" screen.

- [x] Neon fuchsia primary accent `oklch(0.7 0.28 340)` applied to primary elements
- [x] Layout widened to `max-w-7xl` (top-bar, dashboard, game page)
- [x] Game card button spacing — breathing room, centered PLAY (fuchsia), no `w-full` stretch
- [x] Stats panel — larger numbers (`text-3xl`), bolder labels
- [x] FreqStrip — taller (`min-h-55`), ±1/3 octave margin-of-error band on hover, fuchsia cursor
- [x] Game page — play/pause, A/B toggle, REPLAY button wired to engine
- [x] Remove `listening…` intermediate phase — PLAY → guessing directly
- [x] Hide BOOST/CUT + dB during guessing; reveal in round result as learning feedback
- [x] WAV music samples replace pink noise (7 rock/metal/drum tracks)
- [x] Delete dead `src/lib/audio.ts` (pink-noise engine)
- [x] `pnpm check` + `pnpm lint` + `pnpm test:e2e` all green

---

## Phase 3 — Generic game engine foundation ✅

Build a reusable game framework so every new ear-training exercise plugs in without reinventing round/score/audio/persistence logic. Goal: adding a new game = define game-specific config + UI, nothing else.

### 3.1 — Game core (`src/lib/game/`)

Pure, game-agnostic primitives.

- [x] `src/lib/game/types.ts` — generic types: `GameConfig<TRound, TGuess>`, `GameSession<TRound>`, `RoundBase<TGuess>`, `Phase = 'idle' | 'playing' | 'roundResult' | 'gameOver'`
- [x] `src/lib/game/session.ts` — pure functions: `createSession`, `startRound`, `submitGuess`, `nextRound`, `scoreSession` (all typed over `TRound`, with `NoInfer<TGuess>` for clean call sites)
- [x] `src/lib/game/config.ts` — `defineGame` helper for type-inferred config definition

### 3.2 — Game state store (`src/lib/stores/`)

Svelte 5 rune-based stores, one generic factory.

- [x] `src/lib/stores/game-store.svelte.ts` — `createGameStore<TR, TG>(config)` returns reactive `{ session, phase, currentRound, roundIndex, totalRounds, score, isLastRound, start, submit, next, reset }`
- [x] `src/lib/stores/stats-store.svelte.ts` — `createStatsStore(gameId)` — per-game localStorage persistence (`auris:stats:{gameId}`), reactive reads for dashboard, `record(score)` / `refresh()` / `reset()`
- [x] `stats-panel.svelte` rewired to `createStatsStore('freq-id')`; old `stats.ts` deleted

### 3.3 — Audio engine abstraction (`src/lib/audio/`)

Split the monolithic `FrequencyIdEngine` into composable pieces.

- [x] `src/lib/audio/player.ts` — `AudioPlayer` class: load/cache WAV, pause/resume, SSR-safe context lifecycle. Game-agnostic.
- [x] `src/lib/audio/effects.ts` — effect node factories: `createPeakingEq` (+ typed `PeakingEqHandle` with `setFilter`), `createCompressor`, `createPanner`
- [x] `src/lib/audio/chain.ts` — `AudioChain` class: connects `source → effect₁ → … → effectₙ → destination`, lazy-builds on `load()`, supports A/B (dry vs effects-path) via `setMode`
- [x] `src/lib/audio/samples.ts` — centralized WAV sample list + `pickTrack()`
- [x] Old `frequency-id-engine.ts` deleted (superseded by AudioChain)

### 3.4 — Shared game UI (`src/lib/components/game/`)

- [x] `src/lib/components/game/game-header.svelte` — score + round counter, phase-aware
- [x] `src/lib/components/game/playback-controls.svelte` — play/pause + A/B + replay
- [x] `src/lib/components/game/game-over.svelte` — generic `<TRound>` with `formatRound` callback returning `{ label, primary, secondary, result }`
- [x] `src/lib/components/game/round-result.svelte` — generic `<TRound>` with `summary` + `visual` snippet props for game-specific feedback

### 3.5 — Refactor Frequency ID onto the new engine

Prove the abstraction by porting the existing game.

- [x] `src/lib/games/freq-id/config.ts` — `FreqIdRound` + `freqIdConfig`
- [x] `src/lib/games/freq-id/audio.ts` — `createFreqIdAudio()` builds `AudioChain` with one `createPeakingEq`
- [x] `src/routes/games/frequency-id/+page.svelte` — thin: instantiates stores + audio, renders shared game UI + game-specific `FreqStrip`
- [x] All existing tests still pass; no regression in gameplay

### 3.6 — Verify + document

- [x] `pnpm check` + `pnpm lint` + `pnpm test:unit` + `pnpm test:e2e` — all green
- [x] `src/lib/game/README.md` — how to add a new game (checklist: config, audio chain, UI, register)

---

## Phase 4 — Frequency ID depth

Make the game more educational and replayable. Now trivial because engine handles round/score/stats; just extend the config.

- [ ] **Difficulty levels** — Easy (±1 octave margin, ±6 dB), Medium (±1/3 oct, ±12 dB), Hard (±1/4 oct, ±6 dB)
- [ ] **Frequency zones** — let user practice specific bands (lows, mids, highs) instead of full 20–20k
- [ ] **Gain variety** — randomise dB between 6 / 9 / 12 instead of fixed ±12
- [ ] **Stats persistence** — track per-frequency-zone accuracy over time, show heatmap on dashboard
- [ ] **Round count config** — 3 / 5 / 10 rounds per session
- [ ] **Result animation** — brief pulse on correct guess (green glow), shake on wrong

---

## Phase 5 — Second game

New ear-training exercise. Run `/prd` to spec it out before implementation.

- [ ] **Dynamic EQ** — identify whether EQ boost is on attack, sustain, or tail of a transient
- [ ] **Level matching** — match two signals by ear (volume training)
- [ ] **Reverb type ID** — identify hall / room / plate / spring by listening
- [ ] **Compression ratio ID** — hear heavily vs. lightly compressed and match

Pick one. Write PRD first.

---

## Phase 6 — Auth + Cloud sync

Currently all state is localStorage. Add optional account for cross-device sync.

- [ ] Drizzle schema: `users`, `sessions`, `game_results`
- [ ] Auth (Lucia or better-auth)
- [ ] Sync stats to DB on game-over
- [ ] Dashboard: show lifetime stats from DB when logged in

---

## Phase 7 — Polish & Deploy

- [ ] PWA manifest + service worker (offline WAV caching)
- [ ] `og:image` + metadata for sharing
- [ ] Vercel analytics
- [ ] Lighthouse audit — target 95+ performance, 100 a11y
- [ ] README with setup instructions
