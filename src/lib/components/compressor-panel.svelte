<script lang="ts">
	import Knob from '$lib/components/knob.svelte';
	import GrMeter from '$lib/components/gr-meter.svelte';
	import type { CompSpec } from '$lib/games/dynamics/audio.js';
	import { formatAttack, formatRelease, formatRatio } from '$lib/format.js';

	interface Props {
		spec: CompSpec;
		steps: { ratios: number[]; attacks: number[]; releases: number[] };
		onChange?: (spec: CompSpec) => void;
		getReduction?: () => number;
		/** Meter only lights while the player's own settings are audible. */
		meterActive?: boolean;
		disabled?: boolean;
	}

	let {
		spec,
		steps,
		onChange,
		getReduction = () => 0,
		meterActive = false,
		disabled = false
	}: Props = $props();
</script>

<div
	class="rounded border bg-zinc-950 p-6 {disabled
		? 'border-zinc-800 opacity-50'
		: 'border-zinc-700 shadow-xl'}"
>
	<div class="flex flex-wrap items-end justify-between gap-8">
		<Knob
			steps={steps.ratios}
			value={spec.ratio}
			label="RATIO"
			format={formatRatio}
			onChange={(ratio) => onChange?.({ ...spec, ratio })}
			{disabled}
		/>
		<Knob
			steps={steps.attacks}
			value={spec.attackMs}
			label="ATTACK"
			format={formatAttack}
			onChange={(attackMs) => onChange?.({ ...spec, attackMs })}
			{disabled}
		/>
		<Knob
			steps={steps.releases}
			value={spec.releaseMs}
			label="RELEASE"
			format={formatRelease}
			onChange={(releaseMs) => onChange?.({ ...spec, releaseMs })}
			{disabled}
		/>
		<div class="min-w-48 flex-1">
			<GrMeter {getReduction} active={meterActive} />
		</div>
	</div>
	<p class="mt-4 text-xs tracking-widest text-zinc-600 uppercase">Makeup gain is automatic</p>
</div>
