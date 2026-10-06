<script lang="ts" generics="T extends string | number">
	interface Props {
		choices: { value: T; label: string }[];
		/** Set on the result screen to reveal the correct answer. */
		target?: T | null;
		guess?: T | null;
		onSelect?: (value: T) => void;
		disabled?: boolean;
	}

	let { choices, target = null, guess = null, onSelect, disabled = false }: Props = $props();

	function cls(value: T): string {
		if (target !== null && value === target)
			return 'border-green-500 bg-green-950/30 text-green-400';
		if (guess !== null && value === guess) return 'border-red-500 bg-red-950/30 text-red-400';
		if (disabled) return 'border-border text-muted-foreground opacity-60';
		return 'border-border text-foreground hover:border-primary/60 hover:bg-primary/5';
	}
</script>

<div class="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:justify-center">
	{#each choices as choice (choice.value)}
		<button
			class="min-h-20 cursor-pointer rounded border px-6 font-mono text-xl tracking-widest transition-colors disabled:cursor-not-allowed sm:min-w-36 {cls(
				choice.value
			)}"
			{disabled}
			onclick={() => onSelect?.(choice.value)}
		>
			{choice.label}
		</button>
	{/each}
</div>
