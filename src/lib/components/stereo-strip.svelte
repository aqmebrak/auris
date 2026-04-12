<script lang="ts">
	import { formatPan } from '$lib/format.js';

	interface Props {
		onSelect: (pan: number) => void;
		disabled?: boolean;
		/** When set, shows a persistent target marker (result phase). */
		targetPan?: number | null;
		/** When set, shows a persistent guess marker (result phase). */
		guessPan?: number | null;
		/** Restrict the visible/selectable range. Defaults to full L–R. */
		panMin?: number;
		panMax?: number;
		/** Error margin in pan units — controls hover band width. */
		errorMarginPan?: number;
	}

	let {
		onSelect,
		disabled = false,
		targetPan = null,
		guessPan = null,
		panMin = -1,
		panMax = 1,
		errorMarginPan = 0.1
	}: Props = $props();

	let hoveredPan: number | null = $state(null);
	let stripEl: HTMLDivElement | undefined = $state();

	// Major ticks (labeled) and minor ticks (marks only)
	const MAJOR_TICKS: { value: number; label: string }[] = [
		{ value: -1, label: 'L' },
		{ value: 0, label: 'C' },
		{ value: 1, label: 'R' }
	];
	const MINOR_TICKS = [-0.75, -0.5, -0.25, 0.25, 0.5, 0.75];

	const majorTicks = $derived(MAJOR_TICKS.filter((t) => t.value >= panMin && t.value <= panMax));
	const minorTicks = $derived(MINOR_TICKS.filter((t) => t >= panMin && t <= panMax));

	function posToPan(x: number, width: number): number {
		const pan = panMin + (x / width) * (panMax - panMin);
		return Math.max(panMin, Math.min(panMax, Math.round(pan * 100) / 100));
	}

	function panToPct(pan: number): number {
		return ((pan - panMin) / (panMax - panMin)) * 100;
	}

	const MARGIN_HALF_PCT = $derived((errorMarginPan / (panMax - panMin)) * 100);

	function handleMousemove(e: MouseEvent) {
		if (disabled) return;
		const el = e.currentTarget as HTMLDivElement;
		hoveredPan = posToPan(e.offsetX, el.clientWidth);
	}

	function handleMouseleave() {
		hoveredPan = null;
	}

	function handleClick() {
		if (disabled || hoveredPan === null) return;
		onSelect(hoveredPan);
	}

	function handleTouchstart(e: TouchEvent) {
		e.preventDefault();
		if (disabled || !stripEl) return;
		const touch = e.touches[0];
		const rect = stripEl.getBoundingClientRect();
		hoveredPan = posToPan(touch.clientX - rect.left, rect.width);
	}

	function handleTouchmove(e: TouchEvent) {
		e.preventDefault();
		if (disabled || !stripEl) return;
		const touch = e.touches[0];
		const rect = stripEl.getBoundingClientRect();
		hoveredPan = posToPan(touch.clientX - rect.left, rect.width);
	}

	function handleTouchend() {
		if (disabled || hoveredPan === null) return;
		onSelect(hoveredPan);
		hoveredPan = null;
	}

	const cursorPct = $derived(hoveredPan !== null ? panToPct(hoveredPan) : null);
	const targetPct = $derived(
		targetPan !== null && targetPan !== undefined ? panToPct(targetPan) : null
	);
	const guessPct = $derived(
		guessPan !== null && guessPan !== undefined ? panToPct(guessPan) : null
	);
</script>

<div
	bind:this={stripEl}
	role="slider"
	aria-label="Stereo pan selector"
	aria-valuemin={panMin}
	aria-valuemax={panMax}
	aria-valuenow={hoveredPan ?? 0}
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

		<!-- Pan badge -->
		{@const badgePct = Math.min(Math.max(cursorPct, 4), 96)}
		<div
			class="pointer-events-none absolute top-2 z-20 -translate-x-1/2 rounded border border-primary/50 bg-background px-2 py-1 font-mono text-sm whitespace-nowrap text-primary"
			style="left: {badgePct}%"
		>
			{formatPan(hoveredPan!)}
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
			style="left: {Math.min(Math.max(targetPct, 4), 96)}%"
		>
			TARGET {formatPan(targetPan!)}
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
			style="left: {Math.min(Math.max(guessPct, 4), 96)}%"
		>
			YOU {formatPan(guessPan!)}
		</div>
	{/if}

	<!-- Minor tick marks -->
	{#each minorTicks as tick (tick)}
		{@const pct = panToPct(tick)}
		<div class="absolute bottom-8 h-2 w-px bg-border/60" style="left: {pct}%"></div>
	{/each}

	<!-- Major tick marks + labels -->
	{#each majorTicks as { value, label } (value)}
		{@const pct = panToPct(value)}
		<div class="absolute bottom-8 h-3 w-0.5 bg-border" style="left: {pct}%"></div>
		<div
			class="absolute bottom-1 -translate-x-1/2 font-mono text-xs leading-none text-muted-foreground"
			style="left: {pct}%"
		>
			{label}
		</div>
	{/each}
</div>
