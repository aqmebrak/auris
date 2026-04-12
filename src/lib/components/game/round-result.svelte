<script lang="ts" generics="TRound">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Snippet } from 'svelte';
	import type { RoundResult } from '$lib/game/types.js';

	interface Props {
		round: TRound;
		result: RoundResult;
		isLastRound: boolean;
		onNext: () => void;
		/** Game-specific contents rendered inside the result card. */
		summary: Snippet<[TRound]>;
		/** Optional visual rendered below the card (e.g. FreqStrip). */
		visual?: Snippet<[TRound]>;
	}

	let { round, result, isLastRound, onNext, summary, visual }: Props = $props();
</script>

<div class="flex flex-col gap-8">
	<div
		class="rounded border p-5 {result === 'correct'
			? 'border-green-700 bg-green-950/30'
			: 'border-red-700 bg-red-950/30'}"
	>
		<p class="text-xl font-semibold tracking-wide">
			{result === 'correct' ? 'CORRECT ✓' : 'WRONG ✗'}
		</p>
		<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
			{@render summary(round)}
		</div>
	</div>

	{#if visual}
		{@render visual(round)}
	{/if}

	<div class="flex justify-center">
		<Button size="lg" class="px-12 tracking-widest" onclick={onNext}>
			{isLastRound ? 'FINISH' : 'NEXT ROUND'}
		</Button>
	</div>
</div>
