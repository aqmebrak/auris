<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import FreqStrip from '$lib/components/freq-strip.svelte';
	import AbToggle from '$lib/components/ab-toggle.svelte';
	import RoundResult from '$lib/components/round-result.svelte';
	import GameOver from '$lib/components/game-over.svelte';
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
	const score = $derived(scoreCorrect(game));

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
			<p class="text-sm text-muted-foreground">
				{#if isTouchDevice}
					Hold to aim, release to submit
				{:else}
					Click the frequency you hear
				{/if}
			</p>

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
		<RoundResult
			round={currentRound}
			isLastRound={game.currentRound >= 4}
			onNext={handleNextRound}
		/>
	{:else if game.phase === 'gameOver'}
		<GameOver rounds={game.rounds} {score} onPlayAgain={handlePlayAgain} />
	{/if}
</main>
