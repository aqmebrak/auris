<script lang="ts">
	interface Props {
		onSelect: (freq: number) => void;
		disabled?: boolean;
	}

	let { onSelect, disabled = false }: Props = $props();

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

	function posToFreq(x: number, width: number): number {
		return 20 * Math.pow(20000 / 20, x / width);
	}

	function freqToPos(freq: number, width: number): number {
		return width * (Math.log(freq / 20) / Math.log(20000 / 20));
	}

	function formatFreq(freq: number): string {
		if (freq >= 1000) {
			return `${(freq / 1000).toFixed(1)} kHz`;
		}
		return `${Math.round(freq)} Hz`;
	}

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

	// Compute cursor line position as percentage
	const cursorPct = $derived(
		hoveredFreq !== null && stripEl
			? (freqToPos(hoveredFreq, stripEl.clientWidth) / stripEl.clientWidth) * 100
			: null
	);
</script>

<div
	bind:this={stripEl}
	role="slider"
	aria-label="Frequency selector"
	aria-valuemin={20}
	aria-valuemax={20000}
	aria-valuenow={hoveredFreq ?? 20}
	class="relative min-h-[80px] w-full overflow-visible rounded border border-border bg-card pb-5
		{disabled ? 'cursor-not-allowed opacity-40' : 'cursor-crosshair'}"
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
	<!-- Cursor line -->
	{#if cursorPct !== null}
		<div
			class="pointer-events-none absolute top-0 bottom-5 z-10 w-px bg-foreground/70"
			style="left: {cursorPct}%"
		></div>

		<!-- Frequency badge -->
		{@const badgePct = Math.min(Math.max(cursorPct, 0), 95)}
		<div
			class="pointer-events-none absolute top-1 z-20 -translate-x-1/2 rounded border border-border bg-background px-1.5 py-0.5 text-xs whitespace-nowrap"
			style="left: {badgePct}%"
		>
			{formatFreq(hoveredFreq!)}
		</div>
	{/if}

	<!-- Tick marks -->
	{#each TICKS as tick (tick)}
		{@const pct = stripEl
			? (freqToPos(tick, stripEl.clientWidth) / stripEl.clientWidth) * 100
			: (Math.log(tick / 20) / Math.log(20000 / 20)) * 100}
		<div class="absolute bottom-5 h-2 w-0.5 bg-border" style="left: {pct}%"></div>
		<div
			class="absolute bottom-0 -translate-x-1/2 text-[10px] leading-none text-muted-foreground"
			style="left: {pct}%"
		>
			{TICK_LABELS[tick]}
		</div>
	{/each}
</div>
