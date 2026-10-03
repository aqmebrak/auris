<script lang="ts">
	import EqChoice from '$lib/components/eq-choice.svelte';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
	import {
		createEqGuessConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ROUND_COUNT_OPTIONS,
		eqConfigsEqual,
		type EqGuessRound,
		type EqConfig,
		type EqGuessOptions
	} from '$lib/games/eq-guess/config.js';
	import { createEqGuessAudio } from '$lib/games/eq-guess/audio.js';
	import { labelled, numbers } from '$lib/game/options.js';
	import { formatFreq, formatDb } from '$lib/format.js';

	const audio = createEqGuessAudio();
	const ctrl = createGameController<EqGuessRound, EqConfig, EqGuessOptions>({
		gameId: 'eq-guess',
		defaultOptions: DEFAULT_OPTIONS,
		createConfig: createEqGuessConfig,
		audio: audio.chain,
		prepareRound: (round) => audio.setFilters(round.targetEq),
		sessionMeta: (rounds, o) => ({
			difficulty: o.difficulty,
			roundCount: o.roundCount,
			rounds: rounds.map((r) => ({
				targetEq: r.targetEq,
				guess: r.guess,
				correct: r.result === 'correct'
			}))
		})
	});

	function bandSummary(eq: EqConfig): string {
		return eq.map((b) => `${formatFreq(b.freq)} ${formatDb(b.gainDb)}`).join(' · ');
	}
</script>

<GameShell
	{ctrl}
	title="EQ Guess"
	intro="Press PLAY to hear the EQ'd audio. Switch between Original and EQ'd to compare. Click the card that matches what you hear."
	modeLabels={{ A: 'Original', B: "EQ'd" }}
	formatRound={(round, i) => ({
		label: `Round ${i + 1}`,
		primary: bandSummary(round.targetEq),
		secondary: round.guess ? bandSummary(round.guess) : null,
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

	{#snippet idle()}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
			{#each [0, 1] as i (i)}
				<div class="rounded border border-border p-4 opacity-30" aria-hidden="true">
					<div class="h-20 w-full rounded bg-zinc-900"></div>
					<p class="mt-3 font-mono text-xs text-muted-foreground">— Hz — dB · — Hz — dB</p>
				</div>
			{/each}
		</div>
	{/snippet}

	{#snippet playing(round: EqGuessRound)}
		<p class="text-sm text-muted-foreground">Click the EQ that matches what you hear in B.</p>
		<EqChoice options={round.options} onSelect={(eq) => ctrl.submit(eq)} />
	{/snippet}

	{#snippet summary(round: EqGuessRound)}
		<span>
			Target: <span class="font-mono text-foreground">{bandSummary(round.targetEq)}</span>
		</span>
		{#if round.guess && !eqConfigsEqual(round.guess, round.targetEq)}
			<span>
				Your guess: <span class="font-mono text-foreground">{bandSummary(round.guess)}</span>
			</span>
		{/if}
	{/snippet}

	{#snippet resultVisual(round: EqGuessRound)}
		<EqChoice
			options={round.options}
			targetEq={round.targetEq}
			guess={round.guess}
			disabled={true}
		/>
	{/snippet}
</GameShell>
