<script lang="ts">
	import type { EqBand } from '$lib/games/eq-guess/config.js';

	interface Props {
		bands: EqBand[];
		width?: number;
		height?: number;
	}

	let { bands, width = 400, height = 80 }: Props = $props();

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

	// Gaussian bell curve approximation of a peaking EQ band
	function peakingGainAt(f: number, band: EqBand): number {
		const logRatio = Math.log2(f / band.freq);
		const sigma = 1.0 / (Math.SQRT2 * band.q);
		return band.gainDb * Math.exp(-0.5 * (logRatio / sigma) ** 2);
	}

	function totalGainDb(f: number): number {
		return bands.reduce((sum, b) => sum + peakingGainAt(f, b), 0);
	}

	function freqToX(f: number): number {
		return (Math.log(f / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN)) * width;
	}

	function dbToY(db: number): number {
		return height / 2 - (db / DB_RANGE) * (height / 2);
	}

	const curvePath = $derived(() => {
		const pts = Array.from({ length: POINTS }, (_, i) => {
			const t = i / (POINTS - 1);
			const f = FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** t;
			const x = freqToX(f).toFixed(1);
			const y = Math.max(0, Math.min(height, dbToY(totalGainDb(f)))).toFixed(1);
			return `${x},${y}`;
		});
		return 'M ' + pts.join(' L ');
	});
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

	<!-- EQ response curve -->
	<path d={curvePath()} fill="none" stroke="oklch(0.7 0.28 340)" stroke-width="1.5" />

	<!-- Band peak markers -->
	{#each bands as band (band.freq)}
		{@const px = freqToX(band.freq)}
		{@const py = dbToY(band.gainDb)}
		<circle cx={px} cy={py} r="3" fill="oklch(0.7 0.28 340)" />
	{/each}
</svg>
