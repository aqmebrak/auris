<script lang="ts">
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import Knob from '$lib/components/knob.svelte';
	import GrMeter from '$lib/components/gr-meter.svelte';
	import GameHeader from '$lib/components/game/game-header.svelte';
	import PlaybackControls from '$lib/components/game/playback-controls.svelte';
	import RoundResult from '$lib/components/game/round-result.svelte';
	import GameOver from '$lib/components/game/game-over.svelte';
	import { createGameStore } from '$lib/stores/game-store.svelte.js';
	import { createStatsStore } from '$lib/stores/stats-store.svelte.js';
	import {
		createCompressoristConfig,
		DEFAULT_OPTIONS,
		DEFAULT_USER_PARAMS,
		DIFFICULTY_CONFIG,
		ROUND_COUNT_OPTIONS,
		ATTACK_STEPS,
		RELEASE_STEPS,
		RATIO_STEPS,
		MAKEUP_STEPS,
		type CompressoristRound,
		type CompressionParams,
		type CompressorDifficulty,
		type CompressoristOptions
	} from '$lib/games/compressorist/config.js';
	import { CompressoristAudio } from '$lib/games/compressorist/audio.js';
	import { formatAttack, formatRelease, formatRatio, formatMakeup } from '$lib/format.js';

	const stats = createStatsStore('compressorist');
	const audio = new CompressoristAudio();

	let options = $state<CompressoristOptions>({ ...DEFAULT_OPTIONS });
	let game = $state(createGameStore(createCompressoristConfig(options)));
	let userParams = $state<CompressionParams>({ ...DEFAULT_USER_PARAMS });

	let isPaused = $state(true);
	let isLoading = $state(false);
	let abMode = $state<'A' | 'B'>('B');
	let gameRecorded = $state(false);

	$effect(() => {
		if (browser) stats.refresh();
	});

	// Keep user compressor in sync with knob state
	$effect(() => {
		audio.setUserParams({ ...userParams });
	});

	$effect(() => {
		if (game.phase === 'gameOver' && !gameRecorded) {
			stats.record(game.score, {
				difficulty: options.difficulty,
				roundCount: options.roundCount,
				rounds: game.session.rounds.map((r: CompressoristRound) => ({
					target: r.targetParams,
					guess: r.guess,
					correct: r.result === 'correct'
				}))
			});
			gameRecorded = true;
		}
	});

	onDestroy(() => audio.destroy());

	function rebuildGame() {
		game = createGameStore(createCompressoristConfig(options));
		gameRecorded = false;
	}

	async function handleStart() {
		if (!browser) return;
		isLoading = true;
		try {
			const round = game.currentRound;
			await audio.load(round.sampleUrl);
			audio.setTargetParams(round.targetParams);
			audio.setUserParams(userParams);
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
		game.submit({ ...userParams });
	}

	function handleNextRound() {
		audio.stop();
		isPaused = true;
		userParams = { ...DEFAULT_USER_PARAMS };
		game.next();
	}

	function handlePlayAgain() {
		audio.stop();
		isPaused = true;
		userParams = { ...DEFAULT_USER_PARAMS };
		rebuildGame();
	}

	const isPlaying = $derived(game.phase === 'playing');
</script>

<svelte:head>
	<title>Compressorist — Auris</title>
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
										options.difficulty = key as CompressorDifficulty;
										rebuildGame();
									}}>{dcfg.label}</Button
								>
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
									}}>{n}</Button
								>
							{/each}
						</div>
					</div>
				</div>
				<p class="text-sm text-muted-foreground">
					Press PLAY to hear the target compression (B). Adjust the knobs to match it (A). Submit
					when you're happy.
				</p>
			{/if}

			<!-- SSL panel (inactive) -->
			<div class="rounded border border-zinc-800 bg-zinc-950 p-6 opacity-50" aria-hidden="true">
				<div class="flex flex-wrap items-end justify-between gap-8">
					<Knob
						steps={ATTACK_STEPS}
						value={userParams.attack}
						label="ATTACK"
						format={formatAttack}
						onChange={() => {}}
						disabled={true}
					/>
					<Knob
						steps={RELEASE_STEPS}
						value={userParams.release}
						label="RELEASE"
						format={formatRelease}
						onChange={() => {}}
						disabled={true}
					/>
					<Knob
						steps={RATIO_STEPS}
						value={userParams.ratio}
						label="RATIO"
						format={formatRatio}
						onChange={() => {}}
						disabled={true}
					/>
					<Knob
						steps={MAKEUP_STEPS}
						value={userParams.makeup}
						label="MAKE UP"
						format={formatMakeup}
						onChange={() => {}}
						disabled={true}
					/>
					<div class="flex-1">
						<GrMeter getReduction={() => 0} active={false} />
					</div>
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
			<p class="text-sm text-muted-foreground">Adjust the knobs so A sounds like B, then submit.</p>

			<!-- SSL panel -->
			<div class="rounded border border-zinc-700 bg-zinc-950 p-6 shadow-xl">
				<div class="flex flex-wrap items-end justify-between gap-8">
					<Knob
						steps={ATTACK_STEPS}
						value={userParams.attack}
						label="ATTACK"
						format={formatAttack}
						onChange={(v) => (userParams.attack = v)}
					/>
					<Knob
						steps={RELEASE_STEPS}
						value={userParams.release}
						label="RELEASE"
						format={formatRelease}
						onChange={(v) => (userParams.release = v)}
					/>
					<Knob
						steps={RATIO_STEPS}
						value={userParams.ratio}
						label="RATIO"
						format={formatRatio}
						onChange={(v) => (userParams.ratio = v)}
					/>
					<Knob
						steps={MAKEUP_STEPS}
						value={userParams.makeup}
						label="MAKE UP"
						format={formatMakeup}
						onChange={(v) => (userParams.makeup = v)}
					/>
					<div class="min-w-48 flex-1">
						<GrMeter
							getReduction={() => audio.getReduction()}
							active={isPlaying && !isPaused && abMode === 'A'}
						/>
					</div>
				</div>
			</div>

			<PlaybackControls
				{isPaused}
				mode={abMode}
				onPlayPause={handlePlayPause}
				onModeChange={handleAbChange}
				onReplay={handleReplay}
			/>
			<p class="text-center text-xs tracking-widest text-muted-foreground uppercase">
				A = your compression &nbsp;·&nbsp; B = target (hidden)
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
			{#snippet summary(round: CompressoristRound)}
				{@const t = round.targetParams}
				{@const g = round.guess}
				<div class="w-full font-mono text-sm">
					<table class="w-full border-collapse">
						<thead>
							<tr class="text-xs tracking-widest text-muted-foreground uppercase">
								<th class="py-1 pr-4 text-left">Param</th>
								<th class="py-1 pr-4 text-left">Target</th>
								<th class="py-1 pr-4 text-left">Yours</th>
								<th class="py-1 text-left">Match</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="py-1 pr-4 text-muted-foreground">Attack</td>
								<td class="py-1 pr-4 text-green-400">{formatAttack(t.attack)}</td>
								<td
									class="py-1 pr-4 {g && g.attack === t.attack ? 'text-green-400' : 'text-red-400'}"
									>{g ? formatAttack(g.attack) : '—'}</td
								>
								<td class="py-1">{g && g.attack === t.attack ? '✓' : '✗'}</td>
							</tr>
							<tr>
								<td class="py-1 pr-4 text-muted-foreground">Release</td>
								<td class="py-1 pr-4 text-green-400">{formatRelease(t.release)}</td>
								<td
									class="py-1 pr-4 {g && g.release === t.release
										? 'text-green-400'
										: 'text-red-400'}">{g ? formatRelease(g.release) : '—'}</td
								>
								<td class="py-1">{g && g.release === t.release ? '✓' : '✗'}</td>
							</tr>
							<tr>
								<td class="py-1 pr-4 text-muted-foreground">Ratio</td>
								<td class="py-1 pr-4 text-green-400">{formatRatio(t.ratio)}</td>
								<td class="py-1 pr-4 {g && g.ratio === t.ratio ? 'text-green-400' : 'text-red-400'}"
									>{g ? formatRatio(g.ratio) : '—'}</td
								>
								<td class="py-1">{g && g.ratio === t.ratio ? '✓' : '✗'}</td>
							</tr>
							<tr>
								<td class="py-1 pr-4 text-muted-foreground">Makeup</td>
								<td class="py-1 pr-4 text-green-400">{formatMakeup(t.makeup)}</td>
								<td
									class="py-1 pr-4 {g && g.makeup === t.makeup ? 'text-green-400' : 'text-red-400'}"
									>{g ? formatMakeup(g.makeup) : '—'}</td
								>
								<td class="py-1">{g && g.makeup === t.makeup ? '✓' : '✗'}</td>
							</tr>
						</tbody>
					</table>
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
				primary: `${formatRatio(round.targetParams.ratio)} · ${formatAttack(round.targetParams.attack)}`,
				secondary: round.guess
					? `${formatRatio(round.guess.ratio)} · ${formatAttack(round.guess.attack)}`
					: null,
				result: round.result
			})}
			onPlayAgain={handlePlayAgain}
		/>
	{/if}
</main>
