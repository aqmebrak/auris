<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import DbChoice from '$lib/components/db-choice.svelte';
	import GameHeader from '$lib/components/game/game-header.svelte';
	import PlaybackControls from '$lib/components/game/playback-controls.svelte';
	import RoundResult from '$lib/components/game/round-result.svelte';
	import GameOver from '$lib/components/game/game-over.svelte';
	import { createGameStore } from '$lib/stores/game-store.svelte.js';
	import { createStatsStore } from '$lib/stores/stats-store.svelte.js';
	import {
		createDbChangeConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ROUND_COUNT_OPTIONS,
		type GainRound,
		type DbChangeOptions,
		type DbDifficulty
	} from '$lib/games/db-change/config.js';
	import { createDbChangeAudio } from '$lib/games/db-change/audio.js';
	import { formatDb } from '$lib/format.js';

	const stats = createStatsStore('db-change');
	const audio = createDbChangeAudio();

	let options = $state<DbChangeOptions>({ ...DEFAULT_OPTIONS });
	let game = $state(createGameStore(createDbChangeConfig(options)));

	let isPaused = $state(true);
	let isLoading = $state(false);
	let abMode = $state<'A' | 'B'>('B');
	let gameRecorded = $state(false);

	$effect(() => {
		if (browser) stats.refresh();
	});

	$effect(() => {
		if (game.phase === 'gameOver' && !gameRecorded) {
			const rounds = game.session.rounds.map((r: GainRound) => ({
				targetDb: r.targetDb,
				guess: r.guess,
				correct: r.result === 'correct'
			}));
			stats.record(game.score, {
				difficulty: options.difficulty,
				roundCount: options.roundCount,
				rounds
			});
			gameRecorded = true;
		}
	});

	onDestroy(() => audio.destroy());

	function rebuildGame() {
		game = createGameStore(createDbChangeConfig(options));
		gameRecorded = false;
	}

	async function handleStart() {
		if (!browser) return;
		isLoading = true;
		try {
			const round = game.currentRound;
			await audio.chain.load(round.sampleUrl);
			audio.setGain(round.targetDb);
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

	function handleSelect(db: number) {
		audio.chain.stop();
		isPaused = true;
		game.submit(db);
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
</script>

<svelte:head>
	<title>Level Change — Auris</title>
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
				<!-- Options -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
										options.difficulty = key as DbDifficulty;
										rebuildGame();
									}}
								>
									{dcfg.label}
								</Button>
							{/each}
						</div>
					</div>

					<!-- Round count -->
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
					Press PLAY to hear the audio. Use A/B to compare dry vs gained signal. Select the correct
					dB value.
				</p>
			{/if}

			<!-- Placeholder buttons -->
			<div class="grid grid-cols-2 gap-6">
				{#each [0, 1] as i (i)}
					<div
						class="min-h-40 rounded border border-border p-8 font-mono text-3xl tracking-widest text-muted-foreground/30 select-none"
					>
						— dB
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
			<p class="text-sm text-muted-foreground">Select which dB value was applied to the signal</p>

			<DbChoice options={game.currentRound.options} onSelect={handleSelect} />

			<PlaybackControls
				{isPaused}
				mode={abMode}
				onPlayPause={handlePlayPause}
				onModeChange={handleAbChange}
				onReplay={handleReplay}
			/>
			<p class="text-center text-xs tracking-widest text-muted-foreground uppercase">
				A = dry (original) &nbsp; · &nbsp; B = gained signal
			</p>
		</div>
	{:else if game.phase === 'roundResult'}
		<RoundResult
			round={game.currentRound}
			result={game.currentRound.result}
			isLastRound={game.isLastRound}
			onNext={handleNextRound}
		>
			{#snippet summary(round: GainRound)}
				<span>
					Target: <span class="font-mono text-foreground">{formatDb(round.targetDb)}</span>
				</span>
				{#if round.guess !== null}
					<span>
						Your guess: <span class="font-mono text-foreground">{formatDb(round.guess)}</span>
					</span>
				{/if}
			{/snippet}
			{#snippet visual(round: GainRound)}
				<DbChoice
					options={round.options}
					targetDb={round.targetDb}
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
				primary: formatDb(round.targetDb),
				secondary: round.guess !== null ? formatDb(round.guess) : null,
				result: round.result
			})}
			onPlayAgain={handlePlayAgain}
		/>
	{/if}
</main>
