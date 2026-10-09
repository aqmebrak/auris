<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { GAMES } from '$lib/games/registry.js';
	import type { GameSummary, Recommendation } from '$lib/stats.js';

	interface Props {
		summaries: Record<string, GameSummary>;
		recommendation: Recommendation | null;
	}

	let { summaries, recommendation }: Props = $props();

	const played = $derived(GAMES.filter((g) => summaries[g.id]?.sessions > 0));
	const sessions = $derived(played.reduce((sum, g) => sum + summaries[g.id].sessions, 0));
	const averages = $derived(
		played.map((g) => summaries[g.id].recentAvg).filter((a): a is number => a !== null)
	);
	const overall = $derived(
		averages.length ? Math.round(averages.reduce((a, b) => a + b, 0) / averages.length) : null
	);
	const target = $derived(
		recommendation ? GAMES.find((g) => g.id === recommendation.gameId) : null
	);
</script>

<section aria-label="Training progress" class="rounded-lg border border-border bg-card p-8">
	<div class="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
		<dl class="flex flex-col gap-2 py-4 first:pl-0 sm:px-6 sm:py-0">
			<dt class="text-xs font-medium tracking-widest text-muted-foreground uppercase">Sessions</dt>
			<dd class="text-3xl font-semibold tabular-nums">{sessions || '—'}</dd>
		</dl>
		<dl class="flex flex-col gap-2 py-4 sm:px-6 sm:py-0">
			<dt class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
				Recent accuracy
			</dt>
			<dd class="text-3xl font-semibold tabular-nums">{overall === null ? '—' : `${overall}%`}</dd>
		</dl>
		<dl class="flex flex-col gap-2 py-4 last:pr-0 sm:px-6 sm:py-0">
			<dt class="text-xs font-medium tracking-widest text-muted-foreground uppercase">
				Modules tried
			</dt>
			<dd class="text-3xl font-semibold tabular-nums">{played.length} / {GAMES.length}</dd>
		</dl>
	</div>

	{#if recommendation && target}
		<div
			class="mt-6 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center"
		>
			<p class="text-sm text-muted-foreground" data-testid="recommendation">
				{#if recommendation.kind === 'start'}
					Not tried yet: <span class="text-foreground">{target.title}</span>
				{:else}
					Needs the most work: <span class="text-foreground">{target.title}</span>
					<span class="font-mono">({recommendation.avg}% recent)</span>
				{/if}
			</p>
			<Button href={target.href} variant="outline" class="tracking-widest uppercase">
				Practise {target.title}
			</Button>
		</div>
	{/if}
</section>
