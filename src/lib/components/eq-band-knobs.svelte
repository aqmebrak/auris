<script lang="ts">
	import Knob from '$lib/components/knob.svelte';
	import { FREQ_STEPS, Q_STEPS, type EqBand } from '$lib/games/eq-matching/config.js';
	import { formatFreq, formatDb, formatQ } from '$lib/format.js';

	interface Props {
		band: EqBand;
		gainPool: readonly number[];
		/** Hide the Q knob when the game fixes it. */
		qEditable: boolean;
		onChange?: (band: EqBand) => void;
		disabled?: boolean;
	}

	let { band, gainPool, qEditable, onChange, disabled = false }: Props = $props();

	const set = (patch: Partial<EqBand>) => onChange?.({ ...band, ...patch });
</script>

<div class="flex flex-wrap items-end gap-8">
	<Knob
		steps={FREQ_STEPS}
		value={band.freq}
		label="HZ"
		format={formatFreq}
		onChange={(freq) => set({ freq })}
		{disabled}
	/>
	<Knob
		steps={gainPool}
		value={band.gainDb}
		label="GAIN"
		format={formatDb}
		onChange={(gainDb) => set({ gainDb })}
		{disabled}
	/>
	{#if qEditable}
		<Knob
			steps={Q_STEPS}
			value={band.q}
			label="Q"
			format={formatQ}
			onChange={(q) => set({ q })}
			{disabled}
		/>
	{/if}
</div>
