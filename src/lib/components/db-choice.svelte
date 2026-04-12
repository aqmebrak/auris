<script lang="ts">
	import { formatDb } from '$lib/format.js';

	interface Props {
		options: [number, number];
		/** Set on roundResult to reveal correct answer. */
		targetDb?: number | null;
		guess?: number | null;
		onSelect?: (db: number) => void;
		disabled?: boolean;
	}

	let { options, targetDb = null, guess = null, onSelect, disabled = false }: Props = $props();

	function cardClass(opt: number): string {
		const isTarget = targetDb !== null && opt === targetDb;
		const isWrongGuess = guess !== null && opt === guess && opt !== targetDb;
		if (isTarget) return 'border-green-500 bg-green-950/30 text-green-400 cursor-default';
		if (isWrongGuess) return 'border-red-500 bg-red-950/30 text-red-400 cursor-default';
		if (disabled) return 'border-border text-muted-foreground cursor-not-allowed opacity-60';
		return 'border-border text-foreground hover:border-primary/60 hover:bg-primary/5 cursor-pointer';
	}
</script>

<div class="grid grid-cols-2 gap-6">
	{#each options as opt (opt)}
		<button
			class="min-h-40 w-full rounded border p-8 font-mono text-3xl tracking-widest transition-colors {cardClass(
				opt
			)}"
			onclick={() => {
				if (!disabled || targetDb !== null) return;
				onSelect?.(opt);
			}}
			disabled={disabled && targetDb === null}
		>
			{formatDb(opt)}
		</button>
	{/each}
</div>
