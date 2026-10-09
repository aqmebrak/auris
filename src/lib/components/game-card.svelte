<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Sparkline from '$lib/components/sparkline.svelte';
	import type { GameInfo } from '$lib/games/registry.js';
	import type { GameSummary } from '$lib/stats.js';

	interface Props {
		game: GameInfo;
		summary: GameSummary;
		/** Highlight as the suggested next practice. */
		suggested?: boolean;
	}

	let { game, summary, suggested = false }: Props = $props();

	function formatDate(iso: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
	}
</script>

<Card.Root
	class="flex h-full flex-col justify-between gap-5 py-6 {suggested ? 'border-primary/60' : ''}"
>
	<Card.Header class="gap-2 px-6">
		<Card.Title
			class="flex items-center justify-between gap-3 text-base font-semibold tracking-wide"
		>
			{game.title}
			{#if suggested}
				<span
					class="rounded border border-primary/60 px-2 py-0.5 text-[10px] tracking-widest text-primary uppercase"
				>
					Suggested
				</span>
			{/if}
		</Card.Title>
		<Card.Description class="text-sm">{game.description}</Card.Description>
	</Card.Header>

	<Card.Content class="px-6">
		{#if summary.sessions === 0}
			<p class="text-xs tracking-widest text-muted-foreground uppercase">Not played yet</p>
		{:else}
			<div class="flex items-end justify-between gap-4">
				<dl class="grid grid-cols-2 gap-x-6 gap-y-1">
					<dt class="text-[10px] tracking-widest text-muted-foreground uppercase">Avg (last 5)</dt>
					<dt class="text-[10px] tracking-widest text-muted-foreground uppercase">Sessions</dt>
					<dd class="font-mono text-xl tabular-nums">
						{summary.recentAvg === null ? '—' : `${summary.recentAvg}%`}
					</dd>
					<dd class="font-mono text-xl tabular-nums">{summary.sessions}</dd>
				</dl>
				{#if summary.trend.length > 0}
					<Sparkline values={summary.trend} label="{game.title} accuracy trend" />
				{/if}
			</div>
			{#if summary.lastPlayed}
				<p class="mt-2 text-[10px] tracking-widest text-muted-foreground uppercase">
					Last played {formatDate(summary.lastPlayed)}
				</p>
			{/if}
		{/if}
	</Card.Content>

	<Card.Footer class="justify-center px-6">
		<Button size="lg" href={game.href} class="px-8 tracking-widest">PLAY</Button>
	</Card.Footer>
</Card.Root>
