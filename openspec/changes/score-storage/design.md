## Context

Svelte 5 replaces the `writable`/`readable` store pattern with runes. State defined with `$state` is reactive, and `$effect` runs whenever its reactive dependencies change. This makes localStorage sync simpler than in Svelte 4: define state, add one `$effect` that serializes to localStorage, and the persistence is fully automatic. The challenge is initializing state from localStorage safely (handling missing keys, schema version mismatches) and keeping the scoring formula centralized.

## Goals / Non-Goals

**Goals:**
- Auto-persist all score and settings state to `localStorage['auris_state']` with no manual "save" calls
- Centralized scoring formula accessible to all exercise modules
- Schema versioning to support future data model changes without breaking existing user data
- Streak tracking that is accurate even across multi-session play

**Non-Goals:**
- Server-side sync or backup
- Multi-user profiles
- Undo/redo of score history

## Decisions

**Single localStorage key (`auris_state`) for all state**
One `JSON.parse`/`JSON.stringify` call. Simpler migration (one version check vs. per-key versioning). The full `AurisState` object is small (< 50KB even with 50 session records per module).

**`$effect` for auto-persistence instead of explicit `save()` calls**
Svelte 5 batches synchronous state changes so `$effect` fires once per user interaction, not once per field update. This is safe and efficient. The alternative (calling `save()` in every mutation) risks forgetting it and causing stale reads on reload.

**Accuracy as a continuous 0–1 value, not boolean correct/wrong**
Continuous accuracy (`max(0, 1 - abs(user - correct) / tolerance)`) rewards near-misses and makes the scoring feel fair. Binary scoring (all-or-nothing) discourages learners who are close. The binary case is a subset: for multiple-choice questions, accuracy is still 0 or 1.

**Streak based on accuracy threshold, not strict correctness**
Streak increments at `accuracy >= 0.8`. This prevents a single off-by-0.5dB answer from breaking a long streak, which would feel punishing for trained ears making small errors.

**Schema version field for forward migration**
Starting at version 1. On load: if `version < current`, run migration functions in sequence. If `version > current` (downgrade), warn but load anyway. Migrations are additive (never delete fields in early versions).

## Risks / Trade-offs

localStorage is synchronous and blocks the main thread briefly on large JSON payloads → Mitigation: payload is tiny, non-issue for this app size.

`$effect` fires on every state change including internal derived updates → Mitigation: use a top-level effect that serializes the whole object; Svelte's batching ensures it fires once per tick maximum.

Invalid data in localStorage (e.g., corrupted JSON, injected by other apps) → Mitigation: wrap `JSON.parse` in try/catch; fall back to fresh default state on any parse error.
