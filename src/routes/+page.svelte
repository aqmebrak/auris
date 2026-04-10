<script lang="ts">
	import StatsPanel from '$lib/components/stats-panel.svelte';
	import GameCard from '$lib/components/game-card.svelte';

	const GAMES = [
		{
			title: 'EQ Matching',
			description: 'Match the EQ curve by ear',
			href: '/games/eq-matching',
			available: false
		},
		{
			title: 'Frequency ID',
			description: 'Identify the boosted frequency band',
			href: '/games/frequency-id',
			available: false
		},
		{
			title: 'Dynamics',
			description: 'Recognize compression characteristics',
			href: '/games/dynamics',
			available: false
		}
	];
</script>

<svelte:head>
	<title>Auris</title>
</svelte:head>

<main class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<StatsPanel />

	<section aria-label="Training modules" class="mt-8">
		<h2 class="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-4">
			TRAINING MODULES
		</h2>
		<ul role="list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each GAMES as game (game.href)}
				<li>
					<GameCard
						title={game.title}
						description={game.description}
						href={game.href}
						available={game.available}
					/>
				</li>
			{/each}
		</ul>
	</section>
</main>
