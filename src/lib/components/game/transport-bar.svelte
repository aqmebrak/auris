<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import AbToggle from '$lib/components/ab-toggle.svelte';
	import type { AbMode } from '$lib/audio/playable.js';
	import type { Phase } from '$lib/game/types.js';

	interface Props {
		phase: Exclude<Phase, 'gameOver'>;
		isPaused: boolean;
		isLoading: boolean;
		isLastRound: boolean;
		mode: AbMode;
		showAB: boolean;
		labels: Record<AbMode, string>;
		onStart: () => void;
		onPlayPause: () => void;
		onReplay: () => void;
		onModeChange: (mode: AbMode) => void;
		onNext: () => void;
	}

	let {
		phase,
		isPaused,
		isLoading,
		isLastRound,
		mode,
		showAB,
		labels,
		onStart,
		onPlayPause,
		onReplay,
		onModeChange,
		onNext
	}: Props = $props();

	const playing = $derived(phase === 'playing');
</script>

<!--
	Same two rows in every phase (toggle, then buttons) so the bar never changes
	height: idle shows PLAY + disabled controls, playing is live, result swaps
	the buttons for NEXT.
-->
<div class="flex flex-col items-center gap-3 md:flex-row md:justify-center md:gap-6">
	{#if showAB}
		<AbToggle {mode} onchange={onModeChange} {labels} disabled={!playing} />
	{/if}
	<div class="flex items-center justify-center gap-4">
		{#if phase === 'roundResult'}
			<Button size="lg" class="min-w-52 px-8 tracking-widest" onclick={onNext}>
				{isLastRound ? 'FINISH' : 'NEXT ROUND'}
			</Button>
		{:else if phase === 'idle'}
			<Button size="lg" class="px-8 tracking-widest" onclick={onStart} disabled={isLoading}>
				{isLoading ? 'LOADING…' : 'PLAY'}
			</Button>
			<Button variant="outline" size="lg" class="px-6 tracking-widest" disabled>REPLAY</Button>
		{:else}
			<Button variant="outline" size="lg" class="px-6 tracking-widest" onclick={onPlayPause}>
				{isPaused ? 'PLAY' : 'PAUSE'}
			</Button>
			<Button variant="outline" size="lg" class="px-6 tracking-widest" onclick={onReplay}>
				REPLAY
			</Button>
		{/if}
	</div>
</div>
