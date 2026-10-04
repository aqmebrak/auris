<script lang="ts">
	import type { AbMode } from '$lib/audio/playable.js';

	interface Props {
		mode: AbMode;
		onchange: (m: AbMode) => void;
		/** What each side actually is, e.g. `{ A: 'Your EQ', B: 'Target' }`. */
		labels: Record<AbMode, string>;
		disabled?: boolean;
	}

	let { mode, onchange, labels, disabled = false }: Props = $props();
	const MODES: AbMode[] = ['A', 'B'];
</script>

<div
	role="group"
	aria-label="Audio source"
	class="grid w-full max-w-md grid-cols-2 border border-border md:w-80 {disabled
		? 'is-locked'
		: ''}"
>
	{#each MODES as m (m)}
		<button
			class="flex h-12 cursor-pointer flex-col items-center justify-center rounded-none text-xs font-semibold tracking-widest uppercase transition-colors disabled:cursor-not-allowed {mode ===
			m
				? 'bg-primary text-primary-foreground'
				: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
			aria-pressed={mode === m}
			{disabled}
			onclick={() => onchange(m)}
		>
			{labels[m]}
			<span class="font-mono text-[10px] font-normal opacity-60">key {m}</span>
		</button>
	{/each}
</div>
