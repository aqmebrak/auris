<script lang="ts">
	import DbChoice from '$lib/components/db-choice.svelte';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
	import type { BoardState } from '$lib/game/board.js';
	import {
		createDbChangeConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ROUND_COUNT_OPTIONS,
		type GainRound,
		type DbChangeOptions
	} from '$lib/games/db-change/config.js';
	import { createDbChangeAudio } from '$lib/games/db-change/audio.js';
	import { labelled, numbers } from '$lib/game/options.js';
	import { formatDb } from '$lib/format.js';

	const audio = createDbChangeAudio();
	const ctrl = createGameController<GainRound, number, DbChangeOptions>({
		gameId: 'db-change',
		defaultOptions: DEFAULT_OPTIONS,
		createConfig: createDbChangeConfig,
		audio: audio.chain,
		prepareRound: (round) => audio.setGain(round.targetDb),
		sessionMeta: (rounds, o) => ({
			difficulty: o.difficulty,
			roundCount: o.roundCount,
			rounds: rounds.map((r) => ({
				targetDb: r.targetDb,
				guess: r.guess,
				correct: r.result === 'correct'
			}))
		})
	});
</script>

<GameShell
	{ctrl}
	title="Level Change"
	intro="Press PLAY to hear the audio. Switch between Original and Gained to compare. Select the correct dB value."
	instruction="Select which dB value was applied to the signal"
	modeLabels={{ A: 'Original', B: 'Gained' }}
	formatRound={(round, i) => ({
		label: `Round ${i + 1}`,
		primary: formatDb(round.targetDb),
		secondary: round.guess !== null ? formatDb(round.guess) : null,
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

	{#snippet board(round: GainRound, ui: BoardState)}
		<DbChoice
			options={round.options}
			targetDb={ui.revealed ? round.targetDb : null}
			guess={ui.revealed ? round.guess : null}
			disabled={!ui.interactive}
			masked={ui.phase === 'idle'}
			onSelect={(db) => ctrl.submit(db)}
		/>
	{/snippet}

	{#snippet feedback(round: GainRound)}
		<span>
			Target: <span class="font-mono text-foreground">{formatDb(round.targetDb)}</span>
		</span>
		{#if round.guess !== null}
			<span>
				Your guess: <span class="font-mono text-foreground">{formatDb(round.guess)}</span>
			</span>
		{/if}
	{/snippet}
</GameShell>
