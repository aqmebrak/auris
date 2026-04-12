<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		score: number;
		roundIndex: number;
		totalRounds: number;
		showStats: boolean;
	}

	let { score, roundIndex, totalRounds, showStats }: Props = $props();
</script>

<div class="mb-10 flex items-center justify-between">
	<a
		href={resolve('/')}
		class="text-xs tracking-widest text-muted-foreground uppercase hover:text-foreground"
	>
		← Back
	</a>
	{#if showStats}
		<div class="flex items-center gap-6">
			<span class="font-mono text-sm text-muted-foreground">
				SCORE <span class="text-foreground">{score}</span> / {totalRounds}
			</span>
			<span class="text-sm tracking-widest text-muted-foreground uppercase">
				ROUND <span class="font-mono text-foreground">{roundIndex + 1}</span> / {totalRounds}
			</span>
		</div>
	{/if}
</div>
