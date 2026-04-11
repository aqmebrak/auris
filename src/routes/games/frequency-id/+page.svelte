<script lang="ts">
	import { resolve } from '$app/paths';
	import DifficultyCard from '$lib/components/difficulty-card.svelte';
	import { DIFFICULTY_CONFIG } from '$lib/game/config.js';
	import { createGameSession } from '$lib/game/engine.js';
	import type { Difficulty, GameSession, GameState } from '$lib/game/types.js';

	let gameState = $state<GameState>('idle');
	let session = $state<GameSession | null>(null);

	function selectDifficulty(difficulty: Difficulty) {
		session = createGameSession(difficulty);
		gameState = 'round_active';
	}

	const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
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
	{:else if session}
		<p class="text-sm text-muted-foreground">Game in progress… (coming soon)</p>
	{/if}
</main>
