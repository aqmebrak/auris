<script lang="ts">
	let {
		result,
		targetFreq,
		targetGainDb,
		targetQ,
		userFreq,
		userGainDb,
		userQ,
		errorMarginPct,
		isLastRound,
		onnext
	}: {
		result: 'correct' | 'incorrect';
		targetFreq: number;
		targetGainDb: number;
		targetQ: number;
		userFreq: number;
		userGainDb: number;
		userQ: number;
		errorMarginPct: number;
		isLastRound: boolean;
		onnext: () => void;
	} = $props();

	function formatHz(hz: number): string {
		if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
		return `${Math.round(hz)} Hz`;
	}

	function formatDb(db: number): string {
		return `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`;
	}

	const marginHz = $derived(Math.round(targetFreq * errorMarginPct));
	const marginPct = $derived(Math.round(errorMarginPct * 100));
</script>

<div class="space-y-4">
	<!-- Verdict -->
	<p
		aria-live="assertive"
		class="text-2xl font-semibold tracking-wide uppercase {result === 'correct'
			? 'text-primary'
			: 'text-destructive'}"
	>
		{result === 'correct' ? 'Correct ✓' : 'Incorrect ✗'}
	</p>

	<!-- Comparison table -->
	<div class="rounded-lg border border-border bg-card p-4">
		<table aria-label="Round result comparison" class="w-full">
			<thead>
				<tr>
					<th
						scope="col"
						class="py-1 text-left text-xs tracking-widest text-muted-foreground uppercase"
					></th>
					<th
						scope="col"
						class="py-1 text-right text-xs tracking-widest text-muted-foreground uppercase"
						>YOUR GUESS</th
					>
					<th
						scope="col"
						class="py-1 text-right text-xs tracking-widest text-muted-foreground uppercase"
						>TARGET</th
					>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td class="py-1 text-xs tracking-widest text-muted-foreground uppercase">FREQ</td>
					<td class="py-1 text-right font-mono text-sm tabular-nums">{formatHz(userFreq)}</td>
					<td class="py-1 text-right font-mono text-sm text-primary tabular-nums"
						>{formatHz(targetFreq)}</td
					>
				</tr>
				<tr>
					<td class="py-1 text-xs tracking-widest text-muted-foreground uppercase">GAIN</td>
					<td class="py-1 text-right font-mono text-sm tabular-nums">{formatDb(userGainDb)}</td>
					<td class="py-1 text-right font-mono text-sm text-primary tabular-nums"
						>{formatDb(targetGainDb)}</td
					>
				</tr>
				<tr>
					<td class="py-1 text-xs tracking-widest text-muted-foreground uppercase">Q</td>
					<td class="py-1 text-right font-mono text-sm tabular-nums">{userQ.toFixed(1)}</td>
					<td class="py-1 text-right font-mono text-sm text-primary tabular-nums"
						>{targetQ.toFixed(1)}</td
					>
				</tr>
				<tr>
					<td class="py-1 text-xs tracking-widest text-muted-foreground uppercase">MARGIN</td>
					<td
						class="py-1 text-right font-mono text-sm text-muted-foreground tabular-nums"
						colspan="2"
					>
						±{marginPct}% = ±{marginHz} Hz
					</td>
				</tr>
			</tbody>
		</table>
	</div>

	<!-- Action button -->
	<div class="flex justify-end">
		<button
			class="h-8 rounded-none border border-border px-4 text-xs font-semibold tracking-widest uppercase transition-colors hover:bg-muted"
			onclick={onnext}
		>
			{isLastRound ? 'SEE RESULTS' : 'NEXT ROUND'}
		</button>
	</div>
</div>
