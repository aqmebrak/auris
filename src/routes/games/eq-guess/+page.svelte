<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import EqChoice from '$lib/components/eq-choice.svelte';
	import GameHeader from '$lib/components/game/game-header.svelte';
	import PlaybackControls from '$lib/components/game/playback-controls.svelte';
	import RoundResult from '$lib/components/game/round-result.svelte';
	import GameOver from '$lib/components/game/game-over.svelte';
	import { createGameStore } from '$lib/stores/game-store.svelte.js';
	import { createStatsStore } from '$lib/stores/stats-store.svelte.js';
	import {
		createEqGuessConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ROUND_COUNT_OPTIONS,
		eqConfigsEqual,
		type EqGuessRound,
		type EqConfig,
		type EqGuessDifficulty,
		type EqGuessOptions
	} from '$lib/games/eq-guess/config.js';
	import { createEqGuessAudio } from '$lib/games/eq-guess/audio.js';
	import { formatFreq, formatDb } from '$lib/format.js';

	const stats = createStatsStore('eq-guess');
	const audio = createEqGuessAudio();

	let options = $state<EqGuessOptions>({ ...DEFAULT_OPTIONS });
	let game = $state(createGameStore(createEqGuessConfig(options)));

	let isPaused = $state(true);
	let isLoading = $state(false);
	let abMode = $state<'A' | 'B'>('B');
	let gameRecorded = $state(false);

	$effect(() => {
		if (browser) stats.refresh();
	});

	$effect(() => {
		if (game.phase === 'gameOver' && !gameRecorded) {
			stats.record(game.score, {
				difficulty: options.difficulty,
				roundCount: options.roundCount,
				rounds: game.session.rounds.map((r: EqGuessRound) => ({
					targetEq: r.targetEq,
					guess: r.guess,
					correct: r.result === 'correct'
				}))
			});
			gameRecorded = true;
		}
	});

	onDestroy(() => audio.destroy());

	function rebuildGame() {
		game = createGameStore(createEqGuessConfig(options));
		gameRecorded = false;
	}

	async function handleStart() {
		if (!browser) return;
		isLoading = true;
		try {
			const round = game.currentRound;
			await audio.chain.load(round.sampleUrl);
			audio.setFilters(round.targetEq);
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

	function handleSelect(eq: EqConfig) {
		audio.chain.stop();
		isPaused = true;
		game.submit(eq);
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

	function bandSummary(eq: EqConfig): string {
		return eq.map((b) => `${formatFreq(b.freq)} ${formatDb(b.gainDb)}`).join(' · ');
	}
</script>

<svelte:head>
	<title>EQ Guess — Auris</title>
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
			{#if game.roundIndex === 0}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
										options.difficulty = key as EqGuessDifficulty;
										rebuildGame();
									}}
								>
									{dcfg.label}
								</Button>
							{/each}
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<p class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
							Rounds
						</p>
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
					Press PLAY to hear the EQ'd audio (B). Use A/B to compare dry vs processed. Click the card
					that matches what you hear.
				</p>
			{/if}

			<!-- Placeholder EQ cards -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				{#each [0, 1] as i (i)}
					<div class="rounded border border-border p-4 opacity-30" aria-hidden="true">
						<div class="h-20 w-full rounded bg-zinc-900"></div>
						<p class="mt-3 font-mono text-xs text-muted-foreground">— Hz — dB · — Hz — dB</p>
					</div>
				{/each}
			</div>

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
			<p class="text-sm text-muted-foreground">Click the EQ that matches what you hear in B.</p>

			<EqChoice options={game.currentRound.options} onSelect={handleSelect} />

			<PlaybackControls
				{isPaused}
				mode={abMode}
				onPlayPause={handlePlayPause}
				onModeChange={handleAbChange}
				onReplay={handleReplay}
			/>
			<p class="text-center text-xs tracking-widest text-muted-foreground uppercase">
				A = dry (original) &nbsp;·&nbsp; B = EQ'd signal
			</p>
		</div>
	{:else if game.phase === 'roundResult'}
		<RoundResult
			round={game.currentRound}
			result={game.currentRound.result}
			isLastRound={game.isLastRound}
			onNext={handleNextRound}
		>
			{#snippet summary(round: EqGuessRound)}
				<span
					>Target: <span class="font-mono text-foreground">{bandSummary(round.targetEq)}</span
					></span
				>
				{#if round.guess && !eqConfigsEqual(round.guess, round.targetEq)}
					<span
						>Your guess: <span class="font-mono text-foreground">{bandSummary(round.guess)}</span
						></span
					>
				{/if}
			{/snippet}
			{#snippet visual(round: EqGuessRound)}
				<EqChoice
					options={round.options}
					targetEq={round.targetEq}
					guess={round.guess}
					disabled={true}
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
				primary: bandSummary(round.targetEq),
				secondary: round.guess ? bandSummary(round.guess) : null,
				result: round.result
			})}
			onPlayAgain={handlePlayAgain}
		/>
	{/if}
</main>
