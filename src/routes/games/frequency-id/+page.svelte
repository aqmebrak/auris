<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import FreqStrip from '$lib/components/freq-strip.svelte';
	import { audioEngine } from '$lib/audio.js';
	import {
		newGame,
		startRound,
		markPlaying,
		submitGuess,
		nextRound,
		scoreCorrect
	} from '$lib/game-frequency-id.js';
	import type { GameState } from '$lib/game-frequency-id.js';

	let game = $state<GameState>(newGame());

	// Detect touch device for instruction text
	let isTouchDevice = $state(false);
	$effect(() => {
		if (browser) {
			isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
		}
	});

	const currentRound = $derived(game.rounds[game.currentRound]);

	function formatFreq(freq: number): string {
		if (freq >= 1000) {
			return `${(freq / 1000).toFixed(1)} kHz`;
		}
		return `${Math.round(freq)} Hz`;
	}

	function handlePlay() {
		game = startRound(game);
		if (browser) {
			const round = game.rounds[game.currentRound];
			audioEngine.play(round.targetFreq, round.gainDb);
			setTimeout(() => {
				game = markPlaying(game);
			}, 3100);
		}
	}

	function handleReplay() {
		if (!browser) return;
		const round = game.rounds[game.currentRound];
		audioEngine.play(round.targetFreq, round.gainDb);
	}

	function handleSelect(freq: number) {
		game = submitGuess(game, freq);
	}

	function handleNextRound() {
		game = nextRound(game);
	}

	function handlePlayAgain() {
		audioEngine.stop();
		game = newGame();
	}

	const score = $derived(scoreCorrect(game));
</script>

<svelte:head>
	<title>Frequency ID — Auris</title>
</svelte:head>

<main class="mx-auto max-w-2xl px-4 py-8">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<a
			href={resolve('/')}
			class="text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground"
		>
			← Back
		</a>
		{#if game.phase !== 'gameOver'}
			<div class="flex items-center gap-4">
				<span class="font-mono text-xs text-muted-foreground">
					SCORE {score} / 5
				</span>
				<span class="text-xs tracking-widest text-muted-foreground uppercase">
					ROUND {game.currentRound + 1} / 5
				</span>
			</div>
		{/if}
	</div>

	{#if game.phase === 'idle'}
		<!-- IDLE phase -->
		<div class="flex flex-col gap-6">
			<p class="text-xs text-muted-foreground">Press PLAY to hear the audio</p>

			<!-- Boost/Cut not shown in idle — revealed in guessing -->

			<FreqStrip onSelect={handleSelect} disabled={true} />

			<div class="flex justify-center">
				<Button size="lg" onclick={handlePlay}>PLAY</Button>
			</div>
		</div>
	{:else if game.phase === 'playing'}
		<!-- PLAYING phase -->
		<div class="flex flex-col gap-6">
			<p class="text-xs text-muted-foreground">Listening...</p>

			<FreqStrip onSelect={handleSelect} disabled={true} />

			<div class="flex justify-center">
				<Button size="lg" disabled>PLAYING...</Button>
			</div>
		</div>
	{:else if game.phase === 'guessing'}
		<!-- GUESSING phase -->
		<div class="flex flex-col gap-6">
			<div class="flex items-center justify-between">
				<p class="text-xs text-muted-foreground">
					{#if isTouchDevice}
						Hold to aim, release to submit
					{:else}
						Click the frequency you hear
					{/if}
				</p>
				<span
					class="rounded border border-border px-2 py-0.5 font-mono text-xs tracking-widest {currentRound.gainDb >
					0
						? 'text-foreground'
						: 'text-muted-foreground'} uppercase"
				>
					{currentRound.gainDb > 0 ? 'BOOST' : 'CUT'}
					{Math.abs(currentRound.gainDb)} dB
				</span>
			</div>

			<FreqStrip onSelect={handleSelect} disabled={false} />

			<div class="flex justify-center">
				<Button variant="outline" onclick={handleReplay}>REPLAY</Button>
			</div>
		</div>
	{:else if game.phase === 'roundResult'}
		<!-- ROUND RESULT phase -->
		<div class="flex flex-col gap-6">
			<div
				class="rounded border border-border p-4 {currentRound.result === 'correct'
					? 'border-green-700 bg-green-950/30'
					: 'border-red-700 bg-red-950/30'}"
			>
				<p class="text-lg font-semibold">
					{currentRound.result === 'correct' ? 'CORRECT ✓' : 'WRONG ✗'}
				</p>
				<div class="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
					<span>
						Target: <span class="font-mono text-foreground"
							>{formatFreq(currentRound.targetFreq)}</span
						>
					</span>
					{#if currentRound.guess !== null}
						<span>
							Your guess: <span class="font-mono text-foreground"
								>{formatFreq(currentRound.guess)}</span
							>
						</span>
					{/if}
					<span class="mt-1">
						<span class="rounded border border-border px-1.5 py-0.5 font-mono text-xs uppercase">
							{currentRound.gainDb > 0 ? 'BOOST' : 'CUT'}
							{Math.abs(currentRound.gainDb)} dB
						</span>
					</span>
				</div>
			</div>

			<div class="flex justify-center">
				{#if game.currentRound >= 4}
					<Button onclick={handleNextRound}>FINISH</Button>
				{:else}
					<Button onclick={handleNextRound}>NEXT ROUND</Button>
				{/if}
			</div>
		</div>
	{:else if game.phase === 'gameOver'}
		<!-- GAME OVER phase -->
		<div class="flex flex-col gap-6">
			<div class="text-center">
				<h2 class="font-mono text-2xl font-bold tracking-widest uppercase">GAME OVER</h2>
				<p class="mt-2 font-mono text-4xl font-bold">{score} / 5</p>
			</div>

			<ul class="flex flex-col gap-2" role="list">
				{#each game.rounds as round, i (i)}
					<li
						class="flex items-center justify-between rounded border border-border px-3 py-2 text-xs"
					>
						<span class="text-muted-foreground">Round {i + 1}</span>
						<span class="font-mono">{formatFreq(round.targetFreq)}</span>
						{#if round.guess !== null}
							<span class="font-mono text-muted-foreground">→ {formatFreq(round.guess)}</span>
						{/if}
						<span
							class="rounded px-1.5 py-0.5 text-xs font-semibold {round.result === 'correct'
								? 'bg-green-900 text-green-300'
								: 'bg-red-900 text-red-300'}"
						>
							{round.result === 'correct' ? 'CORRECT' : 'WRONG'}
						</span>
					</li>
				{/each}
			</ul>

			<div class="flex justify-center">
				<Button onclick={handlePlayAgain}>PLAY AGAIN</Button>
			</div>
		</div>
	{/if}
</main>
