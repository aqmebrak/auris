<script lang="ts">
	import ChoiceButtons from '$lib/components/game/choice-buttons.svelte';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
	import type { BoardState } from '$lib/game/board.js';
	import {
		createStereoWidthConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ROUND_COUNT_OPTIONS,
		formatWidth,
		type StereoWidthOptions,
		type WidthRound
	} from '$lib/games/stereo-width/config.js';
	import { createStereoWidthAudio } from '$lib/games/stereo-width/audio.js';
	import { labelled, numbers } from '$lib/game/options.js';

	const audio = createStereoWidthAudio();
	const ctrl = createGameController<WidthRound, number, StereoWidthOptions>({
		gameId: 'stereo-width',
		defaultOptions: DEFAULT_OPTIONS,
		createConfig: createStereoWidthConfig,
		audio: audio.playable,
		prepareRound: (round) => audio.setWidth(round.width, round.sideDb),
		sessionMeta: (rounds, o) => ({
			difficulty: o.difficulty,
			roundCount: o.roundCount,
			rounds: rounds.map((r) => ({
				width: r.width,
				guess: r.guess,
				correct: r.result === 'correct'
			}))
		})
	});

	const choices = $derived(
		DIFFICULTY_CONFIG[ctrl.options.difficulty].choices.map((value) => ({
			value,
			label: formatWidth(value)
		}))
	);
</script>

<GameShell
	{ctrl}
	title="Stereo Width"
	intro="Use headphones. Switch between Original and Adjusted — the stereo width of the adjusted version is scaled (100% = original, Mono = no width). Pick the width."
	instruction="How wide is the Adjusted version, relative to the Original?"
	legend="Both versions are loudness-matched"
	modeLabels={{ A: 'Original', B: 'Adjusted' }}
	formatRound={(round, i) => ({
		label: `Round ${i + 1}`,
		primary: formatWidth(round.width),
		secondary: round.guess !== null ? formatWidth(round.guess) : null,
		result: round.result
	})}
>
	{#snippet options()}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

	{#snippet board(round: WidthRound, ui: BoardState)}
		<ChoiceButtons
			{choices}
			target={ui.revealed ? round.width : null}
			guess={ui.revealed ? round.guess : null}
			disabled={!ui.interactive}
			onSelect={(width) => ctrl.submit(width)}
		/>
	{/snippet}

	{#snippet feedback(round: WidthRound)}
		<span>
			Width: <span class="font-mono text-foreground">{formatWidth(round.width)}</span>
		</span>
		{#if round.guess !== null}
			<span>
				Your guess: <span class="font-mono text-foreground">{formatWidth(round.guess)}</span>
			</span>
		{/if}
	{/snippet}
</GameShell>
