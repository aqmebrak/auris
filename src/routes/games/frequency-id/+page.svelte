<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import FreqStrip from '$lib/components/freq-strip.svelte';
	import AbToggle from '$lib/components/ab-toggle.svelte';
	import { FrequencyIdEngine } from '$lib/audio/frequency-id-engine.js';
	import {
		newGame,
		startRound,
		submitGuess,
		nextRound,
		scoreCorrect
	} from '$lib/game-frequency-id.js';
	import type { GameState } from '$lib/game-frequency-id.js';

	let game = $state<GameState>(newGame());

	let isTouchDevice = $state(false);
	let isPaused = $state(true);
	let isLoading = $state(false);
	let abMode = $state<'A' | 'B'>('B');

	let engine: FrequencyIdEngine | null = null;

	$effect(() => {
		if (browser) {
			isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
			if (!engine) engine = new FrequencyIdEngine();
		}
	});

	onDestroy(() => {
		if (engine) {
			engine.destroy();
			engine = null;
		}
	});

	const currentRound = $derived(game.rounds[game.currentRound]);

	function formatFreq(freq: number): string {
		if (freq >= 1000) {
			return `${(freq / 1000).toFixed(1)} kHz`;
		}
		return `${Math.round(freq)} Hz`;
	}

	async function handleStart() {
		if (!browser || !engine) return;
		isLoading = true;
		try {
			const round = game.rounds[game.currentRound];
			await engine.load(round.sampleUrl);
			engine.setFilter(round.targetFreq, round.gainDb, 2.5);
			abMode = 'B';
			engine.play('B');
			isPaused = false;
			game = startRound(game);
		} finally {
			isLoading = false;
		}
	}

	function handlePlayPause() {
		if (!engine) return;
		if (isPaused) {
			engine.resume();
			isPaused = false;
		} else {
			engine.pause();
			isPaused = true;
		}
	}

	function handleAbChange(mode: 'A' | 'B') {
		if (!engine) return;
		engine.setMode(mode);
		abMode = mode;
	}

	function handleReplay() {
		if (!engine) return;
		engine.play(abMode);
		isPaused = false;
	}

	function handleSelect(freq: number) {
		if (engine) engine.stop();
		isPaused = true;
		game = submitGuess(game, freq);
	}

	function handleNextRound() {
		if (engine) engine.stop();
		isPaused = true;
		game = nextRound(game);
	}

	function handlePlayAgain() {
		if (engine) engine.stop();
		isPaused = true;
		game = newGame();
	}

	const score = $derived(scoreCorrect(game));
</script>

<svelte:head>
	<title>Frequency ID — Auris</title>
</svelte:head>

<main class="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
	<!-- Header -->
	<div class="mb-10 flex items-center justify-between">
		<a
			href={resolve('/')}
			class="text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground"
		>
			← Back
		</a>
		{#if game.phase !== 'gameOver'}
			<div class="flex items-center gap-6">
				<span class="font-mono text-sm text-muted-foreground">
					SCORE <span class="text-foreground">{score}</span> / 5
				</span>
				<span class="text-sm tracking-widest text-muted-foreground uppercase">
					ROUND <span class="font-mono text-foreground">{game.currentRound + 1}</span> / 5
				</span>
			</div>
		{/if}
	</div>

	{#if game.phase === 'idle'}
		<!-- IDLE phase -->
		<div class="flex flex-col gap-8">
			<p class="text-sm text-muted-foreground">
				Press PLAY to hear the audio. Your task: identify the frequency band where the EQ is
				applied.
			</p>

			<FreqStrip onSelect={handleSelect} disabled={true} />

			<div class="flex justify-center">
				<Button
					size="lg"
					class="px-12 text-sm tracking-widest"
					onclick={handleStart}
					disabled={isLoading}
				>
					{isLoading ? 'LOADING…' : 'PLAY'}
				</Button>
			</div>
		</div>
	{:else if game.phase === 'guessing'}
		<!-- GUESSING phase -->
		<div class="flex flex-col gap-8">
			<div class="flex items-center justify-between">
				<p class="text-sm text-muted-foreground">
					{#if isTouchDevice}
						Hold to aim, release to submit
					{:else}
						Click the frequency you hear
					{/if}
				</p>
			</div>

			<FreqStrip onSelect={handleSelect} disabled={false} />

			<div class="flex items-center justify-center gap-6">
				<Button variant="outline" size="lg" class="px-6 tracking-widest" onclick={handlePlayPause}>
					{isPaused ? 'PLAY' : 'PAUSE'}
				</Button>
				<AbToggle mode={abMode} onchange={handleAbChange} />
				<Button variant="outline" size="lg" class="px-6 tracking-widest" onclick={handleReplay}>
					REPLAY
				</Button>
			</div>
			<p class="text-center text-xs tracking-widest text-muted-foreground uppercase">
				A = dry signal &nbsp; · &nbsp; B = with EQ applied
			</p>
		</div>
	{:else if game.phase === 'roundResult'}
		<!-- ROUND RESULT phase -->
		<div class="flex flex-col gap-8">
			<div
				class="rounded border p-5 {currentRound.result === 'correct'
					? 'border-green-700 bg-green-950/30'
					: 'border-red-700 bg-red-950/30'}"
			>
				<p class="text-xl font-semibold tracking-wide">
					{currentRound.result === 'correct' ? 'CORRECT ✓' : 'WRONG ✗'}
				</p>
				<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
					<span>
						Target: <span class="font-mono text-foreground"
							>{formatFreq(currentRound.targetFreq)}</span
						>
					</span>
					{#if currentRound.guess !== null}
						<span>
							Your guess:
							<span class="font-mono text-foreground">{formatFreq(currentRound.guess)}</span>
						</span>
					{/if}
					<span class="rounded border border-border px-2 py-0.5 font-mono text-xs uppercase">
						{currentRound.gainDb > 0 ? 'BOOST' : 'CUT'}
						{Math.abs(currentRound.gainDb)} dB
					</span>
				</div>
			</div>

			<FreqStrip
				onSelect={() => {}}
				disabled={true}
				targetFreq={currentRound.targetFreq}
				guessFreq={currentRound.guess}
			/>

			<div class="flex justify-center">
				{#if game.currentRound >= 4}
					<Button size="lg" class="px-12 tracking-widest" onclick={handleNextRound}>FINISH</Button>
				{:else}
					<Button size="lg" class="px-12 tracking-widest" onclick={handleNextRound}
						>NEXT ROUND</Button
					>
				{/if}
			</div>
		</div>
	{:else if game.phase === 'gameOver'}
		<!-- GAME OVER phase -->
		<div class="flex flex-col gap-8">
			<div class="text-center">
				<h2 class="font-mono text-3xl font-bold tracking-widest uppercase">GAME OVER</h2>
				<p class="mt-4 font-mono text-6xl font-bold text-primary">{score} / 5</p>
			</div>

			<ul class="flex flex-col gap-2" role="list">
				{#each game.rounds as round, i (i)}
					<li
						class="flex items-center justify-between rounded border border-border px-4 py-3 text-sm"
					>
						<span class="text-muted-foreground">Round {i + 1}</span>
						<span class="font-mono">{formatFreq(round.targetFreq)}</span>
						{#if round.guess !== null}
							<span class="font-mono text-muted-foreground">→ {formatFreq(round.guess)}</span>
						{/if}
						<span
							class="rounded px-2 py-0.5 text-xs font-semibold {round.result === 'correct'
								? 'bg-green-900 text-green-300'
								: 'bg-red-900 text-red-300'}"
						>
							{round.result === 'correct' ? 'CORRECT' : 'WRONG'}
						</span>
					</li>
				{/each}
			</ul>

			<div class="flex justify-center">
				<Button size="lg" class="px-12 tracking-widest" onclick={handlePlayAgain}>PLAY AGAIN</Button
				>
			</div>
		</div>
	{/if}
</main>
