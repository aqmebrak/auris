<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ChoiceButtons from '$lib/components/game/choice-buttons.svelte';
	import CompressorPanel from '$lib/components/compressor-panel.svelte';
	import DynamicsMatchResult from '$lib/components/dynamics-match-result.svelte';
	import type { BoardState } from '$lib/game/board.js';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
	import {
		createDynamicsConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		MATCH_STEPS,
		MODE_CONFIG,
		ROUND_COUNT_OPTIONS,
		choiceLabel,
		defaultSpec,
		modeSideLabels,
		type DynamicsGuess,
		type DynamicsOptions,
		type DynamicsRound
	} from '$lib/games/dynamics/config.js';
	import { DynamicsAudio, type CompSpec } from '$lib/games/dynamics/audio.js';
	import { labelled, numbers } from '$lib/game/options.js';
	import { formatAttack, formatRatio, formatRelease } from '$lib/format.js';

	const audio = new DynamicsAudio();
	let userSpec = $state<CompSpec>(defaultSpec(DEFAULT_OPTIONS.difficulty));

	const ctrl = createGameController<DynamicsRound, DynamicsGuess, DynamicsOptions>({
		gameId: 'dynamics',
		defaultOptions: DEFAULT_OPTIONS,
		createConfig: createDynamicsConfig,
		audio,
		onOptionsChange: (o) => (userSpec = defaultSpec(o.difficulty)),
		prepareRound: (round) => {
			audio.setThresholdOffset(round.thresholdOffsetDb);
			userSpec = defaultSpec(ctrl.options.difficulty);
			audio.setPath('A', round.mode === 'match' ? userSpec : round.a);
			audio.setPath('B', round.b);
		},
		sessionMeta: (rounds, o) => ({
			mode: o.mode,
			difficulty: o.difficulty,
			roundCount: o.roundCount,
			rounds: rounds.map((r) => ({
				answer: r.answer,
				guess: r.guess,
				score: r.score,
				correct: r.result === 'correct'
			}))
		})
	});

	const mode = $derived(ctrl.options.mode);
	const steps = $derived(MATCH_STEPS[ctrl.options.difficulty]);
	const diff = $derived(DIFFICULTY_CONFIG[ctrl.options.difficulty]);

	// Live sync knobs → audio (match mode only; quiz paths are fixed per round)
	$effect(() => {
		if (mode === 'match') audio.setPath('A', { ...userSpec });
	});

	const specSummary = (s: CompSpec) =>
		`${formatRatio(s.ratio)} · ${formatAttack(s.attackMs)} · ${formatRelease(s.releaseMs)}`;

	const answerLabel = (r: DynamicsRound, v: DynamicsGuess | null) =>
		v === null ? null : typeof v === 'number' ? choiceLabel(r.mode, v) : specSummary(v);
</script>

<GameShell
	{ctrl}
	title="Dynamics"
	graded={mode === 'match'}
	intro={`${MODE_CONFIG[mode].intro}${mode === 'match' ? ` You need a ${Math.round(diff.passThreshold * 100)}% match.` : ''}`}
	instruction={mode === 'match'
		? 'Make Your settings sound like the Target, then submit.'
		: MODE_CONFIG[mode].intro}
	modeLabels={modeSideLabels(mode)}
	legend="Both versions are loudness-matched"
	formatRound={(round, i) => ({
		label: `Round ${i + 1}`,
		primary: answerLabel(round, round.answer)!,
		secondary: answerLabel(round, round.guess),
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

	{#snippet board(round: DynamicsRound, ui: BoardState)}
		{#if round.mode === 'match'}
			<CompressorPanel
				spec={ui.revealed && round.guess ? (round.guess as CompSpec) : userSpec}
				{steps}
				disabled={!ui.interactive}
				onChange={(s) => (userSpec = s)}
				getReduction={() => audio.getReduction()}
				meterActive={ui.interactive && !ctrl.isPaused && ctrl.abMode === 'A'}
			/>
			<div class="flex justify-center">
				<Button
					size="lg"
					class="px-12 text-sm tracking-widest"
					disabled={!ui.interactive}
					onclick={() => ctrl.submit({ ...userSpec })}
				>
					SUBMIT
				</Button>
			</div>
		{:else}
			<ChoiceButtons
				choices={round.choices.map((value) => ({ value, label: choiceLabel(round.mode, value) }))}
				target={ui.revealed ? (round.answer as number) : null}
				guess={ui.revealed ? (round.guess as number | null) : null}
				disabled={!ui.interactive}
				onSelect={(v) => ctrl.submit(v)}
			/>
		{/if}
	{/snippet}

	{#snippet feedback(round: DynamicsRound)}
		{#if round.mode === 'match'}
			<DynamicsMatchResult
				target={round.answer as CompSpec}
				guess={round.guess as CompSpec | null}
			/>
		{:else}
			<span>
				Answer: <span class="font-mono text-foreground">{answerLabel(round, round.answer)}</span>
			</span>
			{#if round.guess !== null}
				<span>
					Yours: <span class="font-mono text-foreground">{answerLabel(round, round.guess)}</span>
				</span>
			{/if}
		{/if}
	{/snippet}
</GameShell>
