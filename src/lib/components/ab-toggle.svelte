<script lang="ts">
	let {
		mode,
		onchange
	}: {
		mode: 'A' | 'B';
		onchange: (m: 'A' | 'B') => void;
	} = $props();
</script>

<div role="group" aria-label="Audio source" class="flex border border-border">
	<button
		class="h-8 w-8 rounded-none font-mono text-xs font-semibold uppercase transition-colors {mode ===
		'A'
			? 'bg-primary text-primary-foreground'
			: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
		aria-pressed={mode === 'A'}
		onclick={() => onchange('A')}
	>
		A
	</button>
	<button
		class="h-8 w-8 rounded-none font-mono text-xs font-semibold uppercase transition-colors {mode ===
		'B'
			? 'bg-primary text-primary-foreground'
			: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
		aria-pressed={mode === 'B'}
		onclick={() => onchange('B')}
	>
		B
	</button>
</div>
