<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { formatFreq } from '$lib/format.js';
	import type { Round } from '$lib/game-frequency-id.js';

	interface Props {
		rounds: Round[];
		score: number;
		onPlayAgain: () => void;
	}

	let { rounds, score, onPlayAgain }: Props = $props();
</script>

<div class="flex flex-col gap-8">
	<div class="text-center">
		<h2 class="font-mono text-3xl font-bold tracking-widest uppercase">GAME OVER</h2>
		<p class="mt-4 font-mono text-6xl font-bold text-primary">{score} / 5</p>
	</div>

	<ul class="flex flex-col gap-2" role="list">
		{#each rounds as round, i (i)}
			<li class="flex items-center justify-between rounded border border-border px-4 py-3 text-sm">
				<span class="text-muted-foreground">Round {i + 1}</span>
				<span class="font-mono">{formatFreq(round.targetFreq)}</span>
				{#if round.guess !== null}
					<span class="font-mono text-muted-foreground">→ {formatFreq(round.guess)}</span>
				{/if}
				<span
					class="rounded px-2 py-0.5 text-xs font-semibold {round.result === 'correct'
						? 'bg-green-900 text-green-300'
						: 'bg-red-900 text-red-300'}"
				>
					{round.result === 'correct' ? 'CORRECT' : 'WRONG'}
				</span>
			</li>
		{/each}
	</ul>

	<div class="flex justify-center">
		<Button size="lg" class="px-12 tracking-widest" onclick={onPlayAgain}>PLAY AGAIN</Button>
	</div>
</div>
