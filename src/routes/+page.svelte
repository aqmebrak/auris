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

<main class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
	<StatsPanel />

	<section aria-label="Training modules" class="mt-8">
		<h2 class="mb-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
			TRAINING MODULES
		</h2>
		<ul role="list" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
