<script lang="ts">
	let {
		value,
		min,
		max,
		label,
		unit,
		logarithmic = false,
		onchange,
		disabled = false
	}: {
		value: number;
		min: number;
		max: number;
		label: string;
		unit: string;
		logarithmic?: boolean;
		onchange: (v: number) => void;
		disabled?: boolean;
	} = $props();

	let isDragging = $state(false);
	let dragStartY = $state(0);
	let dragStartValue = $state(0);

	function toNorm(v: number): number {
		if (logarithmic) {
			return Math.log(v / min) / Math.log(max / min);
		}
		return (v - min) / (max - min);
	}

	function fromNorm(n: number): number {
		const clamped = Math.max(0, Math.min(1, n));
		if (logarithmic) {
			return min * Math.pow(max / min, clamped);
		}
		return min + clamped * (max - min);
	}

	// Rotation: -135deg (min) to +135deg (max)
	const rotationDeg = $derived(toNorm(value) * 270 - 135);

	function formatValue(v: number): string {
		if (unit === 'Hz') {
			if (v >= 1000) return `${(v / 1000).toFixed(1)} kHz`;
			return `${Math.round(v)} Hz`;
		}
		if (unit === 'dB') {
			return `${v >= 0 ? '+' : ''}${v.toFixed(1)} dB`;
		}
		return v.toFixed(1);
	}

	const PIXELS_PER_FULL_RANGE = 200;

	function handlePointerDown(e: PointerEvent) {
		if (disabled) return;
		const el = e.currentTarget as HTMLElement;
		el.setPointerCapture(e.pointerId);
		isDragging = true;
		dragStartY = e.clientY;
		dragStartValue = value;
		document.body.style.cursor = 'ns-resize';
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;
		const delta = dragStartY - e.clientY;
		let newValue: number;
		if (logarithmic) {
			const startNorm = toNorm(dragStartValue);
			const newNorm = startNorm + delta / PIXELS_PER_FULL_RANGE;
			newValue = fromNorm(newNorm);
		} else {
			newValue = dragStartValue + (delta / PIXELS_PER_FULL_RANGE) * (max - min);
			newValue = Math.max(min, Math.min(max, newValue));
		}
		onchange(newValue);
	}

	function handlePointerUp() {
		if (!isDragging) return;
		isDragging = false;
		document.body.style.cursor = '';
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (disabled) return;
		const linearStep = (max - min) / 100;
		const logStep = Math.pow(max / min, 0.01);
		const multiplier = e.shiftKey ? 10 : 1;

		if (e.key === 'ArrowUp') {
			e.preventDefault();
			const newValue = logarithmic
				? Math.min(max, value * Math.pow(logStep, multiplier))
				: Math.min(max, value + linearStep * multiplier);
			onchange(newValue);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			const newValue = logarithmic
				? Math.max(min, value / Math.pow(logStep, multiplier))
				: Math.max(min, value - linearStep * multiplier);
			onchange(newValue);
		}
	}

	const KNOB_RADIUS = 22;
	const NOTCH_DIST = 18;
	const notchX = $derived(Math.sin((rotationDeg * Math.PI) / 180) * NOTCH_DIST + KNOB_RADIUS);
	const notchY = $derived(-Math.cos((rotationDeg * Math.PI) / 180) * NOTCH_DIST + KNOB_RADIUS);
</script>

<div class="flex flex-col items-center gap-1 {disabled ? 'pointer-events-none opacity-50' : ''}">
	<span class="text-xs tracking-widest text-muted-foreground uppercase">{label}</span>

	<div
		role="slider"
		aria-valuenow={value}
		aria-valuemin={min}
		aria-valuemax={max}
		aria-label="{label} in {unit || 'value'}"
		tabindex={disabled ? -1 : 0}
		class="relative h-11 w-11 cursor-ns-resize rounded-full border border-border bg-muted select-none hover:border-foreground/30 focus-visible:ring-1 focus-visible:ring-ring"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
		onkeydown={handleKeyDown}
	>
		<svg class="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 44 44">
			<circle cx={notchX} cy={notchY} r="2" fill="currentColor" class="text-foreground" />
		</svg>
	</div>

	<span class="font-mono text-xs text-foreground tabular-nums">{formatValue(value)}</span>
</div>
