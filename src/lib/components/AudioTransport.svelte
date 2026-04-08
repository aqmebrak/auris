<script lang="ts">
	interface Props {
		isPlaying: boolean;
		currentMode: 'A' | 'B';
		disabled?: boolean;
		onplay?: () => void;
		onstop?: () => void;
		onselectA?: () => void;
		onselectB?: () => void;
	}

	let { isPlaying, currentMode, disabled = false, onplay, onstop, onselectA, onselectB }: Props =
		$props();
</script>

<div class="flex items-center gap-6">
	<!-- Play/Stop — circular 64px -->
	<button
		onclick={() => (isPlaying ? onstop?.() : onplay?.())}
		{disabled}
		class="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 transition-all hover:bg-zinc-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
		aria-label={isPlaying ? 'Stop' : 'Play'}
	>
		{#if isPlaying}
			<span class="block h-5 w-5 rounded-sm bg-zinc-100"></span>
		{:else}
			<svg class="ml-1 h-6 w-6 text-zinc-100" fill="currentColor" viewBox="0 0 24 24">
				<path d="M8 5v14l11-7z" />
			</svg>
		{/if}
	</button>

	<!-- A/B toggle -->
	<div class="flex gap-2">
		<button
			onclick={onselectA}
			disabled={disabled || !isPlaying}
			class="h-12 w-12 rounded-lg bg-zinc-800 font-mono text-sm font-bold transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
			class:ring-2={currentMode === 'A' && isPlaying}
			class:ring-cyan-400={currentMode === 'A' && isPlaying}
			class:text-cyan-400={currentMode === 'A' && isPlaying}
			class:text-zinc-300={!(currentMode === 'A' && isPlaying)}
		>A</button>
		<button
			onclick={onselectB}
			disabled={disabled || !isPlaying}
			class="h-12 w-12 rounded-lg bg-zinc-800 font-mono text-sm font-bold transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
			class:ring-2={currentMode === 'B' && isPlaying}
			class:ring-cyan-400={currentMode === 'B' && isPlaying}
			class:text-cyan-400={currentMode === 'B' && isPlaying}
			class:text-zinc-300={!(currentMode === 'B' && isPlaying)}
		>B</button>
	</div>
</div>
