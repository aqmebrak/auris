# Auris — Game Engine

Generic primitives for round/score/audio/persistence. Each new game plugs in
by defining a config + UI; the engine handles the rest.

## Anatomy of a game

```
src/lib/game/            ← you don't touch this
  types.ts               GameConfig, GameSession, RoundBase, Phase
  session.ts             pure transitions: create / start / submit / next / score
  config.ts              defineGame helper

src/lib/stores/          ← you don't touch this
  game-controller.svelte.ts  createGameController(…) — page lifecycle
  game-store.svelte.ts   createGameStore<TR, TG>(config)
  stats-store.svelte.ts  createStatsStore(gameId)

src/lib/audio/           ← you compose these
  player.ts              AudioPlayer (owns context + buffer cache)
  effects.ts             createPeakingEq / createCompressor / createPanner
  chain.ts               AudioChain (player + effects + A/B routing)
  library.ts             typed sample library, filters, spectrum queries (see scripts/README.md)
  samples.ts             pickTrack(filter?) → URL

src/lib/components/game/ ← you render these
  game-shell.svelte      header + phase switching, driven by a controller
  option-group.svelte    idle-screen option selector
  game-header.svelte     score + round counter
  playback-controls.svelte   play/pause/AB/replay
  round-result.svelte    generic <TRound> with summary/visual snippets
  game-over.svelte       generic <TRound> with formatRound callback
```

## Adding a new game in ~4 files

### 1. Round type + config — `src/lib/games/<id>/config.ts`

```ts
import { defineGame } from '$lib/game/config.js';
import type { RoundBase } from '$lib/game/types.js';

export interface MyRound extends RoundBase<MyGuess> {
  // game-specific fields the round needs to render and score
}

export const myConfig = defineGame<MyRound, MyGuess>({
  id: 'my-game',
  roundCount: 5,
  generateRound: () => ({
    /* random round params */
    guess: null,
    result: 'pending'
  }),
  evaluateGuess: (round, guess) => /* true if correct */
});
```

### 2. Audio — `src/lib/games/<id>/audio.ts`

```ts
import { AudioPlayer } from '$lib/audio/player.js';
import { AudioChain } from '$lib/audio/chain.js';
import { createPeakingEq } from '$lib/audio/effects.js';

export function createMyAudio() {
	const player = new AudioPlayer();
	const chain = new AudioChain(player, [
		(ctx) => createPeakingEq(ctx, { freq: 1000, gainDb: 0, q: 2.5 })
		// add more effects as needed
	]);
	return { chain /* , typed setters for param tweaking */ };
}
```

### 3. Page — `src/routes/games/<id>/+page.svelte`

The controller owns audio lifecycle, A/B, play/pause/replay, stats recording,
option → store rebuilds and keyboard shortcuts (Space, A/B, Enter). The shell
owns header + phase switching. The page only supplies snippets.

```svelte
<script lang="ts">
  import GameShell from '$lib/components/game/game-shell.svelte';
  import OptionGroup from '$lib/components/game/option-group.svelte';
  import { createGameController } from '$lib/stores/game-controller.svelte.js';
  import { labelled, numbers } from '$lib/game/options.js';
  import { createMyConfig, DEFAULT_OPTIONS, DIFFICULTY_CONFIG, ROUND_COUNT_OPTIONS,
    type MyRound, type MyOptions } from '$lib/games/my-game/config.js';
  import { createMyAudio } from '$lib/games/my-game/audio.js';

  const audio = createMyAudio();
  const ctrl = createGameController<MyRound, MyGuess, MyOptions>({
    gameId: 'my-game',
    defaultOptions: DEFAULT_OPTIONS,
    createConfig: createMyConfig,
    audio: audio.chain,           // anything implementing Playable
    prepareRound: (r) => audio.setParam(r.target),
    sessionMeta: (rounds, o) => ({ difficulty: o.difficulty, rounds: [...] }),
    // hasAB: false              // for games with no A/B comparison
  });
</script>

<GameShell {ctrl} title="My Game" intro="…" instruction="…" modeLabels={{ A: 'Original', B: 'Processed' }}
  formatRound={...}>
  {#snippet options()} <OptionGroup label="Difficulty" choices={labelled(DIFFICULTY_CONFIG)}
    selected={ctrl.options.difficulty} onSelect={(v) => ctrl.setOption('difficulty', v)} /> {/snippet}

  <!-- ONE board for every phase: same structure, only flags change -->
  {#snippet board(round, ui)}
    <MyInput
      disabled={!ui.interactive}                 <!-- inputs live only while playing -->
      target={ui.revealed ? round.target : null} <!-- answer shown only on the result screen -->
      guess={ui.revealed ? round.guess : null}
      onSelect={(g) => ctrl.submit(g)}
    />
    <!-- extra controls (e.g. SUBMIT) are rendered in every phase, disabled unless ui.interactive -->
  {/snippet}

  {#snippet feedback(round)} <!-- summary chips / tables, shown under the board on result --> {/snippet}
</GameShell>
```

**No layout shift.** Anything that appears in a later state of the round is rendered
from the start, disabled (`ui.interactive`), never mounted later. Options, the hint line
and the transport bar are always present (the shell handles them). Hide secret values
with a `masked` mode, not by removing the element. `layout.e2e.ts` asserts options /
hint / board keep their position and size through idle → playing → result → next idle,
so register new games in `src/routes/games/game-fixtures.ts`.

Rounds must carry `sampleUrl` (`SampleRound` in `types.ts`). Reference
implementations: `frequency-id` (strip input), `db-change` (2AFC cards).

**Graded scoring:** add `scoreGuess(round, guess) → 0..1` and `passThreshold`
to the config. Rounds get a `score`; `ctrl.game.accuracy` is the 0–100 mean and
is stored in stats history.

### 4. Dashboard — `src/routes/+page.svelte`

Add an entry to the `GAMES` array with your new route.

## Rules of the road

- **Business logic in `.ts`**, UI in `.svelte`. Round generation, evaluation,
  audio graph assembly — all go in `.ts` files under `src/lib/games/<id>/`.
- **SSR-safe audio**: everything in `src/lib/audio/` guards `typeof window`.
  Instantiate audio at module top-level in pages — it's safe; methods no-op
  during SSR and build the real graph when `load()` runs in the browser.
- **Stats are namespaced**: `createStatsStore('my-game')` writes to
  `auris:stats:my-game`. No collisions, no shared state.
- **Shared UI first**: before hand-rolling new game UI, check if the existing
  `GameHeader` / `PlaybackControls` / `RoundResult` / `GameOver` already
  express what you need.
