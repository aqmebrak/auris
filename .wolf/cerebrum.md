# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-12

## User Preferences

- **Concise communication**: Sacrifice grammar for brevity. No trailing summaries — user can read the diff.
- **RTK prefix on ALL bash commands**: `rtk git status`, `rtk mkdir`, `rtk ls`, `rtk pnpm check`. No exceptions, even for shell primitives. Chain with `&&` using `rtk` on each command.
- **Serena MCP for TypeScript files**: Use `find_symbol`, `insert_after_symbol`, `replace_symbol_body`, `replace_content` instead of Read+Edit on `.ts` files.
- **No extra features**: Bug fix = fix the bug only. Feature = exactly what was asked. No docstrings, no extra comments, no error handling for impossible scenarios.

## Key Learnings

- **User UX prefs (2026-10-03)**: name A/B buttons by what they are (Target / Your EQ / Original / EQ'd), never bare "A"/"B". Graphs must be large on desktop and taller on mobile. Test on iPhone width (~402px). `<EqCurve>` sizes via a `class` prop (measured container), not a height number.
- **GameShell** playing phase has a sticky bottom transport bar; `modeLabels` prop names the A/B sides.

- **Audience: rock/metal mixing engineers.** Samples are rock/metal by design — do not propose other genres. Tune exercises to dense distorted mixes.
- **No DB/backend**: Drizzle/Neon/Better Auth removed 2026-10-02. Vercel project still has a Neon integration provisioned (AURIS_* env in local `.env`) — unused.

- **Project:** auris — ear-training app for sound engineers, SvelteKit 2 + Svelte 5.
- **Serena MCP cannot parse `.svelte` files** — `get_symbols_overview` / `find_symbol` return empty. Use Read tool for Svelte components.
- **`$derived` must be inline expression**: `$derived(expr)` not `$derived(() => expr)`. The latter stores a function, not the value.
- **Dual-chain audio pattern**: Both A and B paths are effected (neither dry). Source node switches between two filter chains. Used by CompressoristAudio and EqMatchingAudio. Contrast with AudioChain (A=bypass, B=effected).
- **AudioChain**: A=dry, B=effected. Used for EQ Guess, dB Change, Panning, Frequency ID.
- **Generic game engine**: `defineGame<TRound, TGuess>()`, `createGameStore()`, `createStatsStore()`, shared UI components in `src/lib/components/game/`.
- **Tailwind v4 @theme**: Tokens in `src/routes/layout.css`, no tailwind.config. Primary: `oklch(0.7 0.28 340)` (fuchsia).
- **ESLint `varsIgnorePattern: '^_'`**: Variables prefixed `_` are exempt. Set in `eslint.config.js` global rules.
- **EQ curve Gaussian approx**: `gainDb * exp(-0.5 * (log2(f/freq) / sigma)^2)` where `sigma = 1/(√2 * Q)`. Used in `eq-curve.svelte`.
- **Svelte `{#each}` requires key and no unused item var**: `{#each arr as item (item)}` — if item is unused, rewrite with `Array.from` to avoid lint error.

- **Roadmap lives in `task_plan.md`** (Phases 13–17 as of 2026-10-02). Assessment problems P1–P10 listed there.
- **Dep policy**: minor/patch only via `pnpm update`; 0.x minor bumps (e.g. prettier-plugin-tailwindcss 0.7→0.8) count as breaking.
- **pnpm 11 `allowBuilds`**: `pnpm update` writes placeholder `esbuild: set this to true or false` into `pnpm-workspace.yaml` — set to `true`.
- **Icons are phosphor-svelte** (not Lucide); bits-ui/melt/paraglide not installed. 
- **Sample format decision**: FLAC (gapless loops), loudnorm −18 LUFS; raw in gitignored `samples-src/`.

- **Graded scoring API**: `GameConfig.scoreGuess` (0..1) + `passThreshold`; `evaluateGuess` still required but ignored when `scoreGuess` set. `RoundBase.score` set on submit.
- **Vitest needs `$lib` alias** (in `vitest.config.ts`) to import game configs.

- **Game pages = controller + shell.** New game: `createGameController({gameId, createConfig, audio, prepareRound, sessionMeta})` + `<GameShell>` snippets (options/idle/playing/summary/resultVisual). Option selectors via `<OptionGroup>` + `$lib/game/options.js` builders. Game rounds need `sampleUrl` (`SampleRound`).
- **E2E shortcut gotcha**: Enter/Space/A/B shortcuts are ignored while a button has focus (blur first in tests).

- **EQ scoring**: `matchScore` in `audio/eq-math.ts` (symmetric RMS-ratio on response, 75–10k). Doing nothing = 0, exact = 1. Misplaced band ≈ 0.29, half-gain ≈ 0.67.
- **Loudness compensation** for EQ games = `eqLoudnessDeltaDb(averageSpectrum(sample), bands)` → inverse gain; recompute on every knob change (cheap).

- **Dynamics**: own compressor (`CompressorDsp`) shared by AudioWorklet and offline analysis. `?worker&url` import works with Vite 8 + adapter-vercel (IIFE bundle in `_app/immutable/workers/`). Don't use `DynamicsCompressorNode` for ear training (fixed lookahead/knee). Both A/B paths auto-makeup'd to dry RMS.
- **Shell commands**: `pkill -f <pattern>` kills your own shell if the pattern is in the command line — use `fuser -k PORT/tcp`.

- **Graded scoring pattern** for continuous guesses: `score = max(0, 1 − err / (2·margin))`, `passThreshold 0.5` ⇒ correct exactly when err ≤ margin. Used by Freq ID and Panning. Easy = buttons (snap values), Medium/Hard = strip.
- Games whose A/B changes spectrum use `compensationGainDb(spectrum, bands)` after the effect; spectrum from `averageSpectrum(monoMix(buffer), sampleRate)` on load.

- **UX rule (2026-10-04)**: no layout shift between game states. Elements shown in a later state are rendered from the start, disabled. Interactive controls need `cursor-pointer` (`cursor-not-allowed` when disabled). Planned in task_plan.md "UX consistency".

- **Sample pipeline**: raw → `samples-src/` (gitignored, convention `{kind}_{source}_{bpm}_{name}`) → `pnpm samples` → `static/audio/*.flac` + `src/lib/audio/library.json` (generated, prettier-ignored) + CREDITS.md. Games call `pickTrack(filter?)`; use `audibleFreqs(sample, candidates, 'boost'|'cut')` to pick fair EQ targets. Thresholds: boost ≥ −30 dB, cut ≥ −20 dB re loudest 1/3-oct band.
- Existing sample licences are **unverified** (freesound) — ask user before any public release.

- **Round generation order**: `const sample = pickSample()` first, then choose frequencies with `audibleFreqs(sample, candidates, boost|cut)` / `isAudible`; round stores `sampleUrl: sample.url`. Generators take an optional `sample` so tests can inject a synthetic spectrum.

- **Game page API (2026-10-04)**: `GameShell` takes `board(round, ui)` + `feedback(round)`; board is rendered in every phase (ui.interactive / ui.revealed). Never mount elements late. New games must be added to `src/routes/games/game-fixtures.ts` (drives session + layout-stability E2E). Secret values: `masked` prop, not removal.
- E2E: REPLAY exists (disabled) in idle — wait for `toBeEnabled()` to know a round is playing.

- **Web Audio gotcha**: `BiquadFilterNode` `Q` for lowpass/highpass is in **dB**, not linear — use `qToDb(q)` (`audio/eq-math.ts`). Butterworth: 12 dB/oct Q=0.7071; 24 dB/oct = two stages Q=0.5412 and 1.3066.
- **Adding a route can break `svelte-check`** in `ui/button/button.svelte` (`resolve()` union too big) — the cast there is `href as '/'` on purpose.
- `createCompensatedPlayable(chain, player)` gives a Playable + `spectrum()` for loudness-matched A/B games; compensate with `compensationFromResponse(spectrum, f => responseDb(f))`.

## Do-Not-Repeat

- **[2026-10-02] Suggested diversifying sample genres** — wrong: app targets rock/metal on purpose.

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->

- **[2026-04-12] RTK prefix omitted**: Used `pnpm check`, `mkdir`, `git status` directly. Always prefix with `rtk`: `rtk pnpm check`, `rtk mkdir`, `rtk git status`.
- **[2026-04-12] Serena not used for .ts edits**: Used Read+Edit on TypeScript files instead of Serena symbolic tools. For `.ts` files: always try `find_symbol` + `replace_symbol_body` / `insert_after_symbol` first.
- **[2026-04-12] `$derived(() => fn)` bug**: Wrote `$derived(() => compute())` — stores function, not value. Use `$derived(compute())` inline.
- **[2026-04-12] Stale `svelte-ignore` comment**: Left over `<!-- svelte-ignore a11y_no_static_element_interactions -->` after adding `role="slider"`. Remove ignore comments when the warning is resolved by a code fix.
- **[2026-04-12] `{#each Array(N) as _, i}` lint failure**: `_` item variable triggers no-unused-vars. Use `Array.from({ length: N }, (_, idx) => idx) as i (i)` to avoid the item variable.

- **[2026-10-02] E2E tests must not hardcode dashboard card counts** — games get added; assert structure instead.

## Decision Log

- **[2026-04-12] Dual-chain vs AudioChain for Compressorist/EqMatching**: Dual-chain (both paths effected) chosen so A/B comparison is between user settings and target settings — not user settings vs. dry. AudioChain (A=dry) only works for games where you compare processed vs. unprocessed.
- **[2026-04-12] EQ Matching scoring — exact match**: Discrete step values mean exact comparison is fair and unambiguous. No tolerance bands needed.
- **[2026-04-12] GR meter gated on A mode**: GR activity in B mode reveals target compression intensity, making the game too easy. Fix: `active={isPlaying && !isPaused && abMode === 'A'}`.
- **[2026-10-02] User handed ownership of roadmap**: Claude owns planning; user supplies audio samples. Graded scoring (0–100) over exact match for matching games; Compressorist folds into multi-mode Dynamics game.
- **[2026-10-02] Match metric normalised by combined target+guess energy** (not target alone): target-only gave 0 for any misplaced band and made 2-band partial credit impossible.
