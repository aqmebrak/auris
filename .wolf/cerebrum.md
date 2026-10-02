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
