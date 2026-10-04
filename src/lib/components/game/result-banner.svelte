<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { RoundResult } from '$lib/game/types.js';

	interface Props {
		result: RoundResult;
		/** 0..1 closeness; shown as a percentage for graded games. */
		score?: number;
		children: Snippet;
	}

	let { result, score, children }: Props = $props();
</script>

<div
	class="rounded border p-5 {result === 'correct'
		? 'animate-pulse-correct border-green-700 bg-green-950/30'
		: 'animate-shake-wrong border-red-700 bg-red-950/30'}"
>
	<p class="text-xl font-semibold tracking-wide">
		{result === 'correct' ? 'CORRECT ✓' : 'WRONG ✗'}
		{#if score !== undefined}
			<span class="ml-3 font-mono text-base text-muted-foreground"
				>{Math.round(score * 100)}% match</span
			>
		{/if}
	</p>
	<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
		{@render children()}
	</div>
</div>
