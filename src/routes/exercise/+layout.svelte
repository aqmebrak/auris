<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { settings } from '$lib/stores/settings.svelte.js';
	import DifficultySelector from '$lib/components/DifficultySelector.svelte';
	import ScoreDisplay from '$lib/components/ScoreDisplay.svelte';
	import type { ModuleId } from '$lib/exercises/types.js';

	const MODULE_TITLES: Record<ModuleId, string> = {
		decibel: 'Decibel Training',
		eq: 'EQ Training',
		panning: 'Stereo Panning',
		compression: 'Compression'
	};

	let { children } = $props();

	let moduleId = $derived(page.url.pathname.split('/')[2] as ModuleId);
	let title = $derived(MODULE_TITLES[moduleId] ?? 'Exercise');
	let difficulty = $derived(settings.difficulties[moduleId]);
</script>

<div class="min-h-screen bg-zinc-950 text-zinc-100">
	<header class="border-b border-zinc-800 px-4 py-3">
		<div class="mx-auto flex max-w-lg items-center justify-between">
			<a
				href={resolve('/')}
				class="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back
			</a>
			<h1 class="text-base font-semibold">{title}</h1>
			<ScoreDisplay {moduleId} />
		</div>
	</header>

	<div class="border-b border-zinc-800/60 px-4 py-2">
		<div class="mx-auto flex max-w-lg justify-center">
			<DifficultySelector {moduleId} value={difficulty} />
		</div>
	</div>

	<main>
		{@render children()}
	</main>
</div>
