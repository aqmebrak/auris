<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import FreqStrip from '$lib/components/freq-strip.svelte';
	import GameHeader from '$lib/components/game/game-header.svelte';
	import PlaybackControls from '$lib/components/game/playback-controls.svelte';
	import RoundResult from '$lib/components/game/round-result.svelte';
	import GameOver from '$lib/components/game/game-over.svelte';
	import { createGameStore } from '$lib/stores/game-store.svelte.js';
	import { createStatsStore } from '$lib/stores/stats-store.svelte.js';
	import { freqIdConfig, type FreqIdRound } from '$lib/games/freq-id/config.js';
	import { createFreqIdAudio } from '$lib/games/freq-id/audio.js';
	import { formatFreq } from '$lib/format.js';

	const game = createGameStore(freqIdConfig);
	const stats = createStatsStore(freqIdConfig.id);
	const audio = createFreqIdAudio();

	let isTouchDevice = $state(false);
	let isPaused = $state(true);
	let isLoading = $state(false);
	let abMode = $state<'A' | 'B'>('B');
	let gameRecorded = false;

	$effect(() => {
		if (browser) {
			isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
			stats.refresh();
		}
	});

	// Record the session once when we hit gameOver.
	$effect(() => {
		if (game.phase === 'gameOver' && !gameRecorded) {
			stats.record(game.score);
			gameRecorded = true;
		}
	});

	onDestroy(() => audio.destroy());

	async function handleStart() {
		if (!browser) return;
		isLoading = true;
		try {
			const round = game.currentRound;
			await audio.chain.load(round.sampleUrl);
			audio.setFilter(round.targetFreq, round.gainDb, 2.5);
			abMode = 'B';
			audio.chain.play('B');
			isPaused = false;
			game.start();
		} finally {
			isLoading = false;
		}
	}

	function handlePlayPause() {
		if (isPaused) {
			audio.chain.resume();
			isPaused = false;
		} else {
			audio.chain.pause();
			isPaused = true;
		}
	}

	function handleAbChange(mode: 'A' | 'B') {
		audio.chain.setMode(mode);
		abMode = mode;
	}

	function handleReplay() {
		audio.chain.play(abMode);
		isPaused = false;
	}

	function handleSelect(freq: number) {
		audio.chain.stop();
		isPaused = true;
		game.submit(freq);
	}

	function handleNextRound() {
		audio.chain.stop();
		isPaused = true;
		game.next();
	}

	function handlePlayAgain() {
		audio.chain.stop();
		isPaused = true;
		game.reset();
		gameRecorded = false;
	}
</script>

<svelte:head>
	<title>Frequency ID — Auris</title>
</svelte:head>

<main class="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
	<GameHeader
		score={game.score}
		roundIndex={game.roundIndex}
		totalRounds={game.totalRounds}
		showStats={game.phase !== 'gameOver'}
	/>

	{#if game.phase === 'idle'}
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
	{:else if game.phase === 'playing'}
		<div class="flex flex-col gap-8">
			<p class="text-sm text-muted-foreground">
				{#if isTouchDevice}
					Hold to aim, release to submit
				{:else}
					Click the frequency you hear
				{/if}
			</p>

			<FreqStrip onSelect={handleSelect} disabled={false} />

			<PlaybackControls
				{isPaused}
				mode={abMode}
				onPlayPause={handlePlayPause}
				onModeChange={handleAbChange}
				onReplay={handleReplay}
			/>
			<p class="text-center text-xs tracking-widest text-muted-foreground uppercase">
				A = dry signal &nbsp; · &nbsp; B = with EQ applied
			</p>
		</div>
	{:else if game.phase === 'roundResult'}
		<RoundResult
			round={game.currentRound}
			result={game.currentRound.result}
			isLastRound={game.isLastRound}
			onNext={handleNextRound}
		>
			{#snippet summary(round: FreqIdRound)}
				<span>
					Target: <span class="font-mono text-foreground">{formatFreq(round.targetFreq)}</span>
				</span>
				{#if round.guess !== null}
					<span>
						Your guess:
						<span class="font-mono text-foreground">{formatFreq(round.guess)}</span>
					</span>
				{/if}
				<span class="rounded border border-border px-2 py-0.5 font-mono text-xs uppercase">
					{round.gainDb > 0 ? 'BOOST' : 'CUT'}
					{Math.abs(round.gainDb)} dB
				</span>
			{/snippet}
			{#snippet visual(round: FreqIdRound)}
				<FreqStrip
					onSelect={() => {}}
					disabled={true}
					targetFreq={round.targetFreq}
					guessFreq={round.guess}
				/>
			{/snippet}
		</RoundResult>
	{:else if game.phase === 'gameOver'}
		<GameOver
			rounds={game.session.rounds}
			score={game.score}
			totalRounds={game.totalRounds}
			formatRound={(round, i) => ({
				label: `Round ${i + 1}`,
				primary: formatFreq(round.targetFreq),
				secondary: round.guess !== null ? formatFreq(round.guess) : null,
				result: round.result
			})}
			onPlayAgain={handlePlayAgain}
		/>
	{/if}
</main>
