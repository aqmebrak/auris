<script lang="ts">
	import type { CompSpec } from '$lib/games/dynamics/audio.js';
	import { formatAttack, formatRelease, formatRatio } from '$lib/format.js';

	interface Props {
		target: CompSpec;
		guess: CompSpec | null;
	}

	let { target, guess }: Props = $props();

	const rows = $derived([
		{
			label: 'Ratio',
			t: formatRatio(target.ratio),
			g: guess ? formatRatio(guess.ratio) : '—',
			ok: guess?.ratio === target.ratio
		},
		{
			label: 'Attack',
			t: formatAttack(target.attackMs),
			g: guess ? formatAttack(guess.attackMs) : '—',
			ok: guess?.attackMs === target.attackMs
		},
		{
			label: 'Release',
			t: formatRelease(target.releaseMs),
			g: guess ? formatRelease(guess.releaseMs) : '—',
			ok: guess?.releaseMs === target.releaseMs
		}
	]);
</script>

<table class="w-full border-collapse font-mono text-sm">
	<thead>
		<tr class="text-xs tracking-widest text-muted-foreground uppercase">
			<th class="py-1 pr-4 text-left">Param</th>
			<th class="py-1 pr-4 text-left">Target</th>
			<th class="py-1 pr-4 text-left">Yours</th>
			<th class="py-1 text-left">Match</th>
		</tr>
	</thead>
	<tbody>
		{#each rows as row (row.label)}
			<tr class="border-t border-zinc-800">
				<td class="py-2 pr-4 text-muted-foreground">{row.label}</td>
				<td class="py-2 pr-4 text-green-400">{row.t}</td>
				<td class="py-2 pr-4 {row.ok ? 'text-green-400' : 'text-red-400'}">{row.g}</td>
				<td class="py-2">{row.ok ? '✓' : '✗'}</td>
			</tr>
		{/each}
	</tbody>
</table>
