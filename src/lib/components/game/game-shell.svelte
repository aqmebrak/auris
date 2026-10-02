<script lang="ts" generics="TR extends SampleRound<TG>, TG, TO extends { roundCount: number }">
	import type { Snippet } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import GameHeader from '$lib/components/game/game-header.svelte';
	import PlaybackControls from '$lib/components/game/playback-controls.svelte';
	import RoundResult from '$lib/components/game/round-result.svelte';
	import GameOver from '$lib/components/game/game-over.svelte';
	import type { GameController } from '$lib/stores/game-controller.svelte.js';
	import type { SampleRound, RoundResult as Result } from '$lib/game/types.js';

	interface Row {
		label: string;
		primary: string;
		secondary: string | null;
		result: Result;
	}

	interface Props {
		ctrl: GameController<TR, TG, TO>;
		title: string;
		/** Option selectors, shown only before the first round. */
		options?: Snippet;
		/** Text shown above the board while idle (first round only). */
		intro?: string;
		/** Board rendered while idle (typically the disabled input). */
		idle?: Snippet<[TR]>;
		/** Board rendered while playing — the guess UI. */
		playing: Snippet<[TR]>;
		/** Helper line under the transport controls. */
		legend?: string;
		summary: Snippet<[TR]>;
		resultVisual?: Snippet<[TR]>;
		formatRound: (round: TR, index: number) => Row;
	}

	let {
		ctrl,
		title,
		options,
		intro,
		idle,
		playing,
		legend,
		summary,
		resultVisual,
		formatRound
	}: Props = $props();

	$effect(() => ctrl.mount());

	const game = $derived(ctrl.game);
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
		showStats={game.phase !== 'gameOver'}
	/>

	{#if game.phase === 'idle'}
		<div class="flex flex-col gap-8">
			{#if game.roundIndex === 0}
				{@render options?.()}
				{#if intro}<p class="text-sm text-muted-foreground">{intro}</p>{/if}
			{/if}
			{@render idle?.(game.currentRound)}
			<div class="flex justify-center">
				<Button
					size="lg"
					class="px-12 text-sm tracking-widest"
					onclick={() => ctrl.start()}
					disabled={ctrl.isLoading}
				>
					{ctrl.isLoading ? 'LOADING…' : 'PLAY'}
				</Button>
			</div>
		</div>
	{:else if game.phase === 'playing'}
		<div class="flex flex-col gap-8">
			{@render playing(game.currentRound)}
			<PlaybackControls
				isPaused={ctrl.isPaused}
				mode={ctrl.abMode}
				showAB={ctrl.hasAB}
				onPlayPause={() => ctrl.playPause()}
				onModeChange={(m) => ctrl.setMode(m)}
				onReplay={() => ctrl.replay()}
			/>
			{#if legend}
				<p class="text-center text-xs tracking-widest text-muted-foreground uppercase">
					{legend}
				</p>
			{/if}
		</div>
	{:else if game.phase === 'roundResult'}
		<RoundResult
			round={game.currentRound}
			result={game.currentRound.result}
			isLastRound={game.isLastRound}
			onNext={() => ctrl.next()}
			{summary}
			visual={resultVisual}
		/>
	{:else}
		<GameOver
			rounds={game.session.rounds}
			score={game.score}
			totalRounds={game.totalRounds}
			{formatRound}
			onPlayAgain={() => ctrl.playAgain()}
		/>
	{/if}
</main>
