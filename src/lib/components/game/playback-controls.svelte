<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import AbToggle from '$lib/components/ab-toggle.svelte';
	import type { AbMode } from '$lib/audio/playable.js';

	interface Props {
		isPaused: boolean;
		mode: AbMode;
		onPlayPause: () => void;
		onModeChange: (mode: AbMode) => void;
		onReplay: () => void;
		showAB?: boolean;
		labels?: Record<AbMode, string>;
	}

	let {
		isPaused,
		mode,
		onPlayPause,
		onModeChange,
		onReplay,
		showAB = true,
		labels = { A: 'Original', B: 'Processed' }
	}: Props = $props();
</script>

<div class="flex flex-col items-center gap-3 md:flex-row md:justify-center md:gap-6">
	{#if showAB}
		<AbToggle {mode} onchange={onModeChange} {labels} />
	{/if}
	<div class="flex items-center justify-center gap-4">
		<Button variant="outline" size="lg" class="px-6 tracking-widest" onclick={onPlayPause}>
			{isPaused ? 'PLAY' : 'PAUSE'}
		</Button>
		<Button variant="outline" size="lg" class="px-6 tracking-widest" onclick={onReplay}>
			REPLAY
		</Button>
	</div>
</div>
