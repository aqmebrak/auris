# Auris — Progress Log

One entry per session. Most recent first.

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
