<script lang="ts">
	import { settings } from '$lib/stores/settings.svelte.js';
	import type { Difficulty, ModuleId } from '$lib/exercises/types.js';

	interface Props {
		moduleId: ModuleId;
		value: Difficulty;
		onchange?: (difficulty: Difficulty) => void;
	}

	let { moduleId, value, onchange }: Props = $props();

	const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

	function select(d: Difficulty) {
		settings.setDifficulty(moduleId, d);
		onchange?.(d);
	}
</script>

<div class="flex gap-1.5">
	{#each difficulties as difficulty (difficulty)}
		<button
			onclick={() => select(difficulty)}
			class="rounded px-3 py-1.5 text-sm font-medium capitalize transition-all"
			class:bg-zinc-700={value === difficulty}
			class:ring-1={value === difficulty}
			class:ring-cyan-400={value === difficulty}
			class:text-cyan-300={value === difficulty}
			class:bg-zinc-800={value !== difficulty}
			class:text-zinc-400={value !== difficulty}
			class:hover:bg-zinc-700={value !== difficulty}
		>
			{difficulty}
		</button>
	{/each}
</div>
