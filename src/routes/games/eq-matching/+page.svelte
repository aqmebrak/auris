<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import EqBandKnobs from '$lib/components/eq-band-knobs.svelte';
	import EqCurve from '$lib/components/eq-curve.svelte';
	import EqMatchResult from '$lib/components/eq-match-result.svelte';
	import type { BoardState } from '$lib/game/board.js';
	import GameShell from '$lib/components/game/game-shell.svelte';
	import OptionGroup from '$lib/components/game/option-group.svelte';
	import { createGameController } from '$lib/stores/game-controller.svelte.js';
	import {
		createEqMatchingConfig,
		DEFAULT_OPTIONS,
		DIFFICULTY_CONFIG,
		ROUND_COUNT_OPTIONS,
		defaultBands,
		type EqBand,
		type EqMatchingRound,
		type EqMatchingOptions
	} from '$lib/games/eq-matching/config.js';
	import { EqMatchingAudio } from '$lib/games/eq-matching/audio.js';
	import { numbers } from '$lib/game/options.js';
	import { formatFreq, formatDb } from '$lib/format.js';

	const audio = new EqMatchingAudio();
	let userBands = $state<EqBand[]>(
		defaultBands(DIFFICULTY_CONFIG[DEFAULT_OPTIONS.difficulty].bandCount)
	);

	const ctrl = createGameController<EqMatchingRound, EqBand[], EqMatchingOptions>({
		gameId: 'eq-matching',
		defaultOptions: DEFAULT_OPTIONS,
		createConfig: createEqMatchingConfig,
		audio,
		onOptionsChange: (o) => (userBands = defaultBands(DIFFICULTY_CONFIG[o.difficulty].bandCount)),
		prepareRound: (round) => {
			userBands = defaultBands(diff.bandCount);
			audio.setTargetBands(round.targetBands);
			audio.setUserBands(userBands);
		},
		sessionMeta: (rounds, o) => ({
			difficulty: o.difficulty,
			roundCount: o.roundCount,
			rounds: rounds.map((r) => ({
				targetBands: r.targetBands,
				guess: r.guess,
				score: r.score,
				correct: r.result === 'correct'
			}))
		})
	});

	const diff = $derived(DIFFICULTY_CONFIG[ctrl.options.difficulty]);

	// Live sync knob state → audio
	$effect(() => {
		audio.setUserBands([...userBands]);
	});

	function bandSummary(bands: EqBand[]): string {
		return bands.map((b) => `${formatFreq(b.freq)} ${formatDb(b.gainDb)}`).join(' · ');
	}
</script>

<GameShell
	{ctrl}
	title="EQ Matching"
	graded
	intro={`Press PLAY to hear the Target. Switch to Your EQ and adjust the band knobs until it sounds the same — the curve shows your EQ live. You need a ${Math.round(diff.passThreshold * 100)}% match.`}
	instruction="Make Your EQ sound like the Target, then submit."
	modeLabels={{ A: 'Your EQ', B: 'Target' }}
	legend="Both versions are loudness-matched"
	formatRound={(round, i) => ({
		label: `Round ${i + 1}`,
		primary: bandSummary(round.targetBands),
		secondary: round.guess ? bandSummary(round.guess) : null,
		result: round.result
	})}
>
	{#snippet options()}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<OptionGroup
				label="Difficulty"
				choices={Object.entries(DIFFICULTY_CONFIG).map(([value, c]) => ({
					value: value as EqMatchingOptions['difficulty'],
					label: `${c.label} — ${c.bandCount} band${c.bandCount > 1 ? 's' : ''}`
				}))}
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

	{#snippet board(round: EqMatchingRound, ui: BoardState)}
		{@const shown = ui.revealed && round.guess ? round.guess : userBands}
		<!-- Pinned on small screens so the curve stays visible while turning knobs -->
		<div class="sticky top-12 z-10 rounded border border-zinc-700 bg-zinc-950 p-3 md:static md:p-4">
			<EqCurve
				bands={shown}
				compare={ui.revealed ? round.targetBands : undefined}
				class="h-40 md:h-80"
			/>
		</div>
		<div class="flex flex-col gap-6">
			{#each shown as band, i (i)}
				<div class="rounded border border-zinc-800 bg-zinc-950 px-6 py-4">
					<p class="mb-4 text-xs font-medium tracking-widest text-zinc-500 uppercase">
						Band {i + 1}
					</p>
					<EqBandKnobs
						{band}
						gainPool={diff.gainPool}
						qEditable={diff.qEditable}
						disabled={!ui.interactive}
						onChange={(b) => (userBands[i] = b)}
					/>
				</div>
			{/each}
		</div>
		<div class="flex justify-center">
			<Button
				size="lg"
				class="px-12 text-sm tracking-widest"
				disabled={!ui.interactive}
				onclick={() => ctrl.submit(userBands.map((b) => ({ ...b })))}
			>
				SUBMIT
			</Button>
		</div>
	{/snippet}

	{#snippet feedback(round: EqMatchingRound)}
		<span>
			Target: <span class="font-mono text-foreground">{bandSummary(round.targetBands)}</span>
		</span>
		{#if round.guess}
			<span>
				Yours: <span class="font-mono text-foreground">{bandSummary(round.guess)}</span>
			</span>
			<EqMatchResult target={round.targetBands} guess={round.guess} showQ={diff.qEditable} />
		{/if}
	{/snippet}
</GameShell>
