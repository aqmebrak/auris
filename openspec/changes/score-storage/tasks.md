## 1. Settings store

- [ ] 1.1 Create `src/lib/stores/settings.svelte.ts`
- [ ] 1.2 Define default `UserSettings` object (volume 0.8, preferredSample 'pink-noise.mp3', all difficulties 'easy', autoAdvance false, headphonesNoticeDismissed false)
- [ ] 1.3 Initialize from `localStorage['auris_state']?.settings` on module load; fall back to defaults on parse error or missing key
- [ ] 1.4 Implement `$effect` to persist full `AurisState` to `localStorage['auris_state']` whenever settings change
- [ ] 1.5 Implement `setVolume`, `setDifficulty`, `setPreferredSample`, `setAutoAdvance`, `dismissHeadphonesNotice`
- [ ] 1.6 Export singleton `settings` instance

## 2. Scores store

- [ ] 2.1 Create `src/lib/stores/scores.svelte.ts`
- [ ] 2.2 Define zero-score `ModuleScore` factory function for initialization
- [ ] 2.3 Initialize `modules` from `localStorage['auris_state']?.modules` on load; fill missing modules with zero scores
- [ ] 2.4 Implement schema version check: if `version !== 1`, run migration (v1: add `headphonesNoticeDismissed` default)
- [ ] 2.5 Implement `$effect` to co-persist scores with settings in `localStorage['auris_state']`
- [ ] 2.6 Implement `recordAnswer(result)`: update totalAttempts, correctAttempts (if accuracy >= 0.8), streak (increment/preserve/reset per rules), bestStreak, totalPoints, history (push + cap at 50), perDifficulty
- [ ] 2.7 Implement `getModuleScore(moduleId)`: return current or zero score
- [ ] 2.8 Implement `resetModule(moduleId)`: overwrite with zero score
- [ ] 2.9 Implement `getAccuracy(moduleId, difficulty?)`: correctAttempts / totalAttempts (or per-difficulty)
- [ ] 2.10 Implement `getLastNAccuracy(moduleId, n)`: slice last `n` history entries, compute accuracy
- [ ] 2.11 Export singleton `scores` instance

## 3. Verify persistence

- [ ] 3.1 Confirm that changing difficulty in settings → `localStorage['auris_state']` is updated immediately
- [ ] 3.2 Confirm that recording an answer → score visible in `getModuleScore` and reflected in localStorage
- [ ] 3.3 Confirm that reloading the page restores all state correctly
