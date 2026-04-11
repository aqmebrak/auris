<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import FreqStrip from '$lib/components/freq-strip.svelte';
	import { formatFreq } from '$lib/format.js';
	import type { Round } from '$lib/game-frequency-id.js';

	interface Props {
		round: Round;
		isLastRound: boolean;
		onNext: () => void;
	}

	let { round, isLastRound, onNext }: Props = $props();
</script>

<div class="flex flex-col gap-8">
	<div
		class="rounded border p-5 {round.result === 'correct'
			? 'border-green-700 bg-green-950/30'
			: 'border-red-700 bg-red-950/30'}"
	>
		<p class="text-xl font-semibold tracking-wide">
			{round.result === 'correct' ? 'CORRECT ✓' : 'WRONG ✗'}
		</p>
		<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
			<span>
				Target: <span class="font-mono text-foreground">{formatFreq(round.targetFreq)}</span>
			</span>
			{#if round.guess !== null}
				<span>
					Your guess: <span class="font-mono text-foreground">{formatFreq(round.guess)}</span>
				</span>
			{/if}
			<span class="rounded border border-border px-2 py-0.5 font-mono text-xs uppercase">
				{round.gainDb > 0 ? 'BOOST' : 'CUT'}
				{Math.abs(round.gainDb)} dB
			</span>
		</div>
	</div>

	<FreqStrip
		onSelect={() => {}}
		disabled={true}
		targetFreq={round.targetFreq}
		guessFreq={round.guess}
	/>

	<div class="flex justify-center">
		<Button size="lg" class="px-12 tracking-widest" onclick={onNext}>
			{isLastRound ? 'FINISH' : 'NEXT ROUND'}
		</Button>
	</div>
</div>
