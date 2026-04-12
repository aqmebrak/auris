<script lang="ts">
	interface Props {
		steps: readonly number[];
		value: number;
		label: string;
		format: (v: number) => string;
		onChange: (v: number) => void;
		disabled?: boolean;
	}

	let { steps, value, label, format, onChange, disabled = false }: Props = $props();

	// Rotation: -135° (min) → +135° (max), total 270°
	const angle = $derived(
		steps.length > 1 ? -135 + (steps.indexOf(value) / (steps.length - 1)) * 270 : -135
	);

	let dragStartY = 0;
	let dragStartIndex = 0;
	const PX_PER_STEP = 28;

	function onPointerDown(e: PointerEvent) {
		if (disabled) return;
		e.preventDefault();
		dragStartY = e.clientY;
		dragStartIndex = steps.indexOf(value);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		window.addEventListener('pointermove', onPointerMove);
		window.addEventListener('pointerup', onPointerUp);
	}

	function onPointerMove(e: PointerEvent) {
		const delta = dragStartY - e.clientY; // drag up = increase
		const stepDelta = Math.round(delta / PX_PER_STEP);
		const newIndex = Math.max(0, Math.min(steps.length - 1, dragStartIndex + stepDelta));
		if (steps[newIndex] !== value) {
			onChange(steps[newIndex]);
		}
	}

	function onPointerUp() {
		window.removeEventListener('pointermove', onPointerMove);
		window.removeEventListener('pointerup', onPointerUp);
	}

	function onWheel(e: WheelEvent) {
		if (disabled) return;
		e.preventDefault();
		const idx = steps.indexOf(value);
		const newIndex = Math.max(0, Math.min(steps.length - 1, idx + (e.deltaY < 0 ? 1 : -1)));
		onChange(steps[newIndex]);
	}
</script>

<div class="flex flex-col items-center gap-2 select-none">
	<p class="text-xs font-medium tracking-widest text-zinc-500 uppercase">{label}</p>
	<div
		class="cursor-ns-resize touch-none {disabled ? 'cursor-not-allowed opacity-40' : ''}"
		onpointerdown={onPointerDown}
		onwheel={onWheel}
		role="slider"
		aria-label={label}
		aria-valuemin={steps[0]}
		aria-valuemax={steps[steps.length - 1]}
		aria-valuenow={value}
		tabindex={disabled ? -1 : 0}
		onkeydown={(e) => {
			if (disabled) return;
			const idx = steps.indexOf(value);
			if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
				e.preventDefault();
				onChange(steps[Math.min(steps.length - 1, idx + 1)]);
			} else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
				e.preventDefault();
				onChange(steps[Math.max(0, idx - 1)]);
			}
		}}
	>
		<svg viewBox="0 0 80 80" class="h-20 w-20" aria-hidden="true">
			<!-- Track arc background -->
			<circle cx="40" cy="40" r="32" fill="none" stroke="#27272a" stroke-width="5" />
			<!-- Knob body -->
			<circle cx="40" cy="40" r="26" fill="#3f3f46" />
			<circle cx="40" cy="40" r="24" fill="url(#knob-grad)" />
			<!-- Pointer line -->
			<line
				x1="40"
				y1="40"
				x2="40"
				y2="18"
				transform="rotate({angle} 40 40)"
				stroke="#ef4444"
				stroke-width="3"
				stroke-linecap="round"
			/>
			<!-- Center dot -->
			<circle cx="40" cy="40" r="3" fill="#18181b" />
			<defs>
				<radialGradient id="knob-grad" cx="40%" cy="35%" r="60%" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stop-color="#52525b" />
					<stop offset="100%" stop-color="#27272a" />
				</radialGradient>
			</defs>
		</svg>
	</div>
	<p class="font-mono text-sm text-zinc-100">{format(value)}</p>
</div>
