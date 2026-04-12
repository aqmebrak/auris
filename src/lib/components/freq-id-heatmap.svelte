<script lang="ts">
	import type { StatsHistoryEntry } from '$lib/stores/stats-store.svelte.js';

	interface RoundMeta {
		targetFreq: number;
		correct: boolean;
	}

	interface Props {
		history: StatsHistoryEntry[];
	}

	let { history }: Props = $props();

	// Octave bands covering 20Hz–20kHz
	const BANDS = [
		{ label: '20', min: 20, max: 40 },
		{ label: '40', min: 40, max: 80 },
		{ label: '80', min: 80, max: 160 },
		{ label: '160', min: 160, max: 320 },
		{ label: '320', min: 320, max: 630 },
		{ label: '630', min: 630, max: 1250 },
		{ label: '1k', min: 1250, max: 2500 },
		{ label: '2.5k', min: 2500, max: 5000 },
		{ label: '5k', min: 5000, max: 10000 },
		{ label: '10k', min: 10000, max: 20000 }
	];

	interface BandStats {
		label: string;
		correct: number;
		total: number;
		accuracy: number | null;
	}

	const bandStats = $derived<BandStats[]>(
		(() => {
			const counts = BANDS.map((b) => ({ ...b, correct: 0, total: 0 }));

			for (const entry of history) {
				const rounds = entry.meta?.rounds as RoundMeta[] | undefined;
				if (!Array.isArray(rounds)) continue;
				for (const r of rounds) {
					const idx = counts.findIndex(
						(band) => r.targetFreq >= band.min && r.targetFreq < band.max
					);
					if (idx === -1) continue;
					counts[idx].total++;
					if (r.correct) counts[idx].correct++;
				}
			}

			return counts.map((b) => ({
				label: b.label,
				correct: b.correct,
				total: b.total,
				accuracy: b.total > 0 ? b.correct / b.total : null
			}));
		})()
	);

	const hasData = $derived(bandStats.some((b) => b.total > 0));

	function barColor(acc: number | null): string {
		if (acc === null) return 'bg-border';
		if (acc >= 0.8) return 'bg-green-600';
		if (acc >= 0.5) return 'bg-yellow-600';
		return 'bg-red-700';
	}
</script>

<div class="flex flex-col gap-3">
	<h3 class="text-xs font-medium tracking-widest text-muted-foreground uppercase">Freq Accuracy</h3>

	{#if !hasData}
		<p class="text-xs text-muted-foreground">Play a game to see per-band accuracy.</p>
	{:else}
		<div class="flex items-end gap-1" style="height: 48px;">
			{#each bandStats as band (band.label)}
				{@const barH = band.accuracy !== null ? Math.max(4, Math.round(band.accuracy * 48)) : 4}
				<div
					class="flex flex-1 flex-col items-center gap-0.5"
					title="{band.label}Hz — {band.total > 0
						? `${band.correct}/${band.total} (${Math.round((band.accuracy ?? 0) * 100)}%)`
						: 'no data'}"
				>
					<div
						class="w-full rounded-sm {barColor(band.accuracy)} transition-all duration-300"
						style="height: {barH}px;"
					></div>
				</div>
			{/each}
		</div>
		<div class="flex items-end gap-1">
			{#each bandStats as band (band.label)}
				<div class="flex-1 text-center font-mono text-[9px] leading-none text-muted-foreground">
					{band.label}
				</div>
			{/each}
		</div>
	{/if}
</div>
