<script lang="ts" generics="TRound">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { RoundResult } from '$lib/game/types.js';

	interface FormattedRow {
		label: string;
		primary: string;
		secondary: string | null;
		result: RoundResult;
	}

	interface Props {
		rounds: TRound[];
		score: number;
		totalRounds: number;
		/** Maps a round to display strings. Keeps the layout consistent across games. */
		formatRound: (round: TRound, index: number) => FormattedRow;
		onPlayAgain: () => void;
	}

	let { rounds, score, totalRounds, formatRound, onPlayAgain }: Props = $props();
</script>

<div class="flex flex-col gap-8">
	<div class="text-center">
		<h2 class="font-mono text-3xl font-bold tracking-widest uppercase">GAME OVER</h2>
		<p class="mt-4 font-mono text-6xl font-bold text-primary">{score} / {totalRounds}</p>
	</div>

	<ul class="flex flex-col gap-2" role="list">
		{#each rounds as round, i (i)}
			{@const row = formatRound(round, i)}
			<li class="flex items-center justify-between rounded border border-border px-4 py-3 text-sm">
				<span class="text-muted-foreground">{row.label}</span>
				<span class="font-mono">{row.primary}</span>
				{#if row.secondary !== null}
					<span class="font-mono text-muted-foreground">→ {row.secondary}</span>
				{/if}
				<span
					class="rounded px-2 py-0.5 text-xs font-semibold {row.result === 'correct'
						? 'bg-green-900 text-green-300'
						: 'bg-red-900 text-red-300'}"
				>
					{row.result === 'correct' ? 'CORRECT' : 'WRONG'}
				</span>
			</li>
		{/each}
	</ul>

	<div class="flex justify-center">
		<Button size="lg" class="px-12 tracking-widest" onclick={onPlayAgain}>PLAY AGAIN</Button>
	</div>
</div>
