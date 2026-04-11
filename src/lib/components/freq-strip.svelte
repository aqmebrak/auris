<script lang="ts">
	import { ERROR_MARGIN_OCTAVES } from '$lib/game-frequency-id.js';
	import { formatFreq } from '$lib/format.js';
	import { LOG_RANGE, posToFreq, freqToPct } from '$lib/frequency.js';

	interface Props {
		onSelect: (freq: number) => void;
		disabled?: boolean;
		/** When set, shows a persistent target marker (result phase). */
		targetFreq?: number | null;
		/** When set, shows a persistent guess marker (result phase). */
		guessFreq?: number | null;
	}

	let { onSelect, disabled = false, targetFreq = null, guessFreq = null }: Props = $props();

	let hoveredFreq: number | null = $state(null);
	let stripEl: HTMLDivElement | undefined = $state();

	const TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
	const TICK_LABELS: Record<number, string> = {
		20: '20',
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

	const MARGIN_RATIO = 2 ** ERROR_MARGIN_OCTAVES; // 2^(1/3) ≈ 1.26
	// Band half-width as a fraction of strip width (log scale — constant regardless of position)
	const MARGIN_HALF_PCT = (Math.log(MARGIN_RATIO) / LOG_RANGE) * 100;

	function handleMousemove(e: MouseEvent) {
		if (disabled) return;
		const el = e.currentTarget as HTMLDivElement;
		hoveredFreq = posToFreq(e.offsetX, el.clientWidth);
	}

	function handleMouseleave() {
		hoveredFreq = null;
	}

	function handleClick() {
		if (disabled || hoveredFreq === null) return;
		onSelect(hoveredFreq);
	}

	function handleTouchstart(e: TouchEvent) {
		e.preventDefault();
		if (disabled || !stripEl) return;
		const touch = e.touches[0];
		const rect = stripEl.getBoundingClientRect();
		const x = touch.clientX - rect.left;
		hoveredFreq = posToFreq(x, rect.width);
	}

	function handleTouchmove(e: TouchEvent) {
		e.preventDefault();
		if (disabled || !stripEl) return;
		const touch = e.touches[0];
		const rect = stripEl.getBoundingClientRect();
		const x = touch.clientX - rect.left;
		hoveredFreq = posToFreq(x, rect.width);
	}

	function handleTouchend() {
		if (disabled || hoveredFreq === null) return;
		onSelect(hoveredFreq);
		hoveredFreq = null;
	}

	const cursorPct = $derived(hoveredFreq !== null ? freqToPct(hoveredFreq) : null);
	const targetPct = $derived(
		targetFreq !== null && targetFreq !== undefined ? freqToPct(targetFreq) : null
	);
	const guessPct = $derived(
		guessFreq !== null && guessFreq !== undefined ? freqToPct(guessFreq) : null
	);
</script>

<div
	bind:this={stripEl}
	role="slider"
	aria-label="Frequency selector"
	aria-valuemin={20}
	aria-valuemax={20000}
	aria-valuenow={hoveredFreq ?? 20}
	class="relative min-h-55 w-full overflow-visible rounded border border-border bg-card pb-8
		{disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair'}"
	onmousemove={handleMousemove}
	onmouseleave={handleMouseleave}
	onclick={handleClick}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') handleClick();
	}}
	ontouchstart={handleTouchstart}
	ontouchmove={handleTouchmove}
	ontouchend={handleTouchend}
	tabindex={disabled ? -1 : 0}
>
	<!-- Hover: margin-of-error band -->
	{#if cursorPct !== null}
		{@const bandLeft = Math.max(0, cursorPct - MARGIN_HALF_PCT)}
		{@const bandRight = Math.min(100, cursorPct + MARGIN_HALF_PCT)}
		<div
			class="pointer-events-none absolute top-0 bottom-8 z-0 border-x border-primary/40 bg-primary/15"
			style="left: {bandLeft}%; width: {bandRight - bandLeft}%;"
		></div>

		<!-- Cursor line -->
		<div
			class="pointer-events-none absolute top-0 bottom-8 z-10 w-px bg-primary"
			style="left: {cursorPct}%"
		></div>

		<!-- Frequency badge -->
		{@const badgePct = Math.min(Math.max(cursorPct, 2), 98)}
		<div
			class="pointer-events-none absolute top-2 z-20 -translate-x-1/2 rounded border border-primary/50 bg-background px-2 py-1 font-mono text-sm whitespace-nowrap text-primary"
			style="left: {badgePct}%"
		>
			{formatFreq(hoveredFreq!)}
		</div>
	{/if}

	<!-- Result phase: target marker (green) -->
	{#if targetPct !== null}
		<div
			class="pointer-events-none absolute top-0 bottom-8 z-10 w-0.5 bg-green-500"
			style="left: {targetPct}%"
		></div>
		<div
			class="pointer-events-none absolute bottom-10 z-20 -translate-x-1/2 rounded border border-green-500/50 bg-background px-2 py-0.5 font-mono text-xs whitespace-nowrap text-green-400"
			style="left: {Math.min(Math.max(targetPct, 2), 98)}%"
		>
			TARGET {formatFreq(targetFreq!)}
		</div>
	{/if}

	<!-- Result phase: guess marker (fuchsia) -->
	{#if guessPct !== null}
		<div
			class="pointer-events-none absolute top-0 bottom-8 z-10 w-0.5 bg-primary"
			style="left: {guessPct}%"
		></div>
		<div
			class="pointer-events-none absolute top-2 z-20 -translate-x-1/2 rounded border border-primary/50 bg-background px-2 py-0.5 font-mono text-xs whitespace-nowrap text-primary"
			style="left: {Math.min(Math.max(guessPct, 2), 98)}%"
		>
			YOU {formatFreq(guessFreq!)}
		</div>
	{/if}

	<!-- Tick marks -->
	{#each TICKS as tick (tick)}
		{@const pct = freqToPct(tick)}
		<div class="absolute bottom-8 h-3 w-0.5 bg-border" style="left: {pct}%"></div>
		<div
			class="absolute bottom-1 -translate-x-1/2 font-mono text-xs leading-none text-muted-foreground"
			style="left: {pct}%"
		>
			{TICK_LABELS[tick]}
		</div>
	{/each}
</div>
