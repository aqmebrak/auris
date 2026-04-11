<script lang="ts">
	import { resolve } from '$app/paths';
	import type { GameSession } from '$lib/game/types.js';

	let {
		session,
		onPlayAgain,
		onHome
	}: {
		session: GameSession;
		onPlayAgain: () => void;
		onHome: () => void;
	} = $props();

	function formatHz(hz: number): string {
		if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
		return `${Math.round(hz)} Hz`;
	}
</script>

<div class="space-y-6">
	<div>
		<p class="text-sm tracking-widest text-muted-foreground uppercase">Game Over</p>
		<p aria-live="polite" class="font-mono text-4xl font-semibold text-foreground tabular-nums">
			{session.score} / 5
		</p>
	</div>

	<!-- Round history table -->
	<div class="rounded-lg border border-border bg-card p-4">
		<table aria-label="Round history" class="w-full">
			<thead>
				<tr>
					<th
						scope="col"
						class="py-1 text-left text-xs tracking-widest text-muted-foreground uppercase">#</th
					>
					<th
						scope="col"
						class="py-1 text-left text-xs tracking-widest text-muted-foreground uppercase"
						>TARGET</th
					>
					<th
						scope="col"
						class="py-1 text-left text-xs tracking-widest text-muted-foreground uppercase"
						>YOUR GUESS</th
					>
					<th
						scope="col"
						class="py-1 text-right text-xs tracking-widest text-muted-foreground uppercase"
						>RESULT</th
					>
				</tr>
			</thead>
			<tbody>
				{#each session.rounds as round, i (i)}
					<tr class={round.result === 'correct' ? 'text-foreground' : 'text-muted-foreground'}>
						<td class="py-1 font-mono text-sm tabular-nums">{i + 1}</td>
						<td class="py-1 font-mono text-sm tabular-nums">{formatHz(round.targetFreq)}</td>
						<td class="py-1 font-mono text-sm tabular-nums">
							{round.userFreq !== null ? formatHz(round.userFreq) : '—'}
						</td>
						<td class="py-1 text-right font-mono text-sm">
							{#if round.result === 'correct'}
								<span class="text-primary">✓</span>
							{:else}
								<span class="text-destructive">✗</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Action buttons -->
	<div class="flex flex-col gap-3 sm:flex-row sm:gap-4">
		<button
			class="h-8 flex-1 rounded-none border border-border bg-transparent px-4 text-xs font-semibold tracking-widest uppercase transition-colors hover:bg-muted"
			onclick={onPlayAgain}
		>
			PLAY AGAIN
		</button>
		<a
			href={resolve('/')}
			class="flex h-8 flex-1 items-center justify-center rounded-none px-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
			onclick={onHome}
		>
			BACK TO HOME
		</a>
	</div>
</div>
