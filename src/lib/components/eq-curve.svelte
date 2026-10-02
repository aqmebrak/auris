<script lang="ts">
	import { responseDb, type PeakingBand as EqBand } from '$lib/audio/eq-math.js';

	interface Props {
		bands: EqBand[];
		/** Second curve drawn dashed in green (e.g. the target next to the player's). */
		compare?: EqBand[];
		width?: number;
		height?: number;
	}

	let { bands, compare, width = 400, height = 80 }: Props = $props();

	const FREQ_MIN = 20;
	const FREQ_MAX = 20000;
	const DB_RANGE = 15; // ±15 dB visible
	const POINTS = 200;

	const TICK_FREQS = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
	const TICK_LABELS: Record<number, string> = {
		50: '50',
		100: '100',
		200: '200',
		500: '500',
		1000: '1k',
		2000: '2k',
		5000: '5k',
		10000: '10k',
		20000: '20k'
	};

	function freqToX(f: number): number {
		return (Math.log(f / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN)) * width;
	}

	function dbToY(db: number): number {
		return height / 2 - (db / DB_RANGE) * (height / 2);
	}

	function pathFor(curve: EqBand[]): string {
		const pts = Array.from({ length: POINTS }, (_, i) => {
			const t = i / (POINTS - 1);
			const f = FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** t;
			const x = freqToX(f).toFixed(1);
			const y = Math.max(0, Math.min(height, dbToY(responseDb(f, curve)))).toFixed(1);
			return `${x},${y}`;
		});
		return 'M ' + pts.join(' L ');
	}

	const curvePath = $derived(pathFor(bands));
	const comparePath = $derived(compare ? pathFor(compare) : null);
</script>

<svg viewBox="0 0 {width} {height}" class="w-full" style="height: {height}px;" aria-hidden="true">
	<!-- 0 dB baseline -->
	<line
		x1="0"
		y1={height / 2}
		x2={width}
		y2={height / 2}
		stroke="#3f3f46"
		stroke-width="1"
		stroke-dasharray="4 3"
	/>

	<!-- Frequency tick marks -->
	{#each TICK_FREQS as f (f)}
		{@const x = freqToX(f)}
		<line x1={x} y1={height - 10} x2={x} y2={height} stroke="#3f3f46" stroke-width="1" />
		<text
			{x}
			y={height - 1}
			text-anchor="middle"
			font-size="7"
			fill="#52525b"
			font-family="monospace">{TICK_LABELS[f]}</text
		>
	{/each}

	{#if comparePath}
		<path d={comparePath} fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="5 3" />
	{/if}

	<!-- EQ response curve -->
	<path d={curvePath} fill="none" stroke="oklch(0.7 0.28 340)" stroke-width="1.5" />

	<!-- Band peak markers -->
	{#each bands as band (band.freq)}
		{@const px = freqToX(band.freq)}
		{@const py = dbToY(band.gainDb)}
		<circle cx={px} cy={py} r="3" fill="oklch(0.7 0.28 340)" />
	{/each}
</svg>
