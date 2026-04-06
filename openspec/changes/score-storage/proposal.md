## Why

Exercise scores, streaks, and user preferences need to survive page refreshes and browser restarts. Without a dedicated persistence layer, every exercise page would manage its own localStorage reads/writes — creating JSON inconsistencies, missing streak logic, and duplicated difficulty tracking. A centralized reactive store eliminates these risks and provides a single source of truth for all progress data.

## What Changes

- Introduce `scores.svelte.ts`: reactive `$state` object holding `ModuleScore` per module, with a `$effect` watcher that auto-persists the full `AurisState` to localStorage on any change
- Introduce `settings.svelte.ts`: reactive user preferences (master volume, preferred sample, per-module difficulty), also auto-persisted
- Implement the scoring formula: `points = round(basePoints[difficulty] * accuracy + streakBonus)`
- Implement streak logic: increment at `accuracy >= 0.8`, reset at `< 0.5`
- Schema versioning (`version: 1`) to support future migrations
- Expose `recordAnswer()`, `getModuleScore()`, `resetModule()`, `getAccuracy()`, `getLastNAccuracy()` as the public API

## Capabilities

### New Capabilities
- `score-state`: Reactive score state with per-module tracking, streak management, and localStorage auto-persistence
- `user-settings`: Reactive user preferences (volume, difficulty, sample) with localStorage auto-persistence

### Modified Capabilities
<!-- none -->

## Impact

- All exercise modules call `scores.recordAnswer(result)` after each submission
- Dashboard reads module scores for progress display
- Files: `src/lib/stores/scores.svelte.ts`, `src/lib/stores/settings.svelte.ts`, `src/lib/exercises/types.ts`
- localStorage key: `auris_state`, schema version: `1`
