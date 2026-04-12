<script lang="ts">
	import { browser } from '$app/environment';
	import { createStatsStore } from '$lib/stores/stats-store.svelte.js';
	import FreqIdHeatmap from '$lib/components/freq-id-heatmap.svelte';

	// Dashboard currently surfaces Frequency ID stats only. When additional
	// games land, compose additional stores here.
	const freqId = createStatsStore('freq-id');

	$effect(() => {
		if (browser) freqId.refresh();
	});

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		try {
			return new Date(iso).toLocaleDateString();
		} catch {
			return '—';
		}
	}

	const gamesDisplay = $derived(freqId.gamesPlayed === 0 ? '—' : String(freqId.gamesPlayed));
	const bestDisplay = $derived(freqId.gamesPlayed === 0 ? '—' : `${freqId.bestScore} / 5`);
	const lastDisplay = $derived(formatDate(freqId.lastPlayed));
</script>

<section aria-label="Training statistics" class="rounded-lg border border-border bg-card p-8">
	<div class="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
		<dl class="flex flex-col gap-2 py-4 first:pl-0 last:pr-0 sm:px-6 sm:py-0">
			<dt class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
				Freq ID Games
			</dt>
			<dd
				class="text-3xl font-semibold text-foreground tabular-nums"
				aria-label={gamesDisplay === '—' ? 'Freq ID games played: no data' : undefined}
			>
				{gamesDisplay}
			</dd>
		</dl>
		<dl class="flex flex-col gap-2 py-4 first:pl-0 last:pr-0 sm:px-6 sm:py-0">
			<dt class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
				Best Score
			</dt>
			<dd
				class="text-3xl font-semibold text-foreground tabular-nums"
				aria-label={bestDisplay === '—' ? 'Best score: no data' : undefined}
			>
				{bestDisplay}
			</dd>
		</dl>
		<dl class="flex flex-col gap-2 py-4 first:pl-0 last:pr-0 sm:px-6 sm:py-0">
			<dt class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
				Last Played
			</dt>
			<dd
				class="text-3xl font-semibold text-foreground tabular-nums"
				aria-label={lastDisplay === '—' ? 'Last played: no data' : undefined}
			>
				{lastDisplay}
			</dd>
		</dl>
	</div>

	{#if freqId.gamesPlayed > 0}
		<div class="mt-6 border-t border-border pt-6">
			<FreqIdHeatmap history={freqId.history} />
		</div>
	{/if}
</section>
