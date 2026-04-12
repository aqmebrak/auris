<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import AbToggle from '$lib/components/ab-toggle.svelte';

	interface Props {
		isPaused: boolean;
		mode: 'A' | 'B';
		onPlayPause: () => void;
		onModeChange: (mode: 'A' | 'B') => void;
		onReplay: () => void;
	}

	let { isPaused, mode, onPlayPause, onModeChange, onReplay }: Props = $props();
</script>

<div class="flex items-center justify-center gap-6">
	<Button variant="outline" size="lg" class="px-6 tracking-widest" onclick={onPlayPause}>
		{isPaused ? 'PLAY' : 'PAUSE'}
	</Button>
	<AbToggle {mode} onchange={onModeChange} />
	<Button variant="outline" size="lg" class="px-6 tracking-widest" onclick={onReplay}>
		REPLAY
	</Button>
</div>
