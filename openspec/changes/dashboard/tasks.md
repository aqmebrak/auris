## 1. Root layout

- [ ] 1.1 Create `src/routes/+layout.ts` with `export const ssr = false; export const prerender = false;`
- [ ] 1.2 Create `src/routes/+layout.svelte` with dark wrapper `div.min-h-screen.bg-zinc-950.text-zinc-100`
- [ ] 1.3 Add nav bar with "Auris" wordmark and links to `/`, `/exercise/decibel`, `/exercise/eq`, `/exercise/panning`, `/exercise/compression`
- [ ] 1.4 Add `onMount(() => audioEngine.loadSamples([...all 5 sample ids...]))` in layout script
- [ ] 1.5 Add `{@render children()}` in `<main>`

## 2. ProgressBar component

- [ ] 2.1 Create `src/lib/components/ProgressBar.svelte`
- [ ] 2.2 Render outer bar `bg-zinc-800 rounded-full h-1.5` with inner fill `bg-cyan-400 h-full rounded-full transition-all`
- [ ] 2.3 Accept `value` (0-1), `label?`, `color?` props

## 3. ModuleCard component

- [ ] 3.1 Create `src/lib/components/ModuleCard.svelte`
- [ ] 3.2 Accept `moduleId`, `title`, `description`, `href` props
- [ ] 3.3 Read `scores.getModuleScore(moduleId)` and `settings.difficulties[moduleId]` reactively
- [ ] 3.4 Display: title, description, accuracy % (from getModuleScore), current streak, difficulty badge
- [ ] 3.5 Add `ProgressBar` showing accuracy as value (0-1)
- [ ] 3.6 Add "Start" button that navigates to `href`
- [ ] 3.7 Apply card styling: `bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors`

## 4. Dashboard page

- [ ] 4.1 Create `src/routes/+page.svelte`
- [ ] 4.2 Compute overall stats: overallAccuracy (average across modules), totalAttempts, totalPoints — use `$derived`
- [ ] 4.3 Render stats bar above the grid
- [ ] 4.4 Render `grid grid-cols-1 sm:grid-cols-2 gap-4` with one `ModuleCard` per module
- [ ] 4.5 Show welcome empty state when `totalAttempts === 0`

## 5. Final integration check

- [ ] 5.1 Navigate through all pages — no console errors, no blank screens
- [ ] 5.2 Complete one exercise in each module — score appears on dashboard after returning
- [ ] 5.3 Reload page — all scores and settings persist from localStorage
- [ ] 5.4 Run `npm run build` — static build succeeds with no errors
