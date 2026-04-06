# Dashboard Spec

## dashboard-page capability

**File:** `src/routes/+page.svelte`

Renders:
1. **Stats bar** (top): overall accuracy across all modules, total attempts, total points
2. **Module grid** (4 cards): one `ModuleCard` per module in a `grid grid-cols-2 gap-4` (or `grid-cols-1` on small screens)

Stats calculation (derived):
```typescript
overallAccuracy = average of scores.getAccuracy(moduleId) for all 4 modules
totalAttempts   = sum of modules[id].totalAttempts
totalPoints     = sum of modules[id].totalPoints
```

Empty state: if `totalAttempts === 0`, show a welcome message below the grid: "Start a module below to begin training your ears."

---

## module-card-ui capability

**File:** `src/lib/components/ModuleCard.svelte`

Props: `moduleId: ModuleId`, `title: string`, `description: string`, `href: string`

Reads from stores internally: `scores.getModuleScore(moduleId)`, `settings.difficulties[moduleId]`

Displays:
- Module title + 1-line description
- Accuracy % (0 decimals, e.g. "73%")
- Current streak (number + flame icon or dot indicator)
- Current difficulty badge (Easy / Medium / Hard)
- "Start" button → navigates to `href`

Styling: `bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors`

---

## progress-bar-ui capability

**File:** `src/lib/components/ProgressBar.svelte`

Props: `value: number` (0–1), `label?: string`, `color?: string`

Renders: outer `bg-zinc-800 rounded-full h-1.5`, inner `bg-cyan-400 h-full rounded-full` with `style="width: {value * 100}%"`. Transition on width change.

---

## root-layout capability

**File:** `src/routes/+layout.svelte`

Structure:
```
<div class="min-h-screen bg-zinc-950 text-zinc-100">
  <nav>  <!-- "Auris" wordmark + nav links -->
  <main>
    {@render children()}
  </main>
</div>
```

Nav links: "Home" (`/`), "Decibel" (`/exercise/decibel`), "EQ" (`/exercise/eq`), "Panning" (`/exercise/panning`), "Compression" (`/exercise/compression`)

`onMount`: calls `audioEngine.loadSamples(['pink-noise.mp3', 'drums-loop.mp3', 'guitar-loop.mp3', 'speech-male.mp3', 'speech-female.mp3'])` — idempotent, safe to call on every mount.

**File:** `src/routes/+layout.ts`
```typescript
export const ssr = false;
export const prerender = false;
```

---

## exercise-layout capability

**File:** `src/routes/exercise/+layout.svelte`

Structure:
```
<div class="...">
  <header>
    <a href="/">← Back</a>
    <DifficultySelector moduleId={...} />
    <ScoreDisplay moduleId={...} />
  </header>
  <main>{@render children()}</main>
</div>
```

The `moduleId` is derived from the current URL path: `page.url.pathname.split('/').at(-1)` cast to `ModuleId`.
