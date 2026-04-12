<script lang="ts">
	import EqCurve from '$lib/components/eq-curve.svelte';
	import { formatFreq, formatDb } from '$lib/format.js';
	import { eqConfigsEqual, type EqConfig } from '$lib/games/eq-guess/config.js';

	interface Props {
		options: [EqConfig, EqConfig];
		targetEq?: EqConfig | null;
		guess?: EqConfig | null;
		onSelect?: (eq: EqConfig) => void;
		disabled?: boolean;
	}

	let { options, targetEq = null, guess = null, onSelect, disabled = false }: Props = $props();

	function isTarget(eq: EqConfig): boolean {
		return targetEq !== null && eqConfigsEqual(eq, targetEq);
	}

	function isWrongGuess(eq: EqConfig): boolean {
		return guess !== null && eqConfigsEqual(eq, guess) && !isTarget(eq);
	}

	function cardClass(eq: EqConfig): string {
		if (isTarget(eq)) return 'border-green-500 bg-green-950/20 text-green-400';
		if (isWrongGuess(eq)) return 'border-red-500 bg-red-950/20 text-red-400';
		if (disabled) return 'border-border opacity-60 cursor-not-allowed';
		return 'border-border hover:border-primary/40 cursor-pointer';
	}

	function bandLabel(eq: EqConfig): string {
		return eq.map((b) => `${formatFreq(b.freq)} ${formatDb(b.gainDb)}`).join(' · ');
	}
</script>

<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
	{#each options as eq, i (i)}
		<button
			class="flex flex-col gap-3 rounded border p-4 text-left transition-colors {cardClass(eq)}"
			onclick={() => !disabled && onSelect?.(eq)}
			disabled={disabled && targetEq === null}
		>
			<EqCurve bands={eq} />
			<p class="font-mono text-xs text-muted-foreground">{bandLabel(eq)}</p>
		</button>
	{/each}
</div>
