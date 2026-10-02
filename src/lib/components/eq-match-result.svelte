<script lang="ts">
	import EqCurve from '$lib/components/eq-curve.svelte';
	import type { EqBand } from '$lib/games/eq-matching/config.js';
	import { formatFreq, formatDb, formatQ } from '$lib/format.js';

	interface Props {
		target: EqBand[];
		guess: EqBand[];
		showQ: boolean;
	}

	let { target, guess, showQ }: Props = $props();

	const byFreq = (bands: EqBand[]) => [...bands].sort((a, b) => a.freq - b.freq);
	const targetSorted = $derived(byFreq(target));
	const guessSorted = $derived(byFreq(guess));
</script>

<div class="flex w-full flex-col gap-6">
	<div class="rounded border border-zinc-800 bg-zinc-950 p-3">
		<p class="mb-2 flex gap-4 text-xs tracking-widest uppercase">
			<span class="text-green-500">- - Target</span>
			<span class="text-primary">— Yours</span>
		</p>
		<EqCurve bands={guess} compare={target} height={110} />
	</div>

	<table class="w-full border-collapse font-mono text-sm">
		<thead>
			<tr class="text-xs tracking-widest text-muted-foreground uppercase">
				<th class="py-1 pr-4 text-left">Band</th>
				<th class="py-1 pr-4 text-left">Hz</th>
				<th class="py-1 pr-4 text-left">Gain</th>
				{#if showQ}<th class="py-1 text-left">Q</th>{/if}
			</tr>
		</thead>
		<tbody>
			{#each targetSorted as t, i (i)}
				{@const g = guessSorted[i]}
				<tr class="border-t border-zinc-800">
					<td class="py-2 pr-4 text-muted-foreground">{i + 1}</td>
					<td class="py-2 pr-4">
						<span class="text-green-400">{formatFreq(t.freq)}</span>
						{#if g && g.freq !== t.freq}<span class="ml-2 text-red-400">{formatFreq(g.freq)}</span
							>{/if}
					</td>
					<td class="py-2 pr-4">
						<span class="text-green-400">{formatDb(t.gainDb)}</span>
						{#if g && g.gainDb !== t.gainDb}<span class="ml-2 text-red-400"
								>{formatDb(g.gainDb)}</span
							>{/if}
					</td>
					{#if showQ}
						<td class="py-2">
							<span class="text-green-400">{formatQ(t.q)}</span>
							{#if g && g.q !== t.q}<span class="ml-2 text-red-400">{formatQ(g.q)}</span>{/if}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
