<script lang="ts">
	import { browser } from '$app/environment';
	import { getStats, type AurisStats } from '$lib/stats.js';

	let stats = $state<AurisStats | null>(null);

	$effect(() => {
		if (browser) {
			stats = getStats();
		}
	});

	function sessionDisplay(s: AurisStats | null): string {
		if (!s || s.sessionsPlayed === 0) return '—';
		return String(s.sessionsPlayed);
	}

	function scoreDisplay(s: AurisStats | null): string {
		if (!s || s.bestScore === 0) return '—';
		return String(s.bestScore);
	}

	function lastPlayedDisplay(s: AurisStats | null): string {
		if (!s || s.lastPlayed === null) return '—';
		return s.lastPlayed;
	}

	function freqIdGamesDisplay(s: AurisStats | null): string {
		if (!s || s.freqIdGamesPlayed === 0) return '—';
		return String(s.freqIdGamesPlayed);
	}

	function freqIdBestDisplay(s: AurisStats | null): string {
		if (!s || s.freqIdBestScore === null) return '—';
		return `${s.freqIdBestScore} / 5`;
	}
</script>

<section aria-label="Training statistics" class="rounded-lg border border-border bg-card p-5">
	<div class="grid grid-cols-1 divide-y divide-border sm:grid-cols-5 sm:divide-x sm:divide-y-0">
		<dl class="flex flex-col gap-1 py-3 first:pl-0 last:pr-0 sm:px-5 sm:py-0">
			<dt class="text-xs tracking-widest text-muted-foreground uppercase">Sessions Played</dt>
			<dd
				class="text-2xl font-semibold text-foreground tabular-nums"
				aria-label={sessionDisplay(stats) === '—' ? 'Sessions played: no data' : undefined}
			>
				{sessionDisplay(stats)}
			</dd>
		</dl>
		<dl class="flex flex-col gap-1 py-3 first:pl-0 last:pr-0 sm:px-5 sm:py-0">
			<dt class="text-xs tracking-widest text-muted-foreground uppercase">Best Score</dt>
			<dd
				class="text-2xl font-semibold text-foreground tabular-nums"
				aria-label={scoreDisplay(stats) === '—' ? 'Best score: no data' : undefined}
			>
				{scoreDisplay(stats)}
			</dd>
		</dl>
		<dl class="flex flex-col gap-1 py-3 first:pl-0 last:pr-0 sm:px-5 sm:py-0">
			<dt class="text-xs tracking-widest text-muted-foreground uppercase">Last Played</dt>
			<dd
				class="text-2xl font-semibold text-foreground tabular-nums"
				aria-label={lastPlayedDisplay(stats) === '—' ? 'Last played: no data' : undefined}
			>
				{lastPlayedDisplay(stats)}
			</dd>
		</dl>
		<dl class="flex flex-col gap-1 py-3 first:pl-0 last:pr-0 sm:px-5 sm:py-0">
			<dt class="text-xs tracking-widest text-muted-foreground uppercase">Freq ID Games</dt>
			<dd
				class="text-2xl font-semibold text-foreground tabular-nums"
				aria-label={freqIdGamesDisplay(stats) === '—' ? 'Freq ID games played: no data' : undefined}
			>
				{freqIdGamesDisplay(stats)}
			</dd>
		</dl>
		<dl class="flex flex-col gap-1 py-3 first:pl-0 last:pr-0 sm:px-5 sm:py-0">
			<dt class="text-xs tracking-widest text-muted-foreground uppercase">Freq ID Best</dt>
			<dd
				class="text-2xl font-semibold text-foreground tabular-nums"
				aria-label={freqIdBestDisplay(stats) === '—' ? 'Freq ID best score: no data' : undefined}
			>
				{freqIdBestDisplay(stats)}
			</dd>
		</dl>
	</div>
</section>
