# Auris — Task Plan

Status: ✅ done · 🔄 in progress · ⬜ pending · 🎧 blocked on samples from user

---

## Done (Phases 1–11)

| Phase | Result |
| ----- | ------ |
| 1–2 | SvelteKit scaffold, dark theme, dashboard, Frequency ID MVP, UI polish |
| 3 | Generic engine: `defineGame`, `createGameStore`, `createStatsStore`, `AudioChain`, shared `game/` UI |
| 4 | Freq ID depth: difficulty, zones, gain variety, heatmap, round count |
| 5 | Panning ID |
| 7 | Compressorist (dual-chain audio, knob, GR meter) |
| 9 | EQ Guess (2AFC curves) |
| 10 | EQ Matching (dual-chain, N bands) |
| 11 | Difficulty tuning: 75 Hz–10 kHz EQ range, easier Easy modes |

Details: `progress.md` + git history.

---

## Audience

Mixing engineers working on **rock and metal**. Every exercise targets that material: dense distorted guitars, loud/compressed drums, bass/guitar masking, harsh upper mids. Ranges, difficulty and choices tuned to that context (e.g. 2–5 kHz harshness, 200–500 Hz mud, kick/bass low-end, snare crack).

## Assessment — 2026-10-02

**Healthy:** engine/session split is clean and tested; all gates green (`check`, `lint`, `test:unit`, `test:e2e`); deps current (minor/patch).

**Problems making games infeasible or unfair:**

| # | Problem | Affects |
| - | ------- | ------- |
| P1 | **EQ Guess is answerable without listening.** Target always starts with a boost (`i % 2 === 0 ? 1 : -1`), distractor always starts with a cut (gains negated). | EQ Guess |
| P2 | **Exact-match scoring on continuous perception.** EQ Matching needs freq+gain+Q exact on up to 3 bands (Q 1 vs 1.5 is near-inaudible). Compressorist needs 4 params at once. Binary pass/fail → near-0 scores, no feedback on "how close". | EQ Matching, Compressorist |
| P3 | **Loudness bias in A/B.** Boosts, makeup gain and compression change loudness; louder reads as "different/better". No gain compensation anywhere. | Compressorist, EQ games |
| P4 | **Wrong source material.** Panning a full stereo mix with `StereoPannerNode` = balance knob, not source placement. Reverb/delay/compression drills need dry stems. No dry stems or multitracks available yet. | Panning, future games |
| P5 | **Samples not normalized; fixed −24 dBFS compressor threshold** → GR varies wildly per track. 46 MB of WAV in `static/`, 15 MB single file → slow first round, no preload. | All, esp. Compressorist |
| P6 | **Cuts as hard as boosts on Easy.** Freq ID Easy mixes ±gain; cuts are much harder to locate. Hard margin is ¼ oct (spec said ⅓). | Freq ID |
| P7 | **Compressor drill too subtle on Web Audio.** `DynamicsCompressorNode` has fixed knee/lookahead; 1 ms vs 3 ms attack inaudible; makeup knob confounds everything. | Compressorist |
| P8 | **Page bloat + duplication.** Game pages 266–415 lines (target ≤150); each re-implements audio lifecycle, play/pause/replay, stats recording, idle option selectors. | All pages |
| P9 | Test coverage: 1 unit file (session), 1 E2E (dashboard). No config tests. | All |
| P10 | Dead scaffold: `Dynamics` "coming soon" card, boilerplate `README.md`. (Drizzle/Neon/Better Auth removed 2026-10-02.) | Repo |

---

## Phase 13 — Sample Library v2 ⬜ 🎧

Foundation for every rework and new game. Can start with existing samples; full value once user samples land.

### Sample spec (what the user provides)

- **Format in:** WAV/AIFF/FLAC, 44.1 or 48 kHz, 16/24-bit. Conversion handled by script.
- **Length:** 15–30 s, loopable (start/end on bar line), no fades, no silence at head.
- **Stems must be dry:** no reverb, delay, compression, or heavy EQ printed.
- **Licensing:** own recordings or CC0/CC-BY (note author for credits).
- **Naming:** `{kind}_{source}_{bpm}_{name}.wav` — e.g. `stem_vocal-f_92_ballad.wav`, `mix_pop_120_sunny.wav`, `multi_song1_110_bass.wav`.

| Kind | What | Count | Used by |
| ---- | ---- | ----- | ------- |
| `mix` | Full stereo mixes, rock/metal subgenres (classic rock, hard rock, modern metal, djent, punk, doom/stoner, metalcore) — mix of dense/sparse arrangements | 8–12 | Freq ID, EQ, Level, Filter, Width |
| `stem` | Dry mono: vocal (clean + screamed), bass DI + amped, rhythm gtr L/R (distorted, double-tracked), lead gtr, clean gtr, snare, kick, toms | 1–2 each | Panning, Reverb, Delay, Saturation, Dynamics |
| `drums` | Dry drum kit loops (stereo ok), clear transients, incl. fast double-kick | 3–4 | Dynamics (attack/release), Delay |
| `multi` | Multitrack: 4–6 time-aligned stems of one song, equal length | 2–3 songs | Instrument Spotlight |

Pink noise generated in code — no file needed.

### Tasks

| Task | Status | Notes |
| ---- | ------ | ----- |
| `scripts/prepare-samples.sh` (ffmpeg): loudnorm −18 LUFS / −1 dBTP, 44.1 kHz, trim ≤30 s, encode **FLAC** (gapless loops; lossy codecs add priming gaps) | ✅ | two-pass loudnorm −18 LUFS/−1 dBTP, ≤30 s with 20 ms fades when trimmed, 44.1 kHz FLAC, band profile → library.json, CREDITS.md; see scripts/README.md |
| `src/lib/audio/library.ts`: typed manifest `{ id, url, kind, source, channels, bpm?, lufs, credit }` + `pickSample(filter)` replacing `pickTrack()` | ✅ | `pickSample(filter)` (kind/channels/source, falls back to whole library), `audibleFreqs`, `bandRelDb`; `pickTrack(filter?)` kept as thin wrapper |
| Re-encode current 8 tracks, drop WAVs; verify freesound licenses → `static/audio/CREDITS.md` | ✅ | 46 MB WAV/MP3 → 30 MB FLAC. **Licences still unverified** — `scripts/sample-meta.json` marks them `unverified` |
| Preload next round's sample during result screen (`AudioPlayer.preload`) | ✅ | |
| Unit tests: `pickSample` filtering + fallback | ✅ | |

---

## Sample-aware targets ✅ (EQ Matching, EQ Guess, Freq ID; Panning/Dynamics need no frequency targets) (add to Phase 13 manifest + Phase 15 games)

Raised after playing EQ Matching: a boost/cut is only fair if the sample has energy there (a bass-only loop gives nothing to hear for a cut at 8 kHz; boosting empty bands is inaudible too).

- ✅ `pnpm samples` computes a per-sample band-energy profile (reuse `audio/spectrum.ts`, 1/3-oct, dB relative to the sample's loudest band) and stores it in the manifest.
- ✅ Games ask the library for **feasible frequencies**: `audibleFreqs(sample, { kind: 'cut' | 'boost', minRelDb })` — cuts need energy ≥ −20 dB re peak at the target, boosts ≥ −30 dB. Round generation picks the sample first, then candidates from its profile.
- Optional hand-written overrides per sample (`avoid: [...]`, `tags`) for edge cases the numbers miss.
- Per-game policy lives in the game config (EQ games: both; Freq ID: boost-only on Easy; Panning: needs wideband content).
- Same mechanism feeds difficulty: Easy only picks bands where the sample is strong.

---

## UX consistency across game states ✅

Reported 2026-10-04: layout shifts between states. In EQ Matching the idle screen hides the A/B toggle but keeps the graph, then PLAY makes the buttons appear and the whole board jumps down.

**Rule:** if an element appears in a later state of the same round, render it from the start in a disabled/inert state instead of mounting it later. Layout must not shift between `idle → playing → roundResult` (and next round's `idle`).

| Task | Status | Notes |
| ---- | ------ | ----- |
| `GameShell`: always render the transport bar (A/B toggle + play/pause/replay) in idle, `disabled` until a round is playing; same slot, same height | ⬜ | removes the main jump in every game |
| Idle boards mirror the playing board's structure (same containers/heights): EQ Matching shows all band knob groups disabled, Dynamics Match shows panel + submit disabled, choice games show disabled cards, SUBMIT visible-but-disabled | ⬜ | idle snippets currently differ from playing snippets |
| Result screen keeps the board in place (disabled, with target overlay) and swaps only the transport for NEXT/FINISH | ⬜ | today the whole board is replaced by the summary card |
| Reserve fixed height for variable text (intro/hint lines, result banner) so it can't push content | ⬜ | |
| Disabled styling in one place (`opacity-50`, `pointer-events-none`, `aria-disabled`) — shared helper/class, not per component | ⬜ | |
| Playwright layout-stability check: record bounding boxes of the board + transport in each state; assert no vertical shift | ⬜ | per game, desktop and 402px mobile |
| `cursor-pointer` on interactive controls that lack it: A/B toggle buttons (`ab-toggle.svelte`), `choice-buttons.svelte`, `db-choice`, `eq-choice`; `cursor-not-allowed` when disabled | ⬜ | audit all `<button>` in `src/lib/components/` |

---

## Phase 14 — Engine v2 ⬜

Fixes P2, P3, P8, P9 structurally so per-game rework is small.

| Task | Status | Notes |
| ---- | ------ | ----- |
| Graded scoring: optional `scoreGuess(round, guess) → 0..1` + `passThreshold` in `GameConfig`; `result` derived from threshold; `accuracySession` = mean % | ✅ | binary games keep `evaluateGuess` (score 0/1) |
| Stats store: record `accuracy` (0–100) alongside `score`; read old entries unchanged | ✅ | API only; pages wired during port |
| `src/lib/audio/loudness.ts`: `rmsDb` + `compensationDb` pure math | ✅ | |
| Loudness compensation: spectrum-weighted estimate (`audio/spectrum.ts`, `eqLoudnessDeltaDb`) applied per path — no offline render needed | ✅ | wired in EQ Matching; reuse for EQ Guess / Freq ID / Dynamics (compressor needs measured RMS instead) |
| `createGameController()` (`.svelte.ts`): audio load/play/pause/replay/A-B, stop on submit, record stats once on gameOver, rebuild on option change | ✅ | preload-next waits on Phase 13 |
| `<GameShell>` + `<OptionGroup>`: header, phase snippets, option selectors | ✅ | |
| Keyboard: `Space` play/pause, `A`/`B` toggle, `Enter` start/next (ignored while a button has focus) | ✅ | `src/lib/game/keys.ts` |
| Unit tests per game config: generate in range, evaluate/score edge cases | ✅ | `src/lib/games/configs.test.ts`, `eq-guess/config.test.ts` |
| Port Freq ID, Panning, dB Change, EQ Guess (all ≤125 lines) | ✅ | E2E full-session test each |
| Port EQ Matching | ✅ | via Phase 15 rework |
| Port Compressorist | ⬜ | via Phase 15 Dynamics rework |

---

## Phase 15 — Rework existing games ⬜

| Game | Change | Fixes |
| ---- | ------ | ----- |
| **EQ Guess** ✅ | Random sign per band; distractor keeps gain pattern. Easy = all bands shifted 2 steps; Medium = 1 band moved to nearest free step; Hard = 1 band flips boost/cut. Still 2 options (3/4 options deferred). Tested: no sign tell. | P1 |
| **EQ Matching** ✅ (UX: Target / Your EQ buttons, big responsive curve, sticky transport) | Graded: `matchScore` = 1 − RMS(Δ response) ÷ (RMS(target)+RMS(guess)) on a 1/12-oct grid 75 Hz–10 kHz, using exact biquad math. Pass: Easy ≥70%, Medium ≥80%, Hard ≥90%. Q fixed on Easy/Medium (knob hidden), editable on Hard. Both paths loudness-compensated per sample (spectrum-weighted). Result: overlaid target/yours curves + band table. | P2, P3 |
| **Freq ID** ✅ | Easy: boost-only +12 dB, Q 1.4, pick an octave band (buttons). Medium: ±9/12 dB, Q 2, strip, ±½ oct. Hard: ±6/9/12, Q 2.5–4, strip, ±⅓ oct. Graded by octave error (1 exact, 0.5 at margin, 0 at 2×). Loudness-matched via spectrum compensation. Pink-noise source option still open. | P6 |
| **Panning** ✅ (partial) | Source summed to mono before the panner (placement, not balance). Easy: 5 snap positions as buttons; Medium ±0.15, Hard ±0.08; graded by distance. Still to do once you provide dry mono stems: `pickSample({ channels: 1 })`. | P4 |
| **Level Change** | Keep 2AFC. Add Hard JND tier (0.5–2 dB). Loudness-normalized samples make magnitudes consistent. Minor. | P5 |
| **Dynamics** ✅ (replaces Compressorist + coming-soon card) | Own compressor DSP (`audio/compressor-dsp.ts`, AudioWorklet, no lookahead, true attack/release) instead of `DynamicsCompressorNode`. Threshold = sample RMS + offset, makeup auto-computed so both paths are loudness-matched. Modes: **Detect** (which of 2 clips is compressed) → **Ratio** → **Attack** → **Release** (original vs compressed, choose value) → **Match** (ratio+attack+release knobs, graded 1/0.5/0 per param, GR meter only on Your settings). 3 difficulties tune threshold offset, ratios and choice sets. | P2, P3, P7 |

---

## Phase 16 — New exercises ⬜

Ordered by value ÷ effort. All reuse engine v2 + shared components.

| # | Game | Trains | Audio | UI | Samples | Effort |
| - | ---- | ------ | ----- | -- | ------- | ------ |
| 1 | **Filter Finder** ✅ | HPF/LPF cutoff placement | Butterworth 12/24 dB/oct (1–2 biquads; Web Audio Q is in dB), loudness-matched | reuse `freq-strip` / choice buttons | mixes ✅ | S |
| 2 | **Room Reader** | Reverb decay (RT60) | `ConvolverNode`, generated exp-decay IR — spec below | new `rt60-strip` (log 0.1–8 s, room labels) | dry stems 🎧 | M |
| 3 | **Delay Time** | Slapback / 1/16 / 1/8 / 1/4 / dotted 1/8 at track BPM | `DelayNode` + feedback gain | choice cards | dry drums/stems + BPM 🎧 | S |
| 4 | **Phase / Comb** | In phase vs polarity flip vs comb (0.1–5 ms) | sum source + delayed/inverted copy | 3AFC → Hard: estimate delay | mixes ✅, mono stems better | S |
| 5 | **Stereo Width** | Mono / narrow / normal / wide | M/S matrix via `ChannelSplitter` + gains | width strip 0–200% | stereo mixes ✅ | S |
| 6 | **Saturation** | Clean vs drive amount | `WaveShaperNode` tanh curve, oversample 4x, loudness-matched | 3AFC drive levels | stems 🎧 | S |
| 7 | **Instrument Spotlight** | Which stem got +3/+6 dB in the mix | N synced `AudioBufferSourceNode`s, per-stem gain | stem choice list | multitracks 🎧 | M (engine: multi-source playback) |

### Room Reader spec (carried from old Phase 12)

- A = dry, B = reverb (standalone class, dry/wet gains). IR: `noise × exp(−6.91·t / rt60)`, pre-delay = leading silence. `setRt60(rt60, preDelayMs)` swaps `convolver.buffer`.
- Difficulty: Easy RT60 `[0.3, 0.8, 2.5, 6.0]`, margin ±0.67 log₂, 70% wet, 0 ms pre-delay · Medium `[0.2, 0.5, 1.0, 2.0, 4.0, 7.0]`, ±0.35, 45% wet, 0–20 ms · Hard `[0.2, 0.4, 0.7, 1.2, 2.0, 3.5, 5.5, 8.0]`, ±0.17, 25% wet, 0–40 ms.
- Eval: `|log2(guess / target)| ≤ margin`; graded by log error.
- Strip labels: 0.2 s Booth · 0.5 s Studio · 1.2 s Live Rm · 2.5 s Hall · 6 s Cathedral.

---

## Phase 17 — Progression & dashboard ⬜

| Task | Status | Notes |
| ---- | ------ | ----- |
| Adaptive difficulty (2-down/1-up staircase) as opt-in "Auto" difficulty | ⬜ | standard psychoacoustic method |
| Dashboard: per-game accuracy sparkline + last played, grouped by category (EQ / Dynamics / Space / Level) | ⬜ | |
| "Daily mix": 10 rounds across games, weakest areas weighted | ⬜ | uses stats history |
| Generalize Freq ID heatmap to any game with per-round meta | ⬜ | |

---

## Cleanup (any time) ⬜

| Task | Status | Notes |
| ---- | ------ | ----- |
| Remove Drizzle/Neon/`DATABASE_URL`/Better Auth | ✅ | 2026-10-02 |
| Replace boilerplate `README.md` with project README | ⬜ | |
| Remove "Dynamics" coming-soon card (superseded by Phase 15 Dynamics) | ⬜ | |

---

## Execution order

1. **Phase 14** (engine v2) + **Phase 13** tooling in parallel — no samples needed to start.
2. **Phase 15** reworks, P1 (EQ Guess tell) first — it's a 1-file fix.
3. **UX consistency** (above) — touches every game page, so do it before adding more.
4. **Phase 16** #1, #4, #5 (work with mixes) → #2, #3, #6, #7 as samples arrive.
5. **Phase 17**.


