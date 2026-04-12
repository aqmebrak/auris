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
  game-store.svelte.ts   createGameStore<TR, TG>(config)
  stats-store.svelte.ts  createStatsStore(gameId)

src/lib/audio/           ← you compose these
  player.ts              AudioPlayer (owns context + buffer cache)
  effects.ts             createPeakingEq / createCompressor / createPanner
  chain.ts               AudioChain (player + effects + A/B routing)
  samples.ts             SAMPLES + pickTrack()

src/lib/components/game/ ← you render these
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

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import GameHeader from '$lib/components/game/game-header.svelte';
  import PlaybackControls from '$lib/components/game/playback-controls.svelte';
  import RoundResult from '$lib/components/game/round-result.svelte';
  import GameOver from '$lib/components/game/game-over.svelte';
  import { createGameStore } from '$lib/stores/game-store.svelte.js';
  import { createStatsStore } from '$lib/stores/stats-store.svelte.js';
  import { myConfig } from '$lib/games/my-game/config.js';
  import { createMyAudio } from '$lib/games/my-game/audio.js';

  const game = createGameStore(myConfig);
  const stats = createStatsStore(myConfig.id);
  const audio = createMyAudio();

  onDestroy(() => audio.chain.destroy());

  $effect(() => {
    if (game.phase === 'gameOver') stats.record(game.score);
  });

  // wire start / submit / next / playAgain handlers to audio + game
</script>

<GameHeader
  score={game.score}
  roundIndex={game.roundIndex}
  totalRounds={game.totalRounds}
  showStats={game.phase !== 'gameOver'}
/>

{#if game.phase === 'idle'}
  <!-- custom idle UI -->
{:else if game.phase === 'playing'}
  <!-- game-specific input + PlaybackControls -->
{:else if game.phase === 'roundResult'}
  <RoundResult
    round={game.currentRound}
    result={game.currentRound.result}
    isLastRound={game.isLastRound}
    onNext={() => game.next()}
  >
    {#snippet summary(round)} /* game-specific result text */ {/snippet}
    {#snippet visual(round)} /* optional visual */ {/snippet}
  </RoundResult>
{:else if game.phase === 'gameOver'}
  <GameOver
    rounds={game.session.rounds}
    score={game.score}
    totalRounds={game.totalRounds}
    formatRound={(round, i) => ({
      label: `Round ${i + 1}`,
      primary: /* target label */,
      secondary: /* guess label or null */,
      result: round.result
    })}
    onPlayAgain={() => game.reset()}
  />
{/if}
```

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
