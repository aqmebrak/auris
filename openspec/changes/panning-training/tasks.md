## 1. Exercise logic

- [ ] 1.1 Create `src/lib/exercises/panning.svelte.ts`
- [ ] 1.2 Define `DIFFICULTY_CONFIG` with positions arrays, tolerance, and inputType per difficulty
- [ ] 1.3 Implement `generateExercise(difficulty, sampleId?)`: pick random pan position, build `Exercise` with `PanningParams`
- [ ] 1.4 Implement `evaluateAnswer(exercise, userAnswer)`: binary for easy (exact match), continuous accuracy formula for medium/hard

## 2. AnswerSelect component

- [ ] 2.1 Create `src/lib/components/AnswerSelect.svelte`
- [ ] 2.2 Render `options` as a row of buttons with their labels
- [ ] 2.3 Highlight selected option with `ring-1 ring-cyan-400`
- [ ] 2.4 Emit `select(value)` event on click
- [ ] 2.5 Apply disabled state when `disabled` prop is true

## 3. Panning exercise page

- [ ] 3.1 Create `src/routes/exercise/panning/+page.svelte`
- [ ] 3.2 Initialize state: exercise, userAnswer (0 / null), result (null)
- [ ] 3.3 Wire AudioTransport → engine: dry on A, `playWithEffect` with `createPanEffect` on B
- [ ] 3.4 Render `AnswerSelect` on easy difficulty (L/C/R options with values -1/0/1)
- [ ] 3.5 Render `AnswerSlider` on medium/hard with `min=-1, max=1, step=0.1`
- [ ] 3.6 Format pan slider value display: "L100%" / "C" / "R100%"
- [ ] 3.7 Add headphones notice banner; show only if `!settings.headphonesNoticeDismissed`; Dismiss button calls `settings.dismissHeadphonesNotice()`
- [ ] 3.8 Handle submit, result, next — same pattern as decibel page
- [ ] 3.9 Test: easy shows buttons, medium/hard show slider, headphones notice dismisses and stays dismissed on reload
