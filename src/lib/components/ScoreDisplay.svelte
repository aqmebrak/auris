<script lang="ts">
	import { scores } from '$lib/stores/scores.svelte.js';
	import type { ModuleId } from '$lib/exercises/types.js';

	interface Props {
		moduleId: ModuleId;
	}

	let { moduleId }: Props = $props();

	let score = $derived(scores.getModuleScore(moduleId));
	let accuracyPct = $derived(
		score.totalAttempts === 0
			? 0
			: Math.round((score.correctAttempts / score.totalAttempts) * 100)
	);
</script>

<div class="flex gap-5 text-center text-sm">
	<div>
		<div class="text-zinc-500">Accuracy</div>
		<div class="font-mono font-bold text-zinc-100">{accuracyPct}%</div>
	</div>
	<div>
		<div class="text-zinc-500">Streak</div>
		<div class="font-mono font-bold text-zinc-100">{score.currentStreak}</div>
	</div>
	<div>
		<div class="text-zinc-500">Points</div>
		<div class="font-mono font-bold text-zinc-100">{score.totalPoints}</div>
	</div>
</div>
