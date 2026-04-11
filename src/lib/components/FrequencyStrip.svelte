<script lang="ts">
	let {
		value,
		targetValue = undefined,
		showTarget = false
	}: {
		value: number;
		targetValue?: number;
		showTarget?: boolean;
	} = $props();

	const TICKS = [20, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000, 20000];

	function logPos(hz: number): number {
		return Math.log(hz / 20) / Math.log(20000 / 20);
	}

	function toTopPct(hz: number): string {
		return `${(1 - logPos(hz)) * 100}%`;
	}

	function formatTick(hz: number): string {
		if (hz >= 1000) return `${hz / 1000}k`;
		return `${hz}`;
	}

	function formatHz(hz: number): string {
		if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
		return `${Math.round(hz)} Hz`;
	}

	const userTop = $derived(toTopPct(value));
	const targetTop = $derived(targetValue !== undefined ? toTopPct(targetValue) : '50%');
</script>

<div
	role="img"
	aria-label="Frequency scale, 20Hz to 20kHz. Current value: {formatHz(value)}"
	class="flex h-full w-10 flex-row rounded-sm border border-border bg-card sm:w-[120px]"
>
	<!-- Label gutter: hidden on mobile, shown sm+ -->
	<div class="relative hidden w-[80px] sm:flex">
		{#each TICKS as tick (tick)}
			<span
				class="absolute right-1 font-mono text-[9px] leading-none text-muted-foreground"
				style="top: {toTopPct(tick)}; transform: translateY(-50%)"
			>
				{formatTick(tick)}
			</span>
		{/each}
	</div>

	<!-- Bar column -->
	<div class="relative flex-1 border-l border-border bg-card">
		<!-- Tick marks -->
		{#each TICKS as tick (tick)}
			<div
				class="absolute right-0 left-0 border-t border-border/40"
				style="top: {toTopPct(tick)}"
			></div>
		{/each}

		<!-- User marker -->
		<div
			class="absolute right-0 left-0 border-t-2 border-foreground/60 transition-[top] duration-150"
			style="top: {userTop}"
		></div>

		<!-- Target marker (shown on round_result) -->
		{#if showTarget && targetValue !== undefined}
			<div class="absolute right-0 left-0 border-t-2 border-primary" style="top: {targetTop}"></div>
		{/if}
	</div>
</div>
