<script lang="ts">
	import AnswerSlider from './AnswerSlider.svelte';

	type BoostOrCut = 'boost' | 'cut';

	interface Props {
		bands: number[];
		selectedFrequency: number | null;
		showBoostCut: boolean;
		boostOrCut: BoostOrCut | null;
		showGain: boolean;
		gainDb?: number;
		disabled?: boolean;
		onselectfrequency?: (hz: number) => void;
		onselectboostcut?: (bc: BoostOrCut) => void;
	}

	let {
		bands,
		selectedFrequency = null,
		showBoostCut,
		boostOrCut = null,
		showGain,
		gainDb = $bindable(0),
		disabled = false,
		onselectfrequency,
		onselectboostcut
	}: Props = $props();

	function formatHz(hz: number): string {
		return hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`;
	}
</script>

<div class="flex flex-col gap-4">
	<!-- Frequency band buttons -->
	<div class="flex flex-wrap justify-center gap-2">
		{#each bands as hz (hz)}
			<button
				onclick={() => onselectfrequency?.(hz)}
				{disabled}
				class="rounded px-3 py-2 text-sm font-mono font-medium transition-all"
				class:bg-zinc-700={selectedFrequency === hz}
				class:ring-1={selectedFrequency === hz}
				class:ring-cyan-400={selectedFrequency === hz}
				class:text-cyan-300={selectedFrequency === hz}
				class:bg-zinc-800={selectedFrequency !== hz}
				class:text-zinc-400={selectedFrequency !== hz}
				class:hover:bg-zinc-700={selectedFrequency !== hz && !disabled}
				class:opacity-40={disabled}
				class:cursor-not-allowed={disabled}
			>
				{formatHz(hz)}
			</button>
		{/each}
	</div>

	<!-- Boost / Cut toggle -->
	{#if showBoostCut}
		<div class="flex justify-center gap-3">
			{#each (['boost', 'cut'] as BoostOrCut[]) as bc (bc)}
				<button
					onclick={() => onselectboostcut?.(bc)}
					{disabled}
					class="rounded px-5 py-1.5 text-sm font-medium capitalize transition-all"
					class:bg-zinc-700={boostOrCut === bc}
					class:ring-1={boostOrCut === bc}
					class:ring-cyan-400={boostOrCut === bc}
					class:text-cyan-300={boostOrCut === bc}
					class:bg-zinc-800={boostOrCut !== bc}
					class:text-zinc-400={boostOrCut !== bc}
					class:hover:bg-zinc-700={boostOrCut !== bc && !disabled}
					class:opacity-40={disabled}
					class:cursor-not-allowed={disabled}
				>
					{bc}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Gain slider -->
	{#if showGain}
		<AnswerSlider
			min={-9}
			max={9}
			step={1}
			unit="dB"
			label="Gain amount"
			bind:value={gainDb}
			{disabled}
		/>
	{/if}
</div>
