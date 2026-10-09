<script lang="ts">
	import { browser } from '$app/environment';
	import DashboardSummary from '$lib/components/dashboard-summary.svelte';
	import FreqIdHeatmap from '$lib/components/freq-id-heatmap.svelte';
	import GameCard from '$lib/components/game-card.svelte';
	import { CATEGORIES, GAMES, gamesByCategory } from '$lib/games/registry.js';
	import { recommend, summarize, type GameSummary } from '$lib/stats.js';
	import { createStatsStore } from '$lib/stores/stats-store.svelte.js';

	const stores = Object.fromEntries(GAMES.map((g) => [g.id, createStatsStore(g.id)]));

	$effect(() => {
		if (browser) for (const store of Object.values(stores)) store.refresh();
	});

	const summaries = $derived(
		Object.fromEntries(GAMES.map((g) => [g.id, summarize(stores[g.id].history)])) as Record<
			string,
			GameSummary
		>
	);
	const recommendation = $derived(
		recommend(
			GAMES.map((g) => g.id),
			summaries
		)
	);
	const categories = gamesByCategory();
</script>

<svelte:head>
	<title>Auris</title>
</svelte:head>

<main class="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
	<DashboardSummary {summaries} {recommendation} />

	<section aria-label="Training modules" class="mt-12 flex flex-col gap-12">
		<h2 class="text-sm font-medium tracking-widest text-muted-foreground uppercase">
			TRAINING MODULES
		</h2>
		{#each categories as { category, games } (category)}
			<div>
				<h3 class="mb-1 text-xs font-semibold tracking-widest uppercase">
					{CATEGORIES[category].label}
				</h3>
				<p class="mb-5 text-xs text-muted-foreground">{CATEGORIES[category].blurb}</p>
				<ul role="list" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each games as game (game.id)}
						<li>
							<GameCard
								{game}
								summary={summaries[game.id]}
								suggested={recommendation?.gameId === game.id}
							/>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</section>

	{#if summaries['freq-id'].sessions > 0}
		<section
			aria-label="Frequency heatmap"
			class="mt-12 rounded-lg border border-border bg-card p-8"
		>
			<FreqIdHeatmap history={stores['freq-id'].history} />
		</section>
	{/if}
</main>
