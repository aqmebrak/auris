<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import AbToggle from '$lib/components/ab-toggle.svelte';
	import DifficultyCard from '$lib/components/difficulty-card.svelte';
	import FrequencyStrip from '$lib/components/FrequencyStrip.svelte';
	import GameOver from '$lib/components/game-over.svelte';
	import KnobStrip from '$lib/components/knob-strip.svelte';
	import RoundResult from '$lib/components/round-result.svelte';
	import { DIFFICULTY_CONFIG } from '$lib/game/config.js';
	import { createGameSession, evaluateGuess } from '$lib/game/engine.js';
	import type { Difficulty, GameSession, GameState } from '$lib/game/types.js';
	import { FrequencyIdEngine } from '$lib/audio/frequency-id-engine.js';

	let gameState = $state<GameState>('idle');
	let session = $state<GameSession | null>(null);
	let abMode = $state<'A' | 'B'>('B');
	let freqKnobMoved = $state(false);

	// Knob values
	let freqValue = $state(1000);
	let gainValue = $state(0);
	let qValue = $state(1);

	const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

	// Audio engine — browser only
	let engine: FrequencyIdEngine | null = null;
	let engineLoaded = false;

	const currentRound = $derived(
		session && gameState !== 'idle' ? session.rounds[session.currentRoundIndex] : null
	);

	const diffConfig = $derived(
		session ? DIFFICULTY_CONFIG[session.difficulty] : DIFFICULTY_CONFIG['easy']
	);

	function resetKnobs() {
		freqValue = 1000;
		gainValue = 0;
		qValue = diffConfig.qMin + (diffConfig.qMax - diffConfig.qMin) / 2;
		freqKnobMoved = false;
	}

	async function startRound() {
		if (!session || !browser) return;
		const round = session.rounds[session.currentRoundIndex];
		if (!engine) {
			engine = new FrequencyIdEngine();
		}
		engine.setFilter(round.targetFreq, round.targetGainDb, round.targetQ);
		if (!engineLoaded) {
			await engine.load('/audio/freq-id-placeholder.wav');
			engineLoaded = true;
		}
		abMode = 'B';
		engine.play('B');
	}

	function selectDifficulty(difficulty: Difficulty) {
		session = createGameSession(difficulty);
		resetKnobs();
		gameState = 'round_active';
		startRound();
	}

	function handleAbChange(mode: 'A' | 'B') {
		abMode = mode;
		engine?.setMode(mode);
	}

	function handleFreqChange(v: number) {
		freqValue = v;
		freqKnobMoved = true;
	}

	function handleGainChange(v: number) {
		gainValue = v;
	}

	function handleQChange(v: number) {
		qValue = v;
	}

	const submitDisabled = $derived(!freqKnobMoved);

	function handleSubmit() {
		if (!session || submitDisabled) return;
		const round = session.rounds[session.currentRoundIndex];
		const result = evaluateGuess(round, freqValue);
		round.result = result;
		round.userFreq = freqValue;
		round.userGainDb = gainValue;
		round.userQ = qValue;
		if (result === 'correct') {
			session.score += 1;
		}
		gameState = 'round_result';
	}

	function handleNextRound() {
		if (!session) return;
		const isLast = session.currentRoundIndex >= 4;
		if (isLast) {
			session.endedAt = new Date().toISOString();
			engine?.stop();
			gameState = 'game_over';
		} else {
			session.currentRoundIndex += 1;
			resetKnobs();
			gameState = 'round_active';
			startRound();
		}
	}

	function handlePlayAgain() {
		if (!session) return;
		const difficulty = session.difficulty;
		session = createGameSession(difficulty);
		resetKnobs();
		gameState = 'round_active';
		startRound();
	}

	function handleHome() {
		engine?.stop();
	}
</script>

<svelte:head>
	<title>Frequency ID — Auris</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
	{#if gameState === 'idle' || gameState === 'selecting_difficulty'}
		<a
			href={resolve('/')}
			class="mb-6 inline-block text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground"
		>
			← Back
		</a>

		<h1 class="mb-1 text-sm font-semibold tracking-widest text-foreground uppercase">
			Frequency ID
		</h1>
		<p class="mb-8 text-xs text-muted-foreground">Select difficulty</p>

		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
			{#each difficulties as difficulty (difficulty)}
				<DifficultyCard
					{difficulty}
					gainRange={DIFFICULTY_CONFIG[difficulty].gainRange}
					errorMarginPct={DIFFICULTY_CONFIG[difficulty].errorMargin}
					qMin={DIFFICULTY_CONFIG[difficulty].qMin}
					qMax={DIFFICULTY_CONFIG[difficulty].qMax}
					onselect={selectDifficulty}
				/>
			{/each}
		</div>
	{:else if gameState === 'round_active' && session && currentRound}
		<!-- Round header -->
		<div class="mb-4 flex items-center justify-between">
			<span class="text-xs tracking-widest text-muted-foreground uppercase">
				Round {session.currentRoundIndex + 1} / 5
			</span>
			<AbToggle mode={abMode} onchange={handleAbChange} />
		</div>

		<!-- Main layout: FrequencyStrip + KnobStrip -->
		<div class="flex gap-4">
			<div class="flex-none self-stretch">
				<FrequencyStrip value={freqValue} />
			</div>
			<div class="flex-1">
				<KnobStrip
					{freqValue}
					{gainValue}
					{qValue}
					gainMin={-diffConfig.gainRange}
					gainMax={diffConfig.gainRange}
					qMin={diffConfig.qMin}
					qMax={diffConfig.qMax}
					onFreqChange={handleFreqChange}
					onGainChange={handleGainChange}
					onQChange={handleQChange}
				/>
			</div>
		</div>

		<!-- Submit -->
		<div class="mt-4 flex justify-end">
			<button
				class="h-8 rounded-none border border-border bg-primary px-4 text-xs font-semibold tracking-widest text-primary-foreground uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
				disabled={submitDisabled}
				aria-label="Submit frequency guess"
				aria-disabled={submitDisabled}
				onclick={handleSubmit}
			>
				SUBMIT
			</button>
		</div>
	{:else if gameState === 'round_result' && session && currentRound}
		<!-- Round result header -->
		<div class="mb-4">
			<span class="text-xs tracking-widest text-muted-foreground uppercase">
				Round {session.currentRoundIndex + 1} / 5
			</span>
		</div>

		<!-- Main layout: FrequencyStrip + RoundResult -->
		<div class="flex gap-4">
			<div class="flex-none self-stretch">
				<FrequencyStrip
					value={currentRound.userFreq ?? freqValue}
					targetValue={currentRound.targetFreq}
					showTarget={true}
				/>
			</div>
			<div class="flex-1">
				<RoundResult
					result={currentRound.result === 'pending' ? 'incorrect' : currentRound.result}
					targetFreq={currentRound.targetFreq}
					targetGainDb={currentRound.targetGainDb}
					targetQ={currentRound.targetQ}
					userFreq={currentRound.userFreq ?? freqValue}
					userGainDb={currentRound.userGainDb ?? gainValue}
					userQ={currentRound.userQ ?? qValue}
					errorMarginPct={currentRound.errorMarginPct}
					isLastRound={session.currentRoundIndex >= 4}
					onnext={handleNextRound}
				/>
			</div>
		</div>
	{:else if gameState === 'game_over' && session}
		<GameOver {session} onPlayAgain={handlePlayAgain} onHome={handleHome} />
	{/if}
</main>
