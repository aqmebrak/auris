# Decibel Training Spec

## decibel-exercise capability

**File:** `src/lib/exercises/decibel.svelte.ts`

**Difficulty config:**
```typescript
DIFFICULTY_CONFIG = {
  easy:   { values: [3, 6, -3, -6],                    tolerance: 2   },
  medium: { values: range(-6, 6, 1).filter(n => n !== 0), tolerance: 1  },
  hard:   { values: range(-6, 6, 0.5).filter(n => n !== 0), tolerance: 0.5 }
}
```

```typescript
generateExercise(difficulty: Difficulty, sampleId?: string): Exercise
```
Picks a random `gainDb` from `DIFFICULTY_CONFIG[difficulty].values`. Returns `Exercise` with:
- `module: 'decibel'`
- `params: DecibelParams { type: 'decibel', gainDb }`
- `question: 'How many dB was the volume changed in version B?'`
- `correctAnswer: { type: 'decibel', gainDb }`
- `sampleId`: defaults to `settings.preferredSample`

```typescript
evaluateAnswer(exercise: Exercise, userAnswer: number): AnswerResult
```
`accuracy = clamp(1 - abs(userAnswer - exercise.params.gainDb) / tolerance, 0, 1)`
`correct = accuracy >= 0.8`

---

## audio-transport-ui capability

**File:** `src/lib/components/AudioTransport.svelte`

Props: `isPlaying: boolean`, `currentMode: 'A' | 'B'`, `disabled?: boolean`
Events: `play`, `stop`, `selectA`, `selectB`

Layout: One large Play/Stop button (circular, 64px). Two side-by-side A/B buttons. Active mode button has `ring-2 ring-cyan-400`.

---

## answer-slider-ui capability

**File:** `src/lib/components/AnswerSlider.svelte`

Props: `min: number`, `max: number`, `step: number`, `unit: string`, `label: string`, `value: number` (bindable), `disabled?: boolean`
Events: `change(number)`

Renders: `<input type="range">` + numeric value display + unit label. When `disabled`, input is `pointer-events-none opacity-50`.

---

## feedback-ui capability

**File:** `src/lib/components/FeedbackOverlay.svelte`

Props: `result: AnswerResult`, `visible: boolean`
Events: `next`

Shows: correct/incorrect status (green/red), user's answer, correct answer, points earned. "Next" button emits `next`. Animates in with a brief flash.

---

## score-display-ui capability

**File:** `src/lib/components/ScoreDisplay.svelte`

Props: `moduleId: ModuleId`

Reads `scores.getModuleScore(moduleId)` reactively. Displays: accuracy %, current streak, total points.

---

## difficulty-selector-ui capability

**File:** `src/lib/components/DifficultySelector.svelte`

Props: `moduleId: ModuleId`, `value: Difficulty`
Events: `change(Difficulty)`

Three buttons: Easy / Medium / Hard. Active button: `bg-zinc-700 ring-1 ring-cyan-400`. On click: emits `change` and calls `settings.setDifficulty(moduleId, difficulty)`.

---

## exercise-layout capability

**File:** `src/routes/exercise/+layout.svelte`

Contains: back link to `/`, module title (from page data or URL), `<DifficultySelector>`, `<ScoreDisplay>`, `{@render children()}`.

---

## decibel page capability

**File:** `src/routes/exercise/decibel/+page.svelte`

Exercise loop state (all `$state`):
- `exercise = generateExercise(currentDifficulty)`
- `userAnswer: number = 0`
- `result: AnswerResult | null = null`

On play: `engine.play(exercise.sampleId)`
On selectB: `engine.playWithEffect(exercise.sampleId, (ctx) => createGainEffect(ctx, exercise.params.gainDb))`
On selectA: `engine.play(exercise.sampleId)`
On submit: `result = evaluateAnswer(exercise, userAnswer); scores.recordAnswer(result)`
On next: `result = null; exercise = generateExercise(currentDifficulty); userAnswer = 0`

Slider props: `min=-12, max=12, step=difficulty===hard ? 0.5 : 1, unit="dB"`
