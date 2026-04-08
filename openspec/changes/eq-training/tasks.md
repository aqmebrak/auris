## 1. Exercise logic

- [x] 1.1 Create `src/lib/exercises/eq.svelte.ts`
- [x] 1.2 Define `DIFFICULTY_CONFIG` for easy (3 bands, Q 1.0), medium (7 bands, Q 2.0), hard (7 bands, wider gain range, Q 4.0, requireGain true)
- [x] 1.3 Implement `generateExercise(difficulty, sampleId?)`: pick random band and gainDb (never 0), build `Exercise` with `EQParams`
- [x] 1.4 Implement `evaluateAnswer(exercise, userAnswer)`: evaluate frequency match (binary), boost/cut match if required, gain accuracy if required; final accuracy = average of required fields

## 2. FrequencyPicker component

- [x] 2.1 Create `src/lib/components/FrequencyPicker.svelte`
- [x] 2.2 Render `bands` as a row of buttons with formatted Hz labels (e.g. "1 kHz")
- [x] 2.3 Highlight selected band with `ring-1 ring-cyan-400`
- [x] 2.4 Conditionally render Boost/Cut toggle buttons when `showBoostCut` is true
- [x] 2.5 Conditionally render gain AnswerSlider when `showGain` is true
- [x] 2.6 Emit `selectFrequency`, `selectBoostCut`, `gainChange` events
- [x] 2.7 Apply disabled state to all controls when `disabled` is true

## 3. EQ exercise page

- [x] 3.1 Create `src/routes/exercise/eq/+page.svelte`
- [x] 3.2 Initialize state: exercise, selectedFrequency (null), boostOrCut (null), gainDb (0), result (null)
- [x] 3.3 Derive `bands`, `showBoostCut`, `showGain` from current difficulty config
- [x] 3.4 Wire AudioTransport → engine: play dry on A, `playWithEffect` with `createEQEffect` on B
- [x] 3.5 Wire FrequencyPicker events to local state
- [x] 3.6 Disable submit button until required fields for current difficulty are filled
- [x] 3.7 Handle submit: call `evaluateAnswer` with only fields required by difficulty, call `scores.recordAnswer`, set result
- [x] 3.8 Handle next: reset all answer state, generate new exercise
- [x] 3.9 Test all three difficulties: easy (freq only), medium (freq + boost/cut), hard (freq + boost/cut + gain)
