<script lang="ts">
	import StereoStrip from '$lib/components/stereo-strip.svelte';
	import ChoiceButtons from '$lib/components/game/choice-buttons.svelte';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
	import type { BoardState } from '$lib/game/board.js';
	import {
		createPanningConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ZONE_CONFIG,
		ROUND_COUNT_OPTIONS,
		positionsInZone,
		type PanRound,
		type PanningOptions
	} from '$lib/games/panning/config.js';
	import { createPanningAudio } from '$lib/games/panning/audio.js';
	import { keys, labelled, numbers } from '$lib/game/options.js';
	import { formatPan } from '$lib/format.js';

	const audio = createPanningAudio();
	const ctrl = createGameController<PanRound, number, PanningOptions>({
		gameId: 'panning',
		defaultOptions: DEFAULT_OPTIONS,
		createConfig: createPanningConfig,
		audio: audio.chain,
		hasAB: false,
		prepareRound: (round) => audio.setPan(round.targetPan),
		sessionMeta: (rounds, o) => ({
			difficulty: o.difficulty,
			zone: o.zone,
			roundCount: o.roundCount,
			rounds: rounds.map((r) => ({
				targetPan: r.targetPan,
				guess: r.guess,
				correct: r.result === 'correct'
			}))
		})
	});

	const zone = $derived(ZONE_CONFIG[ctrl.options.zone]);
	const diff = $derived(DIFFICULTY_CONFIG[ctrl.options.difficulty]);
	const snapChoices = $derived(
		positionsInZone(ctrl.options.zone).map((value) => ({ value, label: formatPan(value) }))
	);
</script>

<GameShell
	{ctrl}
	title="Panning"
	graded
	intro={`Use headphones. The track is summed to mono and panned — find where it sits. ${diff.input === 'buttons' ? 'Pick the nearest position.' : `Margin ±${Math.round(diff.errorMarginPan * 100)}%`}`}
	instruction={diff.input === 'buttons'
		? 'Where is the signal panned?'
		: ctrl.isTouchDevice
			? 'Hold to aim, release to submit'
			: 'Click where you hear the signal panned'}
	formatRound={(round, i) => ({
		label: `Round ${i + 1}`,
		primary: formatPan(round.targetPan),
		secondary: round.guess !== null ? formatPan(round.guess) : null,
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

	{#snippet board(round: PanRound, ui: BoardState)}
		{#if diff.input === 'buttons'}
			<ChoiceButtons
				choices={snapChoices}
				target={ui.revealed ? round.targetPan : null}
				guess={ui.revealed ? round.guess : null}
				disabled={!ui.interactive}
				onSelect={(pan) => ctrl.submit(pan)}
			/>
		{:else}
			<StereoStrip
				onSelect={(pan) => ctrl.submit(pan)}
				disabled={!ui.interactive}
				targetPan={ui.revealed ? round.targetPan : null}
				guessPan={ui.revealed ? round.guess : null}
				panMin={zone.min}
				panMax={zone.max}
				errorMarginPan={diff.errorMarginPan}
			/>
		{/if}
	{/snippet}

	{#snippet feedback(round: PanRound)}
		<span>
			Target: <span class="font-mono text-foreground">{formatPan(round.targetPan)}</span>
		</span>
		{#if round.guess !== null}
			<span>
				Your guess: <span class="font-mono text-foreground">{formatPan(round.guess)}</span>
			</span>
		{/if}
	{/snippet}
</GameShell>
