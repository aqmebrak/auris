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
	import {
		createFreqIdConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ZONE_CONFIG,
		ROUND_COUNT_OPTIONS,
		type FreqIdRound,
		type FreqIdOptions,
		type Difficulty,
		type FreqZone
	} from '$lib/games/freq-id/config.js';
	import { createFreqIdAudio } from '$lib/games/freq-id/audio.js';
	import { formatFreq } from '$lib/format.js';

	const stats = createStatsStore('freq-id');
	const audio = createFreqIdAudio();

	let options = $state<FreqIdOptions>({ ...DEFAULT_OPTIONS });
	let game = $state(createGameStore(createFreqIdConfig(options)));

	let isTouchDevice = $state(false);
	let isPaused = $state(true);
	let isLoading = $state(false);
	let abMode = $state<'A' | 'B'>('B');
	let gameRecorded = $state(false);

	$effect(() => {
		if (browser) {
			isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
			stats.refresh();
		}
	});

	// Record the session once when we hit gameOver.
	$effect(() => {
		if (game.phase === 'gameOver' && !gameRecorded) {
			const rounds = game.session.rounds.map((r: FreqIdRound) => ({
				targetFreq: r.targetFreq,
				correct: r.result === 'correct'
			}));
			stats.record(game.score, {
				difficulty: options.difficulty,
				zone: options.zone,
				roundCount: options.roundCount,
				rounds
			});
			gameRecorded = true;
		}
	});

	onDestroy(() => audio.destroy());

	function rebuildGame() {
		game = createGameStore(createFreqIdConfig(options));
		gameRecorded = false;
	}

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
		rebuildGame();
	}

	const zone = $derived(ZONE_CONFIG[options.zone]);
	const diff = $derived(DIFFICULTY_CONFIG[options.difficulty]);
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
			<!-- Options -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<!-- Difficulty -->
				<div class="flex flex-col gap-2">
					<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
						Difficulty
					</p>
					<div class="flex gap-2">
						{#each Object.entries(DIFFICULTY_CONFIG) as [key, dcfg] (key)}
							<Button
								class="flex-1 rounded border px-3 py-2 text-xs tracking-widest uppercase transition-colors
									{options.difficulty === key
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border text-muted-foreground hover:border-foreground/40'}"
								onclick={() => {
									options.difficulty = key as Difficulty;
									rebuildGame();
								}}
							>
								{dcfg.label}
							</Button>
						{/each}
					</div>
				</div>

				<!-- Zone -->
				<div class="flex flex-col gap-2">
					<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">Zone</p>
					<div class="flex gap-2">
						{#each Object.keys(ZONE_CONFIG) as key (key)}
							<Button
								class="flex-1 rounded border px-2 py-2 text-xs tracking-widest uppercase transition-colors
									{options.zone === key
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border text-muted-foreground hover:border-foreground/40'}"
								onclick={() => {
									options.zone = key as FreqZone;
									rebuildGame();
								}}
							>
								{key}
							</Button>
						{/each}
					</div>
				</div>

				<!-- Round count -->
				<div class="flex flex-col gap-2">
					<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">Rounds</p>
					<div class="flex gap-2">
						{#each ROUND_COUNT_OPTIONS as n (n)}
							<Button
								class="flex-1 rounded border px-3 py-2 text-xs tracking-widest uppercase transition-colors
									{options.roundCount === n
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border text-muted-foreground hover:border-foreground/40'}"
								onclick={() => {
									options.roundCount = n;
									rebuildGame();
								}}
							>
								{n}
							</Button>
						{/each}
					</div>
				</div>
			</div>

			<p class="text-sm text-muted-foreground">
				Press PLAY to hear the audio. Identify the frequency band where the EQ is applied.
				<span class="ml-1 font-mono text-xs">
					margin ±{diff.errorMarginOctaves >= 1
						? '1 oct'
						: diff.errorMarginOctaves === 1 / 3
							? '⅓ oct'
							: '¼ oct'}
				</span>
			</p>

			<FreqStrip
				onSelect={handleSelect}
				disabled={true}
				freqMin={zone.min}
				freqMax={zone.max}
				errorMarginOctaves={diff.errorMarginOctaves}
			/>

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

			<FreqStrip
				onSelect={handleSelect}
				disabled={false}
				freqMin={zone.min}
				freqMax={zone.max}
				errorMarginOctaves={diff.errorMarginOctaves}
			/>

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
					freqMin={zone.min}
					freqMax={zone.max}
					errorMarginOctaves={diff.errorMarginOctaves}
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
