# Panning Training Spec

## panning-exercise capability

**File:** `src/lib/exercises/panning.svelte.ts`

**Difficulty config:**
```typescript
DIFFICULTY_CONFIG = {
  easy:   { positions: [-1, 0, 1],                          tolerance: 0,   inputType: 'select' },
  medium: { positions: [-1, -0.5, 0, 0.5, 1],              tolerance: 0.2, inputType: 'slider' },
  hard:   { positions: range(-1, 1, 0.1) /* 21 positions */, tolerance: 0.1, inputType: 'slider' }
}
```

```typescript
generateExercise(difficulty: Difficulty, sampleId?: string): Exercise
```
Picks random `pan` from `positions`. Returns `Exercise` with `params: PanningParams { type: 'panning', pan }`, `correctAnswer: { type: 'panning', pan }`.

Question text:
- Easy: "Where is this sound positioned in the stereo field?"
- Medium/Hard: "What is the pan position of version B? (L = -100%, C = 0%, R = +100%)"

```typescript
evaluateAnswer(exercise: Exercise, userAnswer: number): AnswerResult
```
- Easy (tolerance 0): binary — `userAnswer === exercise.params.pan`
- Medium/Hard: `accuracy = clamp(1 - abs(userAnswer - exercise.params.pan) / tolerance, 0, 1)`

---

## answer-select-ui capability

**File:** `src/lib/components/AnswerSelect.svelte`

Props:
- `options: { label: string; value: unknown }[]`
- `selected: unknown`
- `disabled?: boolean`

Events: `select(unknown)`

Layout: Horizontal button group (or wrapping flex row for many options). Selected button: `bg-zinc-700 ring-1 ring-cyan-400`. All buttons: `px-4 py-2 rounded bg-zinc-800 border border-zinc-700 text-zinc-100`.

---

## panning page capability

**File:** `src/routes/exercise/panning/+page.svelte`

Exercise loop: same pattern as decibel.

On selectB: `engine.playWithEffect(sampleId, (ctx) => createPanEffect(ctx, exercise.params.pan))`

Answer input (conditional on difficulty):
- Easy: `<AnswerSelect options=[{label:'L', value:-1}, {label:'C', value:0}, {label:'R', value:1}]>`
- Medium/Hard: `<AnswerSlider min=-1 max=1 step=0.1 unit="" label="Pan position">`

For the slider: display value as `L{Math.abs(v)*100}%` if `v < 0`, `C` if `v === 0`, `R{v*100}%` if `v > 0`.

**Headphones notice:**
```svelte
{#if !$settings.headphonesNoticeDismissed}
  <div class="...banner...">
    Use headphones for accurate stereo perception.
    <button onclick={() => settings.dismissHeadphonesNotice()}>Dismiss</button>
  </div>
{/if}
```
