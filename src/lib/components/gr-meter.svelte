<script lang="ts">
	interface Props {
		getReduction: () => number; // returns dB (0 = none, negative = reducing)
		active?: boolean;
	}

	let { getReduction, active = false }: Props = $props();

	let reductionDb = $state(0);

	// LED segment config: 20 segments, each = 1 dB of gain reduction
	const SEGMENTS = 20;

	function segmentColor(idx: number, lit: boolean): string {
		// idx 0 = 0dB end (right), idx 19 = -20dB end (left) → display reversed
		const dbPos = idx + 1; // dB of reduction this segment represents
		if (lit) {
			if (dbPos <= 6) return '#22c55e'; // green
			if (dbPos <= 12) return '#eab308'; // yellow
			return '#ef4444'; // red
		}
		if (dbPos <= 6) return '#14532d';
		if (dbPos <= 12) return '#422006';
		return '#450a0a';
	}

	$effect(() => {
		if (!active) {
			reductionDb = 0;
			return;
		}
		let rafId: number;
		function tick() {
			reductionDb = getReduction();
			rafId = requestAnimationFrame(tick);
		}
		rafId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(rafId);
	});

	// How many segments are lit: |reductionDb| segments from the left
	const litCount = $derived(Math.min(SEGMENTS, Math.round(Math.abs(reductionDb))));
</script>

<div class="flex flex-col gap-1.5">
	<p class="text-xs font-medium tracking-widest text-zinc-500 uppercase">GR</p>
	<div class="flex items-center gap-0.5 rounded bg-black p-2">
		{#each Array.from({ length: SEGMENTS }, (_, idx) => idx) as i (i)}
			<div
				class="h-5 w-3 rounded-sm transition-none"
				style="background-color: {segmentColor(i, i < litCount)};"
			></div>
		{/each}
		<div class="ml-2 flex flex-col justify-between self-stretch">
			<span class="font-mono text-[10px] text-zinc-600">0</span>
			<span class="font-mono text-[10px] text-zinc-600">-20</span>
		</div>
	</div>
</div>
