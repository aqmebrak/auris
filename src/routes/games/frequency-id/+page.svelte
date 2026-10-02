<script lang="ts">
	import FreqStrip from '$lib/components/freq-strip.svelte';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
	import {
		createFreqIdConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ZONE_CONFIG,
		ROUND_COUNT_OPTIONS,
		type FreqIdRound,
		type FreqIdOptions
	} from '$lib/games/freq-id/config.js';
	import { createFreqIdAudio } from '$lib/games/freq-id/audio.js';
	import { keys, labelled, numbers } from '$lib/game/options.js';
	import { formatFreq, formatOctaves } from '$lib/format.js';

	const audio = createFreqIdAudio();
	const ctrl = createGameController<FreqIdRound, number, FreqIdOptions>({
		gameId: 'freq-id',
		defaultOptions: DEFAULT_OPTIONS,
		createConfig: createFreqIdConfig,
		audio: audio.chain,
		prepareRound: (round) => audio.setFilter(round.targetFreq, round.gainDb, 2.5),
		sessionMeta: (rounds, o) => ({
			difficulty: o.difficulty,
			zone: o.zone,
			roundCount: o.roundCount,
			rounds: rounds.map((r) => ({ targetFreq: r.targetFreq, correct: r.result === 'correct' }))
		})
	});

	const zone = $derived(ZONE_CONFIG[ctrl.options.zone]);
	const diff = $derived(DIFFICULTY_CONFIG[ctrl.options.difficulty]);
</script>

<GameShell
	{ctrl}
	title="Frequency ID"
	intro={`Press PLAY to hear the audio. Identify the frequency band where the EQ is applied. Margin ${formatOctaves(diff.errorMarginOctaves)}`}
	legend="A = dry signal · B = with EQ applied"
	formatRound={(round, i) => ({
		label: `Round ${i + 1}`,
		primary: formatFreq(round.targetFreq),
		secondary: round.guess !== null ? formatFreq(round.guess) : null,
		result: round.result
	})}
>
	{#snippet options()}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<OptionGroup
				label="Difficulty"
				choices={labelled(DIFFICULTY_CONFIG)}
				selected={ctrl.options.difficulty}
				onSelect={(v) => ctrl.setOption('difficulty', v)}
			/>
			<OptionGroup
				label="Zone"
				choices={keys(ZONE_CONFIG)}
				selected={ctrl.options.zone}
				onSelect={(v) => ctrl.setOption('zone', v)}
			/>
			<OptionGroup
				label="Rounds"
				choices={numbers(ROUND_COUNT_OPTIONS)}
				selected={ctrl.options.roundCount}
				onSelect={(v) => ctrl.setOption('roundCount', v)}
			/>
		</div>
	{/snippet}

	{#snippet idle()}
		<FreqStrip
			onSelect={() => {}}
			disabled={true}
			freqMin={zone.min}
			freqMax={zone.max}
			errorMarginOctaves={diff.errorMarginOctaves}
		/>
	{/snippet}

	{#snippet playing()}
		<p class="text-sm text-muted-foreground">
			{ctrl.isTouchDevice ? 'Hold to aim, release to submit' : 'Click the frequency you hear'}
		</p>
		<FreqStrip
			onSelect={(freq) => ctrl.submit(freq)}
			disabled={false}
			freqMin={zone.min}
			freqMax={zone.max}
			errorMarginOctaves={diff.errorMarginOctaves}
		/>
	{/snippet}

	{#snippet summary(round: FreqIdRound)}
		<span>
			Target: <span class="font-mono text-foreground">{formatFreq(round.targetFreq)}</span>
		</span>
		{#if round.guess !== null}
			<span>
				Your guess: <span class="font-mono text-foreground">{formatFreq(round.guess)}</span>
			</span>
		{/if}
		<span class="rounded border border-border px-2 py-0.5 font-mono text-xs uppercase">
			{round.gainDb > 0 ? 'BOOST' : 'CUT'}
			{Math.abs(round.gainDb)} dB
		</span>
	{/snippet}

	{#snippet resultVisual(round: FreqIdRound)}
		<FreqStrip
			onSelect={() => {}}
			disabled={true}
			targetFreq={round.targetFreq}
			guessFreq={round.guess}
			freqMin={zone.min}
			freqMax={zone.max}
			errorMarginOctaves={diff.errorMarginOctaves}
		/>
	{/snippet}
</GameShell>
