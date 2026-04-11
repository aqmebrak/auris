<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import RotaryKnob from '$lib/components/RotaryKnob.svelte';

	let {
		freqValue,
		gainValue,
		qValue,
		gainMin,
		gainMax,
		qMin,
		qMax,
		disabled = false,
		onFreqChange,
		onGainChange,
		onQChange
	}: {
		freqValue: number;
		gainValue: number;
		qValue: number;
		gainMin: number;
		gainMax: number;
		qMin: number;
		qMax: number;
		disabled?: boolean;
		onFreqChange: (v: number) => void;
		onGainChange: (v: number) => void;
		onQChange: (v: number) => void;
	} = $props();
</script>

<Card.Root>
	<Card.Content class="flex flex-row items-center justify-around gap-6 p-4">
		<div class="flex flex-1 justify-center border-r border-border pr-4">
			<RotaryKnob
				value={freqValue}
				min={20}
				max={20000}
				label="FREQ"
				unit="Hz"
				logarithmic={true}
				{disabled}
				onchange={onFreqChange}
			/>
		</div>
		<div class="flex flex-1 justify-center border-r border-border pr-4">
			<RotaryKnob
				value={gainValue}
				min={gainMin}
				max={gainMax}
				label="GAIN"
				unit="dB"
				{disabled}
				onchange={onGainChange}
			/>
		</div>
		<div class="flex flex-1 justify-center">
			<RotaryKnob
				value={qValue}
				min={qMin}
				max={qMax}
				label="Q"
				unit=""
				{disabled}
				onchange={onQChange}
			/>
		</div>
	</Card.Content>
</Card.Root>
