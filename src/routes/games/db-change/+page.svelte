<script lang="ts">
	import DbChoice from '$lib/components/db-choice.svelte';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
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
	intro="Press PLAY to hear the audio. Use A/B to compare dry vs gained signal. Select the correct dB value."
	legend="A = dry (original) · B = gained signal"
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

	{#snippet idle()}
		<div class="grid grid-cols-2 gap-6">
			{#each [0, 1] as i (i)}
				<div
					class="min-h-40 rounded border border-border p-8 font-mono text-3xl tracking-widest text-muted-foreground/30 select-none"
				>
					— dB
				</div>
			{/each}
		</div>
	{/snippet}

	{#snippet playing(round: GainRound)}
		<p class="text-sm text-muted-foreground">Select which dB value was applied to the signal</p>
		<DbChoice options={round.options} onSelect={(db) => ctrl.submit(db)} />
	{/snippet}

	{#snippet summary(round: GainRound)}
		<span>
			Target: <span class="font-mono text-foreground">{formatDb(round.targetDb)}</span>
		</span>
		{#if round.guess !== null}
			<span>
				Your guess: <span class="font-mono text-foreground">{formatDb(round.guess)}</span>
			</span>
		{/if}
	{/snippet}

	{#snippet resultVisual(round: GainRound)}
		<DbChoice
			options={round.options}
			targetDb={round.targetDb}
			guess={round.guess}
			disabled={true}
		/>
	{/snippet}
</GameShell>
