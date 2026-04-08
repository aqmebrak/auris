<script lang="ts">
	interface Props {
		min: number;
		max: number;
		step: number;
		unit: string;
		label: string;
		value: number;
		disabled?: boolean;
		onchange?: (value: number) => void;
	}

	let {
		min,
		max,
		step,
		unit,
		label,
		value = $bindable(),
		disabled = false,
		onchange
	}: Props = $props();

	function handleInput(e: Event) {
		const v = parseFloat((e.target as HTMLInputElement).value);
		value = v;
		onchange?.(v);
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-baseline justify-between">
		<span class="text-sm text-zinc-400">{label}</span>
		<span class="font-mono text-2xl font-bold text-zinc-100">
			{value > 0 ? '+' : ''}{value}{unit}
		</span>
	</div>
	<input
		type="range"
		{min}
		{max}
		{step}
		{value}
		oninput={handleInput}
		class="w-full accent-cyan-400"
		class:pointer-events-none={disabled}
		class:opacity-50={disabled}
	/>
	<div class="flex justify-between text-xs text-zinc-500">
		<span>{min}{unit}</span>
		<span>0{unit}</span>
		<span>+{max}{unit}</span>
	</div>
</div>
