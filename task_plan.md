# Auris — Task Plan

## Status Legend
- ✅ Complete
- 🔄 In Progress
- ⬜ Pending
- ❌ Blocked

---

## Phase 1 — Foundation & Frequency ID MVP ✅

Core infrastructure + first working game.

| Task | Status | Notes |
|------|--------|-------|
| SvelteKit + Svelte 5 scaffold | ✅ | |
| Tailwind v4 + shadcn-svelte | ✅ | |
| Dark monochrome theme (oklch tokens) | ✅ | `src/routes/layout.css` |
| Top-bar navigation | ✅ | `src/lib/components/top-bar.svelte` |
| Dashboard with game card grid | ✅ | `src/routes/+page.svelte` |
| Stats panel (localStorage) | ✅ | `src/lib/stores/stats-store.svelte.ts` |
| Frequency ID game state machine | ✅ | `src/routes/games/frequency-id/+page.svelte` |
| FrequencyIdEngine (Web Audio, A/B routing) | ✅ | `src/lib/audio/chain.ts` |
| FreqStrip (log selector, touch+mouse) | ✅ | `src/lib/components/freq-strip.svelte` |
| A/B toggle component | ✅ | `src/lib/components/ab-toggle.svelte` |
| Playwright e2e — dashboard card grid | ✅ | `src/routes/dashboard.e2e.ts` |

---

## Phase 2 — UI Polish + Game UX Fixes ✅

Fixes found during first playthrough on a 33" screen.

| Task | Status | Notes |
|------|--------|-------|
| Neon fuchsia primary accent | ✅ | `oklch(0.7 0.28 340)` |
| Layout widened to `max-w-7xl` | ✅ | |
| Game card button spacing | ✅ | |
| Stats panel — larger numbers | ✅ | `text-3xl` |
| FreqStrip — taller, ±⅓ oct band on hover | ✅ | `min-h-55` |
| Game page — play/pause, A/B, REPLAY | ✅ | |
| Remove `listening…` intermediate phase | ✅ | |
| Hide BOOST/CUT during guessing | ✅ | |
| WAV music samples (7 tracks) | ✅ | `static/audio/` |
| Delete dead `src/lib/audio.ts` | ✅ | |
| All quality checks green | ✅ | |

---

## Phase 3 — Generic Game Engine Foundation ✅

Reusable game framework so every new game plugs in without reinventing round/score/audio logic.

| Task | Status | Notes |
|------|--------|-------|
| `src/lib/game/types.ts` — generic types | ✅ | `GameConfig<TRound, TGuess>`, `Phase`, `RoundBase` |
| `src/lib/game/session.ts` — pure functions | ✅ | `createSession`, `submitGuess`, `nextRound`, `scoreSession` |
| `src/lib/game/config.ts` — `defineGame` helper | ✅ | |
| `src/lib/stores/game-store.svelte.ts` — reactive factory | ✅ | `createGameStore<TR,TG>(config)` |
| `src/lib/stores/stats-store.svelte.ts` — per-game persistence | ✅ | `auris:stats:{gameId}` |
| `src/lib/audio/player.ts` — game-agnostic audio | ✅ | |
| `src/lib/audio/effects.ts` — effect node factories | ✅ | `createPeakingEq` |
| `src/lib/audio/chain.ts` — `AudioChain` A/B routing | ✅ | |
| `src/lib/audio/samples.ts` — sample list + `pickTrack()` | ✅ | |
| Shared game UI components (`game/`) | ✅ | `game-header`, `playback-controls`, `game-over`, `round-result` |
| Freq ID ported to new engine | ✅ | `src/lib/games/freq-id/` |
| All tests pass, no regression | ✅ | |
| `src/lib/game/README.md` | ✅ | How to add a new game |

---

## Phase 4 — Frequency ID Depth ✅

More educational and replayable. Just extend the config — engine handled everything else.

| Task | Status | Notes |
|------|--------|-------|
| Difficulty levels (Easy/Medium/Hard) | ✅ | ±1 oct / ±⅓ oct / ±¼ oct margin |
| Frequency zones (Full/Lows/Mids/Highs) | ✅ | FreqStrip rescales range + ticks |
| Gain variety (6/9/12 dB random) | ✅ | |
| Stats persistence + per-band heatmap | ✅ | `freq-id-heatmap.svelte` on dashboard |
| Round count config (3/5/10) | ✅ | |
| Result animations (pulse / shake) | ✅ | CSS keyframes in `layout.css` |

---

## Phase 5 — Second Game ✅

Panning ID — hear a panned signal, guess the stereo position.

| Task | Status | Notes |
|------|--------|-------|
| Choose game type | ✅ | Panning ID |
| Implement game config + audio | ✅ | `src/lib/games/panning/config.ts`, `audio.ts` |
| StereoStrip component | ✅ | `src/lib/components/stereo-strip.svelte` |
| Implement UI | ✅ | `src/routes/games/panning/+page.svelte` |
| Register on dashboard | ✅ | `src/routes/+page.svelte` |
| Tests + quality checks | ✅ | `pnpm check` ✅ `pnpm lint` ✅ |


## Phase 7 — Compressorist ✅

SSL 4000-style compression matcher — hear target compression (B), dial in matching params (A), submit.

| Task | Status | Notes |
|------|--------|-------|
| `formatAttack/Release/Ratio/Makeup` helpers | ✅ | `src/lib/format.ts` |
| Compressorist config + types | ✅ | `src/lib/games/compressorist/config.ts` |
| Custom dual-chain audio class | ✅ | `src/lib/games/compressorist/audio.ts` — not AudioChain |
| SVG knob component (pointer drag, wheel, keyboard) | ✅ | `src/lib/components/knob.svelte` |
| LED GR meter (20 segments, rAF) | ✅ | `src/lib/components/gr-meter.svelte` |
| Compressorist game page (SSL panel layout) | ✅ | `src/routes/games/compressorist/+page.svelte` |
| Dashboard registration | ✅ | `src/routes/+page.svelte` |
| `eslint.config.js` — `varsIgnorePattern: '^_'` | ✅ | allow `_x` unused vars |
| Quality checks | ✅ | `pnpm check` ✅ `pnpm lint` ✅ |


---

## Phase 9 — EQ Guess + Compressorist GR tweak ✅

| Task | Status | Notes |
|------|--------|-------|
| GR meter hidden in B mode | ✅ | `active={isPlaying && !isPaused && abMode === 'A'}` |
| EQ Guess config + types | ✅ | `src/lib/games/eq-guess/config.ts` |
| EQ Guess audio (4 peaking EQ slots) | ✅ | `src/lib/games/eq-guess/audio.ts` |
| EQ curve SVG component (Gaussian approx) | ✅ | `src/lib/components/eq-curve.svelte` |
| EQ choice 2-card component | ✅ | `src/lib/components/eq-choice.svelte` |
| EQ Guess game page | ✅ | `src/routes/games/eq-guess/+page.svelte` |
| Dashboard registration | ✅ | `src/routes/+page.svelte` |
| Quality checks | ✅ | `pnpm check` ✅ `pnpm lint` ✅ |

---

## Phase 10 — EQ Matching ✅

Dial in N peaking EQ bands to match the hidden target. Live EqCurve strip + knob-per-band UI. Dual audio chains (A=user EQ, B=target EQ).

| Task | Status | Notes |
|------|--------|-------|
| `formatQ` helper | ✅ | `src/lib/format.ts` |
| EQ Matching config (FREQ/GAIN/Q steps, difficulty band count) | ✅ | `src/lib/games/eq-matching/config.ts` |
| Dual-chain audio (BiquadFilterNode, 3 slots per path) | ✅ | `src/lib/games/eq-matching/audio.ts` |
| Game page (EqCurve strip + per-band knob groups + result table) | ✅ | `src/routes/games/eq-matching/+page.svelte` |
| Enable in dashboard | ✅ | `available: true` in `src/routes/+page.svelte` |
| Quality checks | ✅ | `pnpm check` ✅ `pnpm lint` ✅ |

---

## Phase 11 — Difficulty Tuning ✅

Make every game accessible to beginners. Easy = very forgiving, Hard = current baseline.

### Rules applied across all EQ-using games
- No EQ band below **75 Hz** or above **10 kHz** (inaudible on basic samples)
- Easy mode: EQ gain changes ≥ **±6 dB** only (no subtle ±2/3 dB)
- Difficulty curve: Easy starts very low, Medium is moderate, Hard is current/pro level

### Per-game changes

| Game | Easy | Medium | Hard |
|------|------|--------|------|
| **Freq ID** | errorMargin **1.5 oct** (from 1), freq range clamped 75–10k | 0.75 oct (from ⅓) | ⅓ oct (unchanged) |
| **Panning** | errorMargin **0.35** (from 0.2) | 0.15 (from 0.1) | 0.05 (unchanged) |
| **dB Change** | pool `[9, 12]`, delta `[6, 6]` (from `[6,8,10,12]` / `[4,4]`) | pool `[6, 8, 10, 12]`, delta `[3, 4]` | unchanged |
| **EQ Matching** | gain pool `[±6, ±12]`, freqs 75–10k | gain pool `[±3, ±6, ±12]`, freqs 75–10k | freqs 75–10k only |
| **EQ Guess** | freq range 75–10k (remove 63 Hz) | unchanged | unchanged |
| **Compressorist** | ratio `[2, 10]`, attack `[1, 10, 100]`, release `[100, 400, 800]`, makeup `[0, 6, 12]` | ratio `[2, 4, 10, 20]`, attack `[1, 10, 30, 100]`, release all | unchanged |

### Tasks

| Task | Status | Notes |
|------|--------|-------|
| `freq-id/config.ts` — wider easy margin + 75–10k zone | ✅ | easy 1.5oct, medium 0.75oct |
| `panning/config.ts` — wider easy margin | ✅ | easy 0.35, medium 0.15 |
| `db-change/config.ts` — easy starts at 9–12 dB | ✅ | pool [9,12] delta [3,3] |
| `eq-matching/config.ts` — per-diff gain pool + drop 63 Hz | ✅ | easy ±6/±12, medium ±3/±6/±12 |
| `eq-guess/config.ts` — drop 63 Hz from FREQ_STEPS | ✅ | |
| `compressorist/config.ts` — per-diff step arrays | ✅ | DIFFICULTY_STEPS, RATIO_STEPS updated |
| `compressorist/+page.svelte` — pass difficulty steps to knobs | ✅ | diffSteps derived |
| Quality checks | ✅ | `pnpm check` ✅ `pnpm lint` ✅ |

---

## Phase 12 — Room Reader (Reverb RT60 ID) ⬜

**Concept:** Hear a reverb-treated signal (B), compare to dry reference (A), identify the reverb decay time (RT60) on a log-scale time strip. Completely different perceptual domain from all existing games — trains the most universal daily judgment call in mixing: *"Is this reverb too long?"*

### Why this game

Reverb time is used constantly — choosing presets, evaluating room acoustics, setting plate/hall/room decay. Nothing in the current lineup trains this. RT60 can be reliably trained: the difference between a 0.3 s booth and a 2.5 s concert hall is perceivable even by beginners; fine discrimination (0.7 s vs 1.2 s) separates experts.

### Audio design

- `ReverbIdAudio` — standalone class (same pattern as `CompressoristAudio`, NOT `AudioChain`)
- **A = dry** reference, **B = reverb applied** via `ConvolverNode`
- IR generation (synchronous): `amp(t) = noise × exp(−6.91 × t / rt60)` — 60 dB decay at t = RT60
- Pre-delay: N ms of silence at IR head before exponential starts
- Signal routing: `source → [dryGain, convolver → wetGain] → masterGain → destination`
- `setMode('A')`: dryGain=1, wetGain=0 | `setMode('B')`: dryGain=0, wetGain=1
- `setRt60(rt60, preDelayMs)` replaces `convolver.buffer` each round

### Config — RT60 options per difficulty

| Difficulty | RT60 options (s) | Error margin (log₂) | Wet level |
|------------|------------------|----------------------|-----------|
| Easy       | `[0.3, 0.8, 2.5, 6.0]` | ±0.67 (~50%) | 70% wet |
| Medium     | `[0.2, 0.5, 1.0, 2.0, 4.0, 7.0]` | ±0.35 (~25%) | 45% wet |
| Hard       | `[0.2, 0.4, 0.7, 1.2, 2.0, 3.5, 5.5, 8.0]` | ±0.17 (~12%) | 25% wet |

Pre-delay: easy=0 ms, medium=random 0–20 ms, hard=random 0–40 ms.
Evaluation: `Math.abs(Math.log2(guess / target)) <= errorMarginLog2`

### UI — RT60 Strip (new component)

**`rt60-strip.svelte`** — log-scale horizontal strip, analogous to `freq-strip.svelte`:
- Range: **0.1 s → 8 s** (log scale)
- Tick marks + room labels: 0.2 s "Booth", 0.5 s "Studio", 1.2 s "Live Rm", 2.5 s "Hall", 6.0 s "Cathedral"
- Mouse/touch: click anywhere to place guess
- Hover: shows time value + shaded error-margin band
- Result phase: green marker = target, fuchsia/red marker = user guess

### Round flow

1. **Idle** — difficulty/rounds selector + greyed-out RT60 strip → PLAY
2. **Playing** — starts in B (reverb), A/B toggle for dry reference, strip active for guessing
3. SUBMIT → `roundResult` — shows target vs guess, error as log₂ ratio
4. NEXT or `gameOver`

### Tasks

| Task | Status | Notes |
|------|--------|-------|
| `src/lib/games/reverb-id/config.ts` — RT60 options, difficulty config, types | ⬜ | |
| `src/lib/games/reverb-id/audio.ts` — `ReverbIdAudio` + `generateIR()` | ⬜ | A=dry, B=convolved |
| `src/lib/components/rt60-strip.svelte` — log-scale time selector, room labels | ⬜ | new component |
| `src/routes/games/reverb-id/+page.svelte` — game page | ⬜ | |
| Dashboard registration | ⬜ | `src/routes/+page.svelte` |
| Quality checks | ⬜ | `pnpm check` + `pnpm lint` |

