<script lang="ts" generics="TR extends SampleRound<TG>, TG, TO extends { roundCount: number }">
	import type { Snippet } from 'svelte';
	import GameHeader from '$lib/components/game/game-header.svelte';
	import TransportBar from '$lib/components/game/transport-bar.svelte';
	import ResultBanner from '$lib/components/game/result-banner.svelte';
	import GameOver from '$lib/components/game/game-over.svelte';
	import type { GameController } from '$lib/stores/game-controller.svelte.js';
	import type { SampleRound, RoundResult as Result } from '$lib/game/types.js';
	import { boardState, type BoardState } from '$lib/game/board.js';

	interface Row {
		label: string;
		primary: string;
		secondary: string | null;
		result: Result;
	}

	interface Props {
		ctrl: GameController<TR, TG, TO>;
		title: string;
		/** Option selectors. Always rendered; locked once a game is under way. */
		options?: Snippet;
		/** Hint line before playing (and fallback while playing). */
		intro?: string;
		/** Hint line while playing, if different from `intro`. */
		instruction?: string;
		/**
		 * The game's board: rendered in idle, playing and result with the same
		 * structure. Use the `BoardState` flags to enable inputs / reveal answers.
		 */
		board: Snippet<[TR, BoardState]>;
		/** Result details shown under the board (summary chips, tables). */
		feedback: Snippet<[TR]>;
		/** What the A and B buttons play, in the game's own words. */
		modeLabels?: Record<'A' | 'B', string>;
		/** Optional note under the board. */
		legend?: string;
		/** Show per-round match % and session accuracy (games with `scoreGuess`). */
		graded?: boolean;
		formatRound: (round: TR, index: number) => Row;
	}

	let {
		ctrl,
		title,
		options,
		intro,
		instruction,
		board,
		feedback,
		modeLabels = { A: 'Original', B: 'Processed' },
		legend,
		graded = false,
		formatRound
	}: Props = $props();

	$effect(() => ctrl.mount());

	// The board stays put, so the result can land below the fold / under the transport bar
	let banner = $state<HTMLElement | null>(null);
	$effect(() => {
		banner?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	});

	const game = $derived(ctrl.game);
	const phase = $derived(game.phase);
	/** Options only change before the first round starts. */
	const optionsLocked = $derived(phase !== 'idle' || game.roundIndex > 0);
</script>

<svelte:head>
	<title>{title} — Auris</title>
</svelte:head>

<svelte:window onkeydown={(e) => ctrl.onKeydown(e)} />

<main class="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
	<GameHeader
		score={game.score}
		roundIndex={game.roundIndex}
		totalRounds={game.totalRounds}
		showStats={phase !== 'gameOver'}
	/>

	{#if phase === 'gameOver'}
		<GameOver
			rounds={game.session.rounds}
			score={game.score}
			totalRounds={game.totalRounds}
			accuracy={graded ? game.accuracy : undefined}
			{formatRound}
			onPlayAgain={() => ctrl.playAgain()}
		/>
	{:else}
		<div class="flex flex-col gap-8">
			<div
				data-testid="options"
				class={optionsLocked ? 'is-locked' : ''}
				inert={optionsLocked}
				aria-disabled={optionsLocked}
			>
				{@render options?.()}
			</div>

			<!-- Both texts share one grid cell, so the hint is always as tall as the longer one -->
			<div data-testid="hint" class="grid text-sm text-muted-foreground">
				<p class="col-start-1 row-start-1 {phase === 'idle' ? '' : 'invisible'}">{intro}</p>
				<p
					class="col-start-1 row-start-1 {phase === 'playing' ? '' : 'invisible'}"
					aria-hidden={phase !== 'playing'}
				>
					{instruction ?? intro}
				</p>
			</div>

			<div data-testid="board" class="flex flex-col gap-6">
				{@render board(
					game.currentRound,
					boardState(phase === 'playing' ? 'playing' : phase === 'roundResult' ? 'result' : 'idle')
				)}
			</div>

			{#if legend}
				<p class="text-center text-xs tracking-widest text-muted-foreground uppercase">
					{legend}
				</p>
			{/if}

			{#if phase === 'roundResult'}
				<div bind:this={banner} class="scroll-mb-44">
					<ResultBanner
						result={game.currentRound.result}
						score={graded ? game.currentRound.score : undefined}
					>
						{@render feedback(game.currentRound)}
					</ResultBanner>
				</div>
			{/if}

			<!-- Always present and the same size; stays in reach while scrolling the board -->
			<div
				data-testid="transport"
				class="sticky bottom-0 z-10 -mx-6 border-t border-border bg-background/95 px-6 py-3 backdrop-blur lg:-mx-8 lg:px-8"
			>
				<TransportBar
					{phase}
					isPaused={ctrl.isPaused}
					isLoading={ctrl.isLoading}
					isLastRound={game.isLastRound}
					mode={ctrl.abMode}
					showAB={ctrl.hasAB}
					labels={modeLabels}
					onStart={() => ctrl.start()}
					onPlayPause={() => ctrl.playPause()}
					onReplay={() => ctrl.replay()}
					onModeChange={(m) => ctrl.setMode(m)}
					onNext={() => ctrl.next()}
				/>
			</div>
		</div>
	{/if}
</main>
