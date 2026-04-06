# Compression Training Spec

## compression-exercise capability

**File:** `src/lib/exercises/compression.svelte.ts`

**Fixed audio params:** `knee: 3`, `attack: 0.01`, `release: 0.2` (all difficulties)

**Difficulty config:**
```typescript
DIFFICULTY_CONFIG = {
  easy: {
    thresholdOptions: [-20],
    ratioOptions: [1, 4],   // 1 = no compression (bypass via ratio), 4 = compressed
    fixedThreshold: -20,
    task: 'detect'           // answer: { detected: boolean }
  },
  medium: {
    thresholdOptions: [-20],
    ratioOptions: [2, 4, 8, 20],
    fixedThreshold: -20,
    task: 'ratio'            // answer: { ratio: number }
  },
  hard: {
    thresholdOptions: [-10, -20, -30, -40],
    ratioOptions: [2, 4, 8, 20],
    fixedThreshold: null,
    task: 'threshold-and-ratio'  // answer: { threshold: number; ratio: number }
  }
}
```

```typescript
generateExercise(difficulty: Difficulty, sampleId?: string): Exercise
```
Picks random `threshold` from `thresholdOptions` (or fixed), random `ratio` from `ratioOptions`. Returns `Exercise` with `params: CompressionParams`. On easy, correct answer is `detected: ratio !== 1`.

```typescript
evaluateAnswer(exercise: Exercise, userAnswer: { detected?: boolean; ratio?: number; threshold?: number }): AnswerResult
```
- Easy: `accuracy = userAnswer.detected === (exercise.params.ratio !== 1) ? 1 : 0`
- Medium: `accuracy = userAnswer.ratio === exercise.params.ratio ? 1 : 0`
- Hard: `accuracy = average of (threshold match ? 1 : 0) and (ratio match ? 1 : 0)`

---

## compression page capability

**File:** `src/routes/exercise/compression/+page.svelte`

On selectB: `engine.playWithEffect(sampleId, (ctx) => createCompressorEffect(ctx, exercise.params))`

Answer UI by difficulty:
- Easy: `<AnswerSelect options=[{label:'Yes – compressed', value:true}, {label:'No – unchanged', value:false}]>`
- Medium: `<AnswerSelect options=[{label:'2:1', value:2}, {label:'4:1', value:4}, {label:'8:1', value:8}, {label:'20:1', value:20}]>`
- Hard: Two `AnswerSelect` stacked:
  - Threshold: `[{label:'-10 dBFS', value:-10}, {label:'-20 dBFS', value:-20}, {label:'-30 dBFS', value:-30}, {label:'-40 dBFS', value:-40}]`
  - Ratio: same options as medium

Feedback on hard shows both threshold and ratio correct/wrong separately.
