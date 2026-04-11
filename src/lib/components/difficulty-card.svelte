<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { Difficulty } from '$lib/game/types.js';

	let {
		difficulty,
		gainRange,
		errorMarginPct,
		qMin,
		qMax,
		onselect
	}: {
		difficulty: Difficulty;
		gainRange: number;
		errorMarginPct: number;
		qMin: number;
		qMax: number;
		onselect: (d: Difficulty) => void;
	} = $props();
</script>

<button class="w-full cursor-pointer text-left" onclick={() => onselect(difficulty)}>
	<Card.Root class="transition-colors hover:bg-muted">
		<Card.Header>
			<Card.Title class="text-sm font-semibold tracking-wide text-foreground uppercase">
				{difficulty.toUpperCase()}
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="font-mono text-xs text-muted-foreground">±{gainRange} dB</p>
			<p class="font-mono text-xs text-muted-foreground">
				{Math.round(errorMarginPct * 100)}% tolerance
			</p>
			<p class="font-mono text-xs text-muted-foreground">Q {qMin}–{qMax}</p>
		</Card.Content>
	</Card.Root>
</button>
