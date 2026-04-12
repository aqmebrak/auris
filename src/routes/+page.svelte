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
			available: true
		},
		{
			title: 'Level Change',
			description: 'Identify how much gain was applied to the signal',
			href: '/games/db-change',
			available: true
		},
		{
			title: 'Panning',
			description: 'Guess where the signal is panned in the stereo field',
			href: '/games/panning',
			available: true
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

<main class="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
	<StatsPanel />

	<section aria-label="Training modules" class="mt-12">
		<h2 class="mb-6 text-sm font-medium tracking-widest text-muted-foreground uppercase">
			TRAINING MODULES
		</h2>
		<ul role="list" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
