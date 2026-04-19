<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import Knob from '$lib/components/knob.svelte';
	import EqCurve from '$lib/components/eq-curve.svelte';
	import GameHeader from '$lib/components/game/game-header.svelte';
	import PlaybackControls from '$lib/components/game/playback-controls.svelte';
	import RoundResult from '$lib/components/game/round-result.svelte';
	import GameOver from '$lib/components/game/game-over.svelte';
	import { createGameStore } from '$lib/stores/game-store.svelte.js';
	import { createStatsStore } from '$lib/stores/stats-store.svelte.js';
	import {
		createEqMatchingConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ROUND_COUNT_OPTIONS,
		FREQ_STEPS,
		Q_STEPS,
		defaultBands,
		type EqBand,
		type EqMatchingRound,
		type EqMatchingDifficulty,
		type EqMatchingOptions
	} from '$lib/games/eq-matching/config.js';
	import { EqMatchingAudio } from '$lib/games/eq-matching/audio.js';
	import { formatFreq, formatDb, formatQ } from '$lib/format.js';

	const stats = createStatsStore('eq-matching');
	const audio = new EqMatchingAudio();

	let options = $state<EqMatchingOptions>({ ...DEFAULT_OPTIONS });
	let game = $state(createGameStore(createEqMatchingConfig(options)));

	const bandCount = $derived(DIFFICULTY_CONFIG[options.difficulty].bandCount);
	const gainPool = $derived(DIFFICULTY_CONFIG[options.difficulty].gainPool);
	let userBands = $state<EqBand[]>(defaultBands(1));

	let isPaused = $state(true);
	let isLoading = $state(false);
	let abMode = $state<'A' | 'B'>('B');
	let gameRecorded = $state(false);

	$effect(() => {
		if (browser) stats.refresh();
	});

	// Reset user bands when difficulty changes (before game starts)
	$effect(() => {
		if (game.phase === 'idle' && game.roundIndex === 0) {
			userBands = defaultBands(bandCount);
		}
	});

	// Live sync knob state → audio
	$effect(() => {
		audio.setUserBands([...userBands]);
	});

	$effect(() => {
		if (game.phase === 'gameOver' && !gameRecorded) {
			stats.record(game.score, {
				difficulty: options.difficulty,
				roundCount: options.roundCount,
				rounds: game.session.rounds.map((r: EqMatchingRound) => ({
					targetBands: r.targetBands,
					guess: r.guess,
					correct: r.result === 'correct'
				}))
			});
			gameRecorded = true;
		}
	});

	onDestroy(() => audio.destroy());

	function rebuildGame() {
		game = createGameStore(createEqMatchingConfig(options));
		userBands = defaultBands(DIFFICULTY_CONFIG[options.difficulty].bandCount);
		gameRecorded = false;
	}

	async function handleStart() {
		if (!browser) return;
		isLoading = true;
		try {
			const round = game.currentRound;
			userBands = defaultBands(bandCount);
			await audio.load(round.sampleUrl);
			audio.setTargetBands(round.targetBands);
			audio.setUserBands(userBands);
			abMode = 'B';
			audio.play();
			isPaused = false;
			game.start();
		} finally {
			isLoading = false;
		}
	}

	function handlePlayPause() {
		if (isPaused) {
			audio.resume();
			isPaused = false;
		} else {
			audio.pause();
			isPaused = true;
		}
	}

	function handleAbChange(mode: 'A' | 'B') {
		audio.setMode(mode);
		abMode = mode;
	}

	function handleReplay() {
		audio.play();
		isPaused = false;
	}

	function handleSubmit() {
		audio.stop();
		isPaused = true;
		game.submit([...userBands]);
	}

	function handleNextRound() {
		audio.stop();
		isPaused = true;
		userBands = defaultBands(bandCount);
		game.next();
	}

	function handlePlayAgain() {
		audio.stop();
		isPaused = true;
		rebuildGame();
	}

	function bandSummary(bands: EqBand[]): string {
		return bands.map((b) => `${formatFreq(b.freq)} ${formatDb(b.gainDb)}`).join(' · ');
	}

	function sortedByFreq(bands: EqBand[]): EqBand[] {
		return [...bands].sort((a, b) => a.freq - b.freq);
	}
</script>

<svelte:head>
	<title>EQ Matching — Auris</title>
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
										options.difficulty = key as EqMatchingDifficulty;
										rebuildGame();
									}}
								>
									{dcfg.label} — {dcfg.bandCount} band{dcfg.bandCount > 1 ? 's' : ''}
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
					Press PLAY to hear the target EQ (B). Adjust the band knobs so A sounds like B. The curve
					shows your EQ live. Submit when you're happy.
				</p>
			{/if}

			<!-- Idle: grayed-out curve + knobs -->
			<div class="rounded border border-zinc-800 bg-zinc-950 p-6 opacity-50" aria-hidden="true">
				<EqCurve bands={userBands} height={100} />
				<div class="mt-6 flex flex-wrap justify-around gap-8">
					{#each userBands as band (band.freq)}
						<div class="flex items-end gap-4">
							<Knob
								steps={FREQ_STEPS}
								value={band.freq}
								label="HZ"
								format={formatFreq}
								onChange={() => {}}
								disabled={true}
							/>
							<Knob
								steps={gainPool}
								value={band.gainDb}
								label="GAIN"
								format={formatDb}
								onChange={() => {}}
								disabled={true}
							/>
							<Knob
								steps={Q_STEPS}
								value={band.q}
								label="Q"
								format={formatQ}
								onChange={() => {}}
								disabled={true}
							/>
						</div>
					{/each}
				</div>
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
		<div class="flex flex-col gap-6">
			<p class="text-sm text-muted-foreground">Adjust bands so A sounds like B, then submit.</p>

			<!-- Live EQ curve -->
			<div class="rounded border border-zinc-700 bg-zinc-950 p-4">
				<EqCurve bands={userBands} height={100} />
			</div>

			<!-- Knob groups per band -->
			<div class="flex flex-col gap-6">
				{#each userBands as band, i (i)}
					<div class="rounded border border-zinc-800 bg-zinc-950 px-6 py-4">
						<p class="mb-4 text-xs font-medium tracking-widest text-zinc-500 uppercase">
							Band {i + 1}
						</p>
						<div class="flex flex-wrap items-end gap-8">
							<Knob
								steps={FREQ_STEPS}
								value={band.freq}
								label="HZ"
								format={formatFreq}
								onChange={(v) => (userBands[i] = { ...userBands[i], freq: v })}
							/>
							<Knob
								steps={gainPool}
								value={band.gainDb}
								label="GAIN"
								format={formatDb}
								onChange={(v) => (userBands[i] = { ...userBands[i], gainDb: v })}
							/>
							<Knob
								steps={Q_STEPS}
								value={band.q}
								label="Q"
								format={formatQ}
								onChange={(v) => (userBands[i] = { ...userBands[i], q: v })}
							/>
						</div>
					</div>
				{/each}
			</div>

			<PlaybackControls
				{isPaused}
				mode={abMode}
				onPlayPause={handlePlayPause}
				onModeChange={handleAbChange}
				onReplay={handleReplay}
			/>
			<p class="text-center text-xs tracking-widest text-muted-foreground uppercase">
				A = your EQ &nbsp;·&nbsp; B = target (hidden)
			</p>

			<div class="flex justify-center">
				<Button size="lg" class="px-12 text-sm tracking-widest" onclick={handleSubmit}>
					SUBMIT
				</Button>
			</div>
		</div>
	{:else if game.phase === 'roundResult'}
		<RoundResult
			round={game.currentRound}
			result={game.currentRound.result}
			isLastRound={game.isLastRound}
			onNext={handleNextRound}
		>
			{#snippet summary(round: EqMatchingRound)}
				<span
					>Target: <span class="font-mono text-foreground">{bandSummary(round.targetBands)}</span
					></span
				>
				{#if round.guess}
					<span
						>Yours: <span class="font-mono text-foreground">{bandSummary(round.guess)}</span></span
					>
				{/if}
			{/snippet}
			{#snippet visual(round: EqMatchingRound)}
				<div class="w-full">
					<!-- Per-band comparison table -->
					<div class="mb-6 font-mono text-sm">
						<table class="w-full border-collapse">
							<thead>
								<tr class="text-xs tracking-widest text-muted-foreground uppercase">
									<th class="py-1 pr-4 text-left">Band</th>
									<th class="py-1 pr-4 text-left">Hz</th>
									<th class="py-1 pr-4 text-left">Gain</th>
									<th class="py-1 pr-4 text-left">Q</th>
									<th class="py-1 text-left">Match</th>
								</tr>
							</thead>
							<tbody>
								{#each sortedByFreq(round.targetBands) as target, i (i)}
									{@const guess = round.guess ? sortedByFreq(round.guess)[i] : null}
									{@const freqOk = guess?.freq === target.freq}
									{@const gainOk = guess?.gainDb === target.gainDb}
									{@const qOk = guess?.q === target.q}
									{@const allOk = freqOk && gainOk && qOk}
									<tr class="border-t border-zinc-800">
										<td class="py-2 pr-4 text-muted-foreground">{i + 1}</td>
										<td class="py-2 pr-4">
											<span class="text-green-400">{formatFreq(target.freq)}</span>
											{#if guess && !freqOk}
												<span class="ml-2 text-red-400">{formatFreq(guess.freq)}</span>
											{/if}
										</td>
										<td class="py-2 pr-4">
											<span class="text-green-400">{formatDb(target.gainDb)}</span>
											{#if guess && !gainOk}
												<span class="ml-2 text-red-400">{formatDb(guess.gainDb)}</span>
											{/if}
										</td>
										<td class="py-2 pr-4">
											<span class="text-green-400">{formatQ(target.q)}</span>
											{#if guess && !qOk}
												<span class="ml-2 text-red-400">{formatQ(guess.q)}</span>
											{/if}
										</td>
										<td class="py-2">{allOk ? '✓' : '✗'}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Side-by-side EQ curves -->
					<div class="grid grid-cols-2 gap-4">
						<div class="rounded border border-zinc-800 bg-zinc-950 p-3">
							<p class="mb-2 text-xs tracking-widest text-green-500 uppercase">Target</p>
							<EqCurve bands={round.targetBands} height={80} />
						</div>
						<div class="rounded border border-zinc-800 bg-zinc-950 p-3">
							<p class="mb-2 text-xs tracking-widest text-primary uppercase">Yours</p>
							<EqCurve bands={round.guess ?? []} height={80} />
						</div>
					</div>
				</div>
			{/snippet}
		</RoundResult>
	{:else if game.phase === 'gameOver'}
		<GameOver
			rounds={game.session.rounds}
			score={game.score}
			totalRounds={game.totalRounds}
			formatRound={(round, i) => ({
				label: `Round ${i + 1}`,
				primary: bandSummary(round.targetBands),
				secondary: round.guess ? bandSummary(round.guess) : null,
				result: round.result
			})}
			onPlayAgain={handlePlayAgain}
		/>
	{/if}
</main>
