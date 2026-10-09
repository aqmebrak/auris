<script lang="ts">
	import ChoiceButtons from '$lib/components/game/choice-buttons.svelte';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
	import type { BoardState } from '$lib/game/board.js';
	import {
		createPhaseCombConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		MODE_CONFIG,
		ROUND_COUNT_OPTIONS,
		choiceLabel,
		choicesFor,
		formatDelay,
		type PhaseCombOptions,
		type PhaseCombRound
	} from '$lib/games/phase-comb/config.js';
	import { createPhaseCombAudio } from '$lib/games/phase-comb/audio.js';
	import { labelled, numbers } from '$lib/game/options.js';

	const audio = createPhaseCombAudio();
	const ctrl = createGameController<PhaseCombRound, number, PhaseCombOptions>({
		gameId: 'phase-comb',
		defaultOptions: DEFAULT_OPTIONS,
		createConfig: createPhaseCombConfig,
		audio: audio.playable,
		prepareRound: (round) => audio.setComb(round.delayMs, round.polarity),
		sessionMeta: (rounds, o) => ({
			mode: o.mode,
			difficulty: o.difficulty,
			roundCount: o.roundCount,
			rounds: rounds.map((r) => ({
				delayMs: r.delayMs,
				polarity: r.polarity,
				guess: r.guess,
				correct: r.result === 'correct'
			}))
		})
	});

	const mode = $derived(ctrl.options.mode);
	const choices = $derived(
		choicesFor(mode, ctrl.options.difficulty).map((value) => ({
			value,
			label: choiceLabel(mode, value)
		}))
	);
</script>

<GameShell
	{ctrl}
	title="Phase / Comb"
	intro={MODE_CONFIG[mode].intro}
	instruction={mode === 'type' ? 'What is mixed in with the original?' : 'What is the delay?'}
	legend="Both versions are mono and loudness-matched"
	modeLabels={{ A: 'Original', B: 'Adjusted' }}
	formatRound={(round, i) => ({
		label: `Round ${i + 1}`,
		primary: choiceLabel(round.mode, round.answer),
		secondary: round.guess !== null ? choiceLabel(round.mode, round.guess) : null,
		result: round.result
	})}
>
	{#snippet options()}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<OptionGroup
				label="Mode"
				choices={labelled(MODE_CONFIG)}
				selected={mode}
				onSelect={(v) => ctrl.setOption('mode', v)}
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

	{#snippet board(round: PhaseCombRound, ui: BoardState)}
		<ChoiceButtons
			{choices}
			target={ui.revealed ? round.answer : null}
			guess={ui.revealed ? round.guess : null}
			disabled={!ui.interactive}
			onSelect={(v) => ctrl.submit(v)}
		/>
	{/snippet}

	{#snippet feedback(round: PhaseCombRound)}
		<span>
			Answer: <span class="font-mono text-foreground">{choiceLabel(round.mode, round.answer)}</span>
		</span>
		{#if round.guess !== null}
			<span>
				Yours: <span class="font-mono text-foreground">{choiceLabel(round.mode, round.guess)}</span>
			</span>
		{/if}
		<span class="rounded border border-border px-2 py-0.5 font-mono text-xs">
			{formatDelay(round.delayMs)} · first notch at {Math.round(
				(round.polarity === 1 ? 500 : 1000) / round.delayMs
			)} Hz
		</span>
	{/snippet}
</GameShell>
