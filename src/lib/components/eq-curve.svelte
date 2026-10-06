<script lang="ts">
	import { responseDb, type PeakingBand as EqBand } from '$lib/audio/eq-math.js';

	interface Props {
		bands: EqBand[];
		/** Second curve drawn dashed in green (e.g. the target next to the player's). */
		compare?: EqBand[];
		/** Tailwind classes sizing the container; the plot fills it. */
		class?: string;
	}

	let { bands, compare, class: className = 'h-24' }: Props = $props();

	const FREQ_MIN = 20;
	const FREQ_MAX = 20000;
	const DB_RANGE = 15; // ±15 dB visible
	const POINTS = 240;
	const PAD = { left: 30, right: 8, top: 8, bottom: 18 };

	const TICK_FREQS = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
	const TICK_LABELS: Record<number, string> = {
		50: '50',
		100: '100',
		200: '200',
		500: '500',
		1000: '1k',
		2000: '2k',
		5000: '5k',
		10000: '10k'
	};
	const DB_LINES = [-12, -6, 0, 6, 12];

	let boxWidth = $state(400);
	let boxHeight = $state(96);

	const plotW = $derived(Math.max(1, boxWidth - PAD.left - PAD.right));
	const plotH = $derived(Math.max(1, boxHeight - PAD.top - PAD.bottom));

	const freqToX = (f: number) =>
		PAD.left + (Math.log(f / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN)) * plotW;
	const dbToY = (db: number) => PAD.top + plotH / 2 - (db / DB_RANGE) * (plotH / 2);

	function pathFor(curve: EqBand[]): string {
		const pts = Array.from({ length: POINTS }, (_, i) => {
			const f = FREQ_MIN * (FREQ_MAX / FREQ_MIN) ** (i / (POINTS - 1));
			const db = Math.max(-DB_RANGE, Math.min(DB_RANGE, responseDb(f, curve)));
			return `${freqToX(f).toFixed(1)},${dbToY(db).toFixed(1)}`;
		});
		return 'M ' + pts.join(' L ');
	}

	const curvePath = $derived(pathFor(bands));
	const comparePath = $derived(compare ? pathFor(compare) : null);
	// Show band markers only when the curve is the player's own (no overlay)
	const showMarkers = $derived(!compare);
</script>

<div class="w-full {className}" bind:clientWidth={boxWidth} bind:clientHeight={boxHeight}>
	<svg width={boxWidth} height={boxHeight} aria-hidden="true" class="block">
		<!-- dB gridlines + labels -->
		{#each DB_LINES as db (db)}
			<line
				x1={PAD.left}
				x2={boxWidth - PAD.right}
				y1={dbToY(db)}
				y2={dbToY(db)}
				stroke={db === 0 ? '#52525b' : '#27272a'}
				stroke-width="1"
				stroke-dasharray={db === 0 ? '4 3' : undefined}
			/>
			<text
				x={PAD.left - 5}
				y={dbToY(db) + 3}
				text-anchor="end"
				font-size="9"
				fill="#52525b"
				font-family="monospace">{db > 0 ? '+' : ''}{db}</text
			>
		{/each}

		<!-- Frequency gridlines + labels -->
		{#each TICK_FREQS as f (f)}
			<line
				x1={freqToX(f)}
				x2={freqToX(f)}
				y1={PAD.top}
				y2={PAD.top + plotH}
				stroke="#27272a"
				stroke-width="1"
			/>
			<text
				x={freqToX(f)}
				y={boxHeight - 4}
				text-anchor="middle"
				font-size="9"
				fill="#52525b"
				font-family="monospace">{TICK_LABELS[f]}</text
			>
		{/each}

		{#if comparePath}
			<path d={comparePath} fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="6 4" />
		{/if}

		<path d={curvePath} fill="none" stroke="oklch(0.7 0.28 340)" stroke-width="2" />

		{#if showMarkers}
			{#each bands as band, i (i)}
				<circle
					cx={freqToX(band.freq)}
					cy={dbToY(Math.max(-DB_RANGE, Math.min(DB_RANGE, band.gainDb)))}
					r="4"
					fill="oklch(0.7 0.28 340)"
				/>
			{/each}
		{/if}
	</svg>
</div>
