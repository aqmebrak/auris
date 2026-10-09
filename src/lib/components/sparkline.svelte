<script lang="ts">
	interface Props {
		/** Values 0..100, oldest → newest. */
		values: number[];
		label?: string;
		class?: string;
	}

	let { values, label = 'Accuracy trend', class: className = 'h-8 w-28' }: Props = $props();

	const W = 112;
	const H = 32;
	const PAD = 3;

	const points = $derived(
		values.map((v, i) => {
			const x = values.length === 1 ? W / 2 : PAD + (i / (values.length - 1)) * (W - 2 * PAD);
			const y = H - PAD - (Math.max(0, Math.min(100, v)) / 100) * (H - 2 * PAD);
			return [x, y] as const;
		})
	);
	const path = $derived(
		points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
	);
	const last = $derived(points[points.length - 1]);
</script>

<svg viewBox="0 0 {W} {H}" class={className} role="img" aria-label="{label}: {values.join(', ')}">
	<line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="#27272a" stroke-width="1" />
	{#if values.length > 1}
		<path
			d={path}
			fill="none"
			stroke="oklch(0.7 0.28 340)"
			stroke-width="1.5"
			stroke-linejoin="round"
		/>
	{/if}
	{#if last}
		<circle cx={last[0]} cy={last[1]} r="2.5" fill="oklch(0.7 0.28 340)" />
	{/if}
</svg>
