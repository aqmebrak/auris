# EQ Training Spec

## eq-exercise capability

**File:** `src/lib/exercises/eq.svelte.ts`

**Difficulty config:**
```typescript
DIFFICULTY_CONFIG = {
  easy: {
    bands: [250, 1000, 4000],
    gainRange: [-6, 6],
    Q: 1.0,
    requireBoostCut: false,
    requireGain: false,
    gainTolerance: 0
  },
  medium: {
    bands: [125, 250, 500, 1000, 2000, 4000, 8000],
    gainRange: [-6, 6],
    Q: 2.0,
    requireBoostCut: true,
    requireGain: false,
    gainTolerance: 0
  },
  hard: {
    bands: [125, 250, 500, 1000, 2000, 4000, 8000],
    gainRange: [-9, 9],   // never 0
    Q: 4.0,
    requireBoostCut: true,
    requireGain: true,
    gainTolerance: 3
  }
}
```

```typescript
generateExercise(difficulty: Difficulty, sampleId?: string): Exercise
```
Picks random `frequencyHz` from `bands`, random `gainDb` in `gainRange` (excluding 0), fixed `Q`. Returns `Exercise` with `params: EQParams`, `correctAnswer: { type: 'eq', frequencyHz, gainDb, boostOrCut: gainDb > 0 ? 'boost' : 'cut' }`.

```typescript
evaluateAnswer(
  exercise: Exercise,
  userAnswer: { frequencyHz: number; boostOrCut?: 'boost' | 'cut'; gainDb?: number }
): AnswerResult
```
- Frequency: binary — correct if `userAnswer.frequencyHz === exercise.params.frequencyHz`
- Boost/cut (medium+): binary — matches direction
- Gain (hard): `accuracy = clamp(1 - abs(userAnswer.gainDb - exercise.params.gainDb) / gainTolerance, 0, 1)`
- Final accuracy: average of required fields

---

## frequency-picker-ui capability

**File:** `src/lib/components/FrequencyPicker.svelte`

Props:
- `bands: number[]` — Hz values to display
- `selectedFrequency: number | null`
- `showBoostCut: boolean`
- `boostOrCut: 'boost' | 'cut' | null`
- `showGain: boolean`
- `gainDb: number`
- `disabled?: boolean`

Events: `selectFrequency(number)`, `selectBoostCut('boost' | 'cut')`, `gainChange(number)`

Layout:
- Row of band buttons labeled with formatted Hz (e.g. "250 Hz", "1 kHz", "4 kHz", "8 kHz")
- Selected band: `bg-cyan-500/20 ring-1 ring-cyan-400`
- When `showBoostCut`: two buttons ("Boost ↑" / "Cut ↓") below the band row
- When `showGain`: `AnswerSlider` below boost/cut with `min=-12, max=12, step=1, unit="dB"`

**Hz label formatting:**
- `< 1000`: `${hz} Hz`
- `>= 1000`: `${hz/1000} kHz`

---

## eq page capability

**File:** `src/routes/exercise/eq/+page.svelte`

Exercise loop state: same pattern as decibel page.

On selectB: `engine.playWithEffect(sampleId, (ctx) => createEQEffect(ctx, exercise.params.frequencyHz, exercise.params.gainDb, exercise.params.Q))`

`FrequencyPicker` props derived from difficulty:
- `bands = DIFFICULTY_CONFIG[difficulty].bands`
- `showBoostCut = DIFFICULTY_CONFIG[difficulty].requireBoostCut`
- `showGain = DIFFICULTY_CONFIG[difficulty].requireGain`

User answer object: `{ frequencyHz: selectedFrequency, boostOrCut, gainDb }` — only include fields required by difficulty before submitting.
