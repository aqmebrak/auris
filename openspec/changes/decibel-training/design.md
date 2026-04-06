## Context

Decibel training is the simplest possible exercise: apply a `GainNode` with a dB offset to a sample, ask the user to identify the offset. Its simplicity makes it the right first module — it exercises the complete loop (generate → play A/B → answer → evaluate → persist) without complex UI. The components built here (AudioTransport, AnswerSlider, FeedbackOverlay, ScoreDisplay, DifficultySelector) are reused by all three remaining modules, so they must be generic enough to accommodate EQ, panning, and compression without modification.

## Goals / Non-Goals

**Goals:**
- Complete exercise loop working end-to-end before any other module is built
- All shared components are props-in/events-out (purely presentational, no internal audio or score logic)
- Tolerance-based accuracy scoring (not binary)
- Difficulty-appropriate parameter ranges and tolerances

**Non-Goals:**
- Fine-grained dB discrimination below 0.5dB (not audibly trainable without professional monitoring)
- Absolute level identification (only relative A/B differences)

## Decisions

**Components are purely presentational (props in, events out)**
`AudioTransport` does not know about `AudioContext`. It emits `play`, `stop`, `selectA`, `selectB` events; the page handles all audio logic. This makes components testable without mocking the audio engine, and reusable across all four modules.

**AnswerSlider uses `bind:value` pattern**
The parent page owns `userAnswer` state and passes it to `AnswerSlider`. The slider emits a `change` event but the value is also bindable. This follows Svelte 5 `$bindable()` props convention.

**Exercise loop state lives in the page component**
`exercise`, `userAnswer`, and `result` are `$state` in the `+page.svelte`. They are not stored in a shared store (they're ephemeral, per-session, not persisted). Only the `AnswerResult` is passed to the scores store after evaluation.

**DifficultySelector reads and writes settings store directly**
The selector component reads `settings.difficulties[moduleId]` and calls `settings.setDifficulty()` on change, so the parent page does not need to manage difficulty state. This is an exception to the "presentational" rule, justified by the fact that difficulty is a global persistent setting, not a local page concern.

## Risks / Trade-offs

`AudioBufferSourceNode` cannot be restarted — must create new node on each play/toggle → The engine handles this correctly; page just calls `engine.play()` or `engine.toggleAB()`.

FeedbackOverlay must be dismissed before generating next exercise, or the user sees stale feedback → Mitigation: "Next" button in overlay clears `result` state and calls `generateExercise()` simultaneously.
