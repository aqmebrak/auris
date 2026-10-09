# Auris — Progress Log

One entry per session. Most recent first.

---

## 2026-10-09 — Phase 17: progression & dashboard

| Item | Files touched |
|------|--------------|
| Game registry (single source: id, route, category); test that every route is registered | `src/lib/games/registry.ts` |
| Pure stats helpers: legacy-safe accuracy, summaries, difficulty suggestion, recommendation | `src/lib/stats.ts` |
| Dashboard v2: summary + "practise next", categories, per-game sparkline cards; old FreqId-only panel removed | `src/routes/+page.svelte`, `game-card`, `dashboard-summary`, `sparkline` |
| Difficulty suggestion line + one-click apply on every game page (fixed height, layout-stable) | `game-shell.svelte` |
| Controller `onOptionsChange` hook (EQ Matching / Dynamics resets now fire for shell-applied changes) | `game-controller.svelte.ts`, pages |
| 158 unit, 54 E2E (dashboard from seeded storage, suggestions) | |

**Left in Phase 17:** daily mix (cross-game session) and generalising the Freq ID heatmap (also fits Filter Finder).
**Next:** Level Change Hard tier; Phase 16 stem-based games when samples arrive.

---

## 2026-10-07 — Phase 16 #4: Phase / Comb

| Item | Files touched |
|------|--------------|
| `combResponseDb`; `createComb` effect (verified in Chromium) | `audio/eq-math.ts`, `audio/effects.ts` |
| `AudioPlayer.load(url, { mono })` (cached mono fold-down); `createCompensatedPlayable({ mono })` | `audio/player.ts`, `chain.ts`, `compensated-chain.ts` |
| Phase/Comb game: Type (comb vs polarity-flipped) and Delay modes × 3 difficulties | `src/lib/games/phase-comb/*`, route |
| 140 unit, 50 E2E | |

**Next:** Phase 16 remaining (Room Reader, Delay Time, Saturation, Instrument Spotlight) need dry stems/BPM. Then Phase 17 progression, or Level Change Hard tier.

---

## 2026-10-06 — Phase 16 #5: Stereo Width

| Item | Files touched |
|------|--------------|
| `sideToMidDb`; `sideDb` in analysis; `pnpm samples --reanalyze` (from FLACs) | `audio/loudness.ts`, `scripts/prepare-samples.ts`, `library.json` |
| `minSideDb` filter | `audio/library.ts` |
| `createStereoWidth` M/S effect (verified exact in Chromium) | `audio/effects.ts` |
| Stereo Width game (Easy/Medium/Hard width choices), power compensation | `src/lib/games/stereo-width/*`, route |
| 132 unit, 44 E2E | |

Finding: `rockin` and `rock-seq` are **dual-mono** "stereo" files (side −60 dB) — excluded from width questions by `minSideDb: −20`.

**Next:** Phase 16 #4 Phase/Comb.

---

## 2026-10-06 — Phase 16 #1: Filter Finder

| Item | Files touched |
|------|--------------|
| Pass-filter math (RBJ high/low-pass, Butterworth 12/24 dB/oct), `qToDb` | `src/lib/audio/eq-math.ts` |
| Generic loudness compensation (`loudnessDeltaDb`, `compensationFromResponse`) | `src/lib/audio/spectrum.ts` |
| `audibleCutoffs` (energy must exist in the removed region) | `src/lib/audio/library.ts` |
| `createPassFilter` effect; `createCompensatedPlayable` (shared with Freq ID) | `audio/effects.ts`, `audio/compensated-chain.ts` |
| Filter Finder game: High-pass / Low-pass / Mixed, 3 difficulties, graded octave error | `src/lib/games/filter-finder/*`, `src/routes/games/filter-finder/` |
| `freqScore` moved to `frequency.ts` | `src/lib/frequency.ts` |
| Fixed Button's `resolve()` typing breaking at 8+ routes | `ui/button/button.svelte` |
| 123 unit, 41 E2E (session + layout for 2 new configs); filter cascade verified in Chromium | |

**Next:** Phase 16 #4 Phase/Comb, #5 Stereo Width (work on mixes), then #2/#3/#6/#7 as samples arrive.

---

## 2026-10-04 — UX consistency across game states

| Item | Files touched |
|------|--------------|
| Single `board(round, ui)` snippet per game, rendered in idle/playing/result; `BoardState` flags (interactive/revealed) | `src/lib/game/board.ts`, all 6 game pages |
| Shell: options always rendered (locked after start), fixed-height hint (grid-stacked texts), result banner under the board, transport always present | `game-shell.svelte`, `transport-bar.svelte`, `result-banner.svelte` |
| `.is-locked` utility; `masked` DbChoice/EqChoice; `cursor-pointer`/`not-allowed` on toggle + choice buttons | `layout.css`, components |
| Controller drops focus on submit/next (board persists, so Enter/Space shortcuts kept dying on the focused strip) | `game-controller.svelte.ts` |
| Result banner scrolls into view above the sticky bar; option rows wrap on mobile | shell, `option-group` |
| Layout-stability E2E: options/hint/board position+size and transport height across 4 states, 9 game configs × desktop/mobile | `layout.e2e.ts`, `game-fixtures.ts` |

35 E2E, 109 unit.

**Next:** Phase 16 new exercises (Filter Finder first), or Level Change Hard tier.

---

## 2026-10-04 — Sample-aware targets

| Item | Files touched |
|------|--------------|
| `isAudible`, null-safe `audibleFreqs` | `src/lib/audio/library.ts` |
| Rounds pick the sample first, then boost/cut frequencies it can reveal | `games/{eq-matching,eq-guess,freq-id}/config.ts` |
| EQ Guess distractors also move bands to audible places (easy/medium) / flip an audible band (hard) | `games/eq-guess/config.ts` |
| 10 new tests with a synthetic bass-only sample (109 unit total) | `src/lib/games/sample-aware.test.ts` |

On the current 8 tracks only the drum loop (cuts: 125/250 Hz) and housing loop (cuts: 125/250 Hz) are restricted; dense mixes have energy everywhere. Bigger effect once dry stems arrive.

**Next:** UX consistency pass (no layout shift between states, cursor-pointer).

---

## 2026-10-04 — Phase 13: sample library

| Item | Files touched |
|------|--------------|
| `pnpm samples`: ffmpeg-static two-pass loudnorm → FLAC, analysis, manifest, credits | `scripts/prepare-samples.ts`, `scripts/README.md`, `scripts/sample-meta.json` |
| Typed library: naming parser, filters, `pickSample`, `bandRelDb`, `audibleFreqs` | `src/lib/audio/library.ts`, `library.json` (generated) |
| Existing 8 tracks renamed to the convention, re-encoded (46 → 30 MB); raw copies in gitignored `samples-src/` | `static/audio/*.flac` |
| Next-round sample preload | `audio/player.ts`, `chain.ts`, `game-controller` |
| New dev deps: `ffmpeg-static`, `tsx` | `package.json`, `pnpm-workspace.yaml` |

**Next:** sample-aware targets in EQ Matching / EQ Guess / Freq ID (use `audibleFreqs`), then UX consistency pass.

---

## 2026-10-03 — Phase 15: Freq ID + Panning reworks

| Item | Files touched |
|------|--------------|
| Freq ID: Easy octave-band buttons (boost-only, Q 1.4), per-difficulty Q/gain/cuts, graded octave-error score, loudness compensation | `src/lib/games/freq-id/*`, page |
| Panning: mono-sum source, Easy snap-position buttons, graded by distance | `src/lib/games/panning/*`, `audio/effects.ts` (`createMonoSum`), page |
| Shared `monoMix` + `compensationGainDb` (deduped from EQ Matching) | `src/lib/audio/spectrum.ts` |
| 91 unit tests, 13 E2E (both input styles per game) | |

**Next:** Level Change Hard JND tier + loudness-normalised samples; Phase 13 sample tooling; Phase 16 new exercises.

---

## 2026-10-03 — Phase 15: Dynamics

| Item | Files touched |
|------|--------------|
| Compressor DSP (soft knee, attack/release smoothing, stereo-linked), auto makeup, threshold-from-level | `src/lib/audio/compressor-dsp.ts` (+15 tests) |
| AudioWorklet + node factory (`?worker&url`, bundles to self-contained IIFE) | `src/lib/audio/worklets/compressor.worklet.ts`, `compressor-node.ts` |
| `DynamicsAudio` dual-path engine (each path bypass or compressed) | `src/lib/games/dynamics/audio.ts` |
| Dynamics config: 5 modes × 3 difficulties, graded match | `src/lib/games/dynamics/config.ts` (+tests) |
| Page, `ChoiceButtons`, `CompressorPanel`, `DynamicsMatchResult` | `src/routes/games/dynamics/`, `src/lib/components/` |
| Removed Compressorist + coming-soon card; dashboard now has Dynamics | `src/routes/+page.svelte` |
| E2E for all 5 modes (+ no page errors); worklet verified in Chromium (-12.7 dB GR vs -13.5 theory) | `src/routes/games/games.e2e.ts` |

**Next:** Freq ID / Panning reworks, or Phase 13 sample tooling.

---

## 2026-10-02 — Phase 15: EQ Matching v2

| Item | Files touched |
|------|--------------|
| Exact peaking-EQ response + `matchScore` + `logGrid` | `src/lib/audio/eq-math.ts` |
| Average spectrum (FFT) + `eqLoudnessDeltaDb` | `src/lib/audio/spectrum.ts` |
| EQ Matching: graded scoring, Q fixed on easy/medium, per-path loudness compensation | `src/lib/games/eq-matching/{config,audio}.ts` |
| Page rebuilt on shell; `EqBandKnobs`, `EqMatchResult`; `EqCurve` uses exact math + overlay | `src/routes/games/eq-matching/`, `src/lib/components/` |
| Graded display (`% match`, session accuracy) in shared result/game-over | `src/lib/components/game/*` |
| 58 unit tests, 6 E2E | |

**Next:** Phase 15 Dynamics (replaces Compressorist), Freq ID/Panning reworks; or Phase 13 sample tooling.

---

## 2026-10-02 — Engine v2 part 2: controller + shell

| Item | Files touched |
|------|--------------|
| `createGameController`, `Playable`, key mapping | `src/lib/stores/game-controller.svelte.ts`, `src/lib/audio/playable.ts`, `src/lib/game/keys.ts` |
| `<GameShell>`, `<OptionGroup>`, option builders | `src/lib/components/game/*`, `src/lib/game/options.ts` |
| Ported Freq ID, Panning, dB Change, EQ Guess (394→~110 lines avg) | `src/routes/games/*/+page.svelte` |
| **Bug fixed:** Level Change cards ignored clicks (inverted guard) | `src/lib/components/db-choice.svelte` |
| E2E: full 3-round session per ported game | `src/routes/games/**/*.e2e.ts` |

**Next:** Phase 13 sample tooling, or Phase 15 reworks (EQ Matching, Dynamics) on the shell.

---

## 2026-10-02 — Engine v2 part 1 (Phase 14) + EQ Guess fix

| Item | Files touched |
|------|--------------|
| Graded scoring: `scoreGuess`/`passThreshold`, `RoundBase.score`, `accuracySession`, store `accuracy` | `src/lib/game/*`, `src/lib/stores/*` |
| Stats entries carry optional `accuracy` | `src/lib/stores/stats-store.svelte.ts` |
| Loudness math (`rmsDb`, `compensationDb`) | `src/lib/audio/loudness.ts` |
| EQ Guess sign tell removed, per-difficulty distractors | `src/lib/games/eq-guess/config.ts` |
| Unit tests: 34 total (session, loudness, all game configs); vitest `$lib` alias | `*.test.ts`, `vitest.config.ts` |

**Next:** `createGameController` + `<GameShell>`, port Freq ID as reference.

---

## 2026-10-02 — Assessment + roadmap (Phases 13–17)

| Item | Files touched |
|------|--------------|
| Deps minor/patch (vite 8.3.2, vite-plugin-svelte 7.3.1, prettier 3.9.9, ts-eslint 8.71, globals 17.13, neon 1.2) | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` |
| Stale dashboard E2E (expected 3 cards) made data-agnostic | `src/routes/dashboard.e2e.ts` |
| CLAUDE.md: real stack, unit tests in gates, planning files, dep policy | `CLAUDE.md` |
| Removed unused Drizzle/Neon/Better Auth scaffold | `package.json`, `svelte.config.js`, `src/lib/server/` |
| Plan retargeted to rock/metal mixing engineers | `task_plan.md`, `CLAUDE.md` |
| Assessment (P1–P10) + roadmap: sample lib v2, engine v2, rework, 7 new games, progression | `task_plan.md` |

`pnpm check` ✅ `pnpm lint` ✅ `pnpm test:unit` ✅ `pnpm test:e2e` ✅

**Next:** Phase 14 engine v2 + Phase 15 EQ Guess tell fix.

---

## 2026-04-12 — EQ Matching complete (Phase 10)

| Item | Files touched |
|------|--------------|
| `formatQ` helper | `src/lib/format.ts` |
| Config — FREQ/GAIN/Q steps, defaultBands, evaluateGuess | `src/lib/games/eq-matching/config.ts` |
| Dual BiquadFilterNode chains (3 slots per path, like Compressorist) | `src/lib/games/eq-matching/audio.ts` |
| Game page — live EqCurve + per-band knob groups + result table + side-by-side curves | `src/routes/games/eq-matching/+page.svelte` |
| Dashboard — `available: false` → `true` | `src/routes/+page.svelte` |

`pnpm check` ✅ `pnpm lint` ✅

---

## 2026-04-12 — EQ Guess + Compressorist GR fix (Phase 7)

| Item | Files touched |
|------|--------------|
| GR meter hidden in B mode (1-line fix) | `src/routes/games/compressorist/+page.svelte` |
| EQ Guess config — types, difficulty, round/distractor gen | `src/lib/games/eq-guess/config.ts` |
| EQ Guess audio — 4-slot AudioChain | `src/lib/games/eq-guess/audio.ts` |
| EQ curve SVG (Gaussian bell approx, fuchsia) | `src/lib/components/eq-curve.svelte` |
| EQ choice 2-card component | `src/lib/components/eq-choice.svelte` |
| EQ Guess game page | `src/routes/games/eq-guess/+page.svelte` |
| Dashboard registration | `src/routes/+page.svelte` |

`pnpm check` ✅ `pnpm lint` ✅

---

## 2026-04-12 — Compressorist complete (Phase 6)

**Completed:** Compressorist game — SSL 4000-style compression ear training.

| Item | Files touched |
|------|--------------|
| Format helpers (attack/release/ratio/makeup) | `src/lib/format.ts` |
| Game config, param steps, difficulty tolerance | `src/lib/games/compressorist/config.ts` |
| Custom dual-chain audio (not AudioChain) | `src/lib/games/compressorist/audio.ts` |
| SVG knob — pointer drag, wheel, arrow keys | `src/lib/components/knob.svelte` |
| LED GR meter — 20 segments, green/yellow/red, rAF | `src/lib/components/gr-meter.svelte` |
| SSL panel game page | `src/routes/games/compressorist/+page.svelte` |
| Dashboard registration | `src/routes/+page.svelte` |
| `varsIgnorePattern: '^_'` in eslint | `eslint.config.js` |

Fixes during lint pass: `$derived(() => {...})` → inline expression in knob.svelte; stale `svelte-ignore` removed; `{#each}` rewritten to avoid unused item var.

`pnpm check` ✅ `pnpm lint` ✅

---

## 2026-04-12 — Phase 5 complete

**Completed:** Panning ID game — second ear-training exercise.

| Item | Files touched |
|------|--------------|
| `formatPan()` helper | `src/lib/format.ts` |
| Panning config + round type | `src/lib/games/panning/config.ts` |
| Panning audio (StereoPanner) | `src/lib/games/panning/audio.ts` |
| StereoStrip component | `src/lib/components/stereo-strip.svelte` |
| Panning game page | `src/routes/games/panning/+page.svelte` |
| Dashboard registration | `src/routes/+page.svelte` |
| Add `.wolf/` + planning files to prettier/eslint ignore | `.prettierignore`, `eslint.config.js` |

`pnpm check` ✅ `pnpm lint` ✅

**Next:** Phase 6 — Auth + Cloud sync (or choose to skip to Phase 7).

---

## 2026-04-12 — Phase 4 complete

**Completed:** All 6 Phase 4 tasks.

| Item | Files touched |
|------|--------------|
| Difficulty levels (Easy/Medium/Hard) | `src/lib/games/freq-id/config.ts` |
| Frequency zones (Full/Lows/Mids/Highs) | `src/lib/games/freq-id/config.ts`, `src/lib/frequency.ts` |
| Gain variety (6/9/12 dB random) | `src/lib/games/freq-id/config.ts` |
| FreqStrip range-aware props | `src/lib/components/freq-strip.svelte` |
| Result animations (pulse/shake) | `src/routes/layout.css`, `src/lib/components/game/round-result.svelte` |
| Per-band accuracy heatmap | `src/lib/components/freq-id-heatmap.svelte`, `src/lib/components/stats-panel.svelte` |
| Options UI (idle screen selectors) | `src/routes/games/frequency-id/+page.svelte` |
| Stats meta extension | `src/lib/stores/stats-store.svelte.ts` |

`pnpm check` ✅ `pnpm lint` ✅

**Next:** Phase 5 — pick second game type, write PRD.

---

## 2026-04-12 — Phase 3 complete

**Completed:** Generic game engine — types, session helpers, store factory, audio abstraction, shared game UI, freq-id ported.

**Next:** Phase 4 — Frequency ID depth.

---

## 2026-04-12 — Phase 2 complete

**Completed:** UI polish — fuchsia accent, wider layout, improved FreqStrip, WAV samples, dead code removed.

---

## 2026-04-12 — Phase 1 complete

**Completed:** Foundation — SvelteKit scaffold, Tailwind, dark theme, dashboard, Frequency ID MVP.
