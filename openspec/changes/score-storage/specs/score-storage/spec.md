# Score Storage Spec

## score-state capability

**File:** `src/lib/stores/scores.svelte.ts`

**Shape:** `scores` is a `$state` object:
```typescript
{
  modules: Record<ModuleId, ModuleScore>
}
```
Initialized from `localStorage['auris_state']` on module load. If key missing or parse fails, initializes all modules to zero scores.

**Scoring formula:**
```typescript
basePoints = { easy: 10, medium: 20, hard: 30 }
accuracy   = max(0, 1 - abs(userAnswer - correctAnswer) / toleranceRange)
streakBonus = min(currentStreak, 10) * 2
points     = round(basePoints[difficulty] * accuracy + streakBonus)
```
For binary answers (multiple-choice), accuracy is 0 or 1.

**Streak rules:**
- `accuracy >= 0.8` → `currentStreak += 1`; update `bestStreak` if exceeded
- `accuracy < 0.5` → `currentStreak = 0`
- `0.5 <= accuracy < 0.8` → streak unchanged

**Auto-persist:** `$effect(() => { localStorage.setItem('auris_state', JSON.stringify({ version: 1, modules: scores.modules, settings: settings.value })) })`

**Exported API:**

```typescript
recordAnswer(result: AnswerResult): void
```
Updates `modules[result.exerciseId's module]`: increments `totalAttempts`, conditionally `correctAttempts` (if `accuracy >= 0.8`), updates streak, adds `points` to `totalPoints`, pushes to `history` (cap at 50), updates `perDifficulty`.

```typescript
getModuleScore(moduleId: ModuleId): ModuleScore
```
Returns current score for module. If not initialized, returns a zeroed `ModuleScore`.

```typescript
resetModule(moduleId: ModuleId): void
```
Resets all fields for the module to zero. Clears history.

```typescript
getAccuracy(moduleId: ModuleId, difficulty?: Difficulty): number
```
Returns `correctAttempts / totalAttempts` for the module (0 if no attempts). If `difficulty` provided, uses `perDifficulty[difficulty]` counts.

```typescript
getLastNAccuracy(moduleId: ModuleId, n: number): number
```
Returns accuracy over the last `n` history entries. Used for difficulty progression suggestion: suggest advance at `>= 0.8`, suggest step-down at `< 0.4`.

---

## user-settings capability

**File:** `src/lib/stores/settings.svelte.ts`

**Shape:** `settings` is a `$state` `UserSettings` object, initialized from localStorage.

**Default values:**
```typescript
{
  masterVolume: 0.8,
  preferredSample: 'pink-noise.mp3',
  difficulties: { decibel: 'easy', eq: 'easy', panning: 'easy', compression: 'easy' },
  autoAdvanceDifficulty: false,
  headphonesNoticeDismissed: false
}
```

**Exported API:**
```typescript
setVolume(value: number): void        // clamp to 0-1
setDifficulty(moduleId: ModuleId, difficulty: Difficulty): void
setPreferredSample(sampleId: string): void
setAutoAdvance(value: boolean): void
dismissHeadphonesNotice(): void       // sets headphonesNoticeDismissed = true
```

**Schema migration (version 1):** If loaded data has no `headphonesNoticeDismissed` field, default to `false`.
