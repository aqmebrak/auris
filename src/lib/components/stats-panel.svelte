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
</script>

<section aria-label="Training statistics" class="bg-card border border-border rounded-lg p-5">
	<div class="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
		<dl class="flex flex-col gap-1 py-3 sm:py-0 sm:px-5 first:pl-0 last:pr-0">
			<dt class="text-xs tracking-widest uppercase text-muted-foreground">Sessions Played</dt>
			<dd
				class="text-2xl font-semibold tabular-nums text-foreground"
				aria-label={sessionDisplay(stats) === '—' ? 'Sessions played: no data' : undefined}
			>
				{sessionDisplay(stats)}
			</dd>
		</dl>
		<dl class="flex flex-col gap-1 py-3 sm:py-0 sm:px-5 first:pl-0 last:pr-0">
			<dt class="text-xs tracking-widest uppercase text-muted-foreground">Best Score</dt>
			<dd
				class="text-2xl font-semibold tabular-nums text-foreground"
				aria-label={scoreDisplay(stats) === '—' ? 'Best score: no data' : undefined}
			>
				{scoreDisplay(stats)}
			</dd>
		</dl>
		<dl class="flex flex-col gap-1 py-3 sm:py-0 sm:px-5 first:pl-0 last:pr-0">
			<dt class="text-xs tracking-widest uppercase text-muted-foreground">Last Played</dt>
			<dd
				class="text-2xl font-semibold tabular-nums text-foreground"
				aria-label={lastPlayedDisplay(stats) === '—' ? 'Last played: no data' : undefined}
			>
				{lastPlayedDisplay(stats)}
			</dd>
		</dl>
	</div>
</section>
