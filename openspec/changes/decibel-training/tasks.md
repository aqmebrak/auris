## 1. Exercise logic

- [x] 1.1 Create `src/lib/exercises/decibel.svelte.ts`
- [x] 1.2 Define `DIFFICULTY_CONFIG` with values arrays and tolerances for easy/medium/hard
- [x] 1.3 Implement `generateExercise(difficulty, sampleId?)`: pick random gainDb, build and return `Exercise` object
- [x] 1.4 Implement `evaluateAnswer(exercise, userAnswer)`: accuracy formula, correct flag, points calculation, return `AnswerResult`

## 2. Shared components

- [x] 2.1 Create `src/lib/components/AudioTransport.svelte` — Play/Stop button + A/B toggle; purely presentational; emit play/stop/selectA/selectB events
- [x] 2.2 Create `src/lib/components/AnswerSlider.svelte` — range input with numeric readout, unit label, bindable value, disabled state
- [x] 2.3 Create `src/lib/components/FeedbackOverlay.svelte` — correct/incorrect display with user answer, correct answer, points earned, Next button
- [x] 2.4 Create `src/lib/components/ScoreDisplay.svelte` — reads scores store for a moduleId, shows accuracy %, streak, total points
- [x] 2.5 Create `src/lib/components/DifficultySelector.svelte` — Easy/Medium/Hard button group; reads and writes settings store

## 3. Exercise layout

- [x] 3.1 Create `src/routes/exercise/+layout.svelte` — back link, module title from URL, DifficultySelector, ScoreDisplay, `{@render children()}`
- [x] 3.2 Verify layout wraps the decibel page correctly

## 4. Decibel exercise page

- [x] 4.1 Create `src/routes/exercise/decibel/+page.svelte`
- [x] 4.2 Initialize `$state`: exercise, userAnswer (0), result (null), using current difficulty from settings store
- [x] 4.3 Wire AudioTransport events → engine methods (play dry on selectA, playWithEffect with createGainEffect on selectB)
- [x] 4.4 Render AnswerSlider with `min=-12, max=12, step` from difficulty config
- [x] 4.5 Handle submit: call `evaluateAnswer`, call `scores.recordAnswer(result)`, set `result` state
- [x] 4.6 Handle next: reset result and userAnswer, generate new exercise
- [x] 4.7 Disable AnswerSlider and submit button after result is set
- [x] 4.8 Test full loop: generate → play A → play B → answer → see feedback → next
