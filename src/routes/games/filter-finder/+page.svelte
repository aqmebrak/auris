<script lang="ts">
	import FreqStrip from '$lib/components/freq-strip.svelte';
	import ChoiceButtons from '$lib/components/game/choice-buttons.svelte';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
	import type { BoardState } from '$lib/game/board.js';
	import {
		createFilterFinderConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		FILTER_CONFIG,
		RANGE,
		ROUND_COUNT_OPTIONS,
		STEPS,
		type FilterFinderOptions,
		type FilterRound
	} from '$lib/games/filter-finder/config.js';
	import { createFilterFinderAudio } from '$lib/games/filter-finder/audio.js';
	import { labelled, numbers } from '$lib/game/options.js';
	import { formatFreq, formatOctaves } from '$lib/format.js';

	const audio = createFilterFinderAudio();
	const ctrl = createGameController<FilterRound, number, FilterFinderOptions>({
		gameId: 'filter-finder',
		defaultOptions: DEFAULT_OPTIONS,
		createConfig: createFilterFinderConfig,
		audio: audio.playable,
		prepareRound: (round) => audio.setFilter(round.type, round.targetFreq, round.slope),
		sessionMeta: (rounds, o) => ({
			filter: o.filter,
			difficulty: o.difficulty,
			roundCount: o.roundCount,
			rounds: rounds.map((r) => ({
				type: r.type,
				targetFreq: r.targetFreq,
				guess: r.guess,
				score: r.score,
				correct: r.result === 'correct'
			}))
		})
	});

	const diff = $derived(DIFFICULTY_CONFIG[ctrl.options.difficulty]);
	const typeLabel = (r: FilterRound) => (r.type === 'highpass' ? 'High-pass' : 'Low-pass');
	const stepChoices = (r: FilterRound) =>
		STEPS[r.type].map((value) => ({ value, label: formatFreq(value) }));
</script>

<GameShell
	{ctrl}
	title="Filter Finder"
	graded
	intro={diff.input === 'buttons'
		? 'Press PLAY, then switch between Original and Filtered. Pick the cutoff where the filter starts to bite.'
		: `Press PLAY, then switch between Original and Filtered. Find the cutoff frequency. Margin ${formatOctaves(diff.errorMarginOctaves)}`}
	instruction={diff.input === 'buttons'
		? 'Which cutoff is it?'
		: ctrl.isTouchDevice
			? 'Hold to aim, release to submit'
			: 'Click the cutoff frequency you hear'}
	legend="Both versions are loudness-matched"
	modeLabels={{ A: 'Original', B: 'Filtered' }}
	formatRound={(round, i) => ({
		label: `Round ${i + 1} · ${typeLabel(round)}`,
		primary: formatFreq(round.targetFreq),
		secondary: round.guess !== null ? formatFreq(round.guess) : null,
		result: round.result
	})}
>
	{#snippet options()}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<OptionGroup
				label="Filter"
				choices={labelled(FILTER_CONFIG)}
				selected={ctrl.options.filter}
				onSelect={(v) => ctrl.setOption('filter', v)}
			/>
			<OptionGroup
				label="Difficulty"
				choices={labelled(DIFFICULTY_CONFIG)}
				selected={ctrl.options.difficulty}
				onSelect={(v) => ctrl.setOption('difficulty', v)}
			/>
			<OptionGroup
				label="Rounds"
				choices={numbers(ROUND_COUNT_OPTIONS)}
				selected={ctrl.options.roundCount}
				onSelect={(v) => ctrl.setOption('roundCount', v)}
			/>
		</div>
	{/snippet}

	{#snippet board(round: FilterRound, ui: BoardState)}
		<p class="font-mono text-xs tracking-widest text-muted-foreground uppercase">
			{typeLabel(round)} · {round.slope} dB/oct
		</p>
		{#if diff.input === 'buttons'}
			<ChoiceButtons
				choices={stepChoices(round)}
				target={ui.revealed ? round.targetFreq : null}
				guess={ui.revealed ? round.guess : null}
				disabled={!ui.interactive}
				onSelect={(freq) => ctrl.submit(freq)}
			/>
		{:else}
			<FreqStrip
				onSelect={(freq) => ctrl.submit(freq)}
				disabled={!ui.interactive}
				targetFreq={ui.revealed ? round.targetFreq : null}
				guessFreq={ui.revealed ? round.guess : null}
				freqMin={RANGE[round.type].min}
				freqMax={RANGE[round.type].max}
				errorMarginOctaves={diff.errorMarginOctaves}
			/>
		{/if}
	{/snippet}

	{#snippet feedback(round: FilterRound)}
		<span>
			Target: <span class="font-mono text-foreground">{formatFreq(round.targetFreq)}</span>
		</span>
		{#if round.guess !== null}
			<span>
				Your guess: <span class="font-mono text-foreground">{formatFreq(round.guess)}</span>
			</span>
		{/if}
		<span class="rounded border border-border px-2 py-0.5 font-mono text-xs uppercase">
			{typeLabel(round)} · {round.slope} dB/oct
		</span>
	{/snippet}
</GameShell>
