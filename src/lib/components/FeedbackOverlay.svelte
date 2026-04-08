<script lang="ts">
	import { fly } from 'svelte/transition';
	import type { AnswerResult, AnswerValue } from '$lib/exercises/types.js';

	interface Props {
		result: AnswerResult | null;
		visible: boolean;
		onnext: () => void;
	}

	let { result, visible, onnext }: Props = $props();

	function formatAnswer(answer: AnswerValue): string {
		switch (answer.type) {
			case 'decibel':
				return `${answer.gainDb > 0 ? '+' : ''}${answer.gainDb} dB`;
			case 'panning':
				if (answer.pan === 0) return 'Center';
				return `${answer.pan > 0 ? 'R' : 'L'} ${Math.abs(Math.round(answer.pan * 100))}%`;
			case 'eq':
				return `${answer.frequencyHz} Hz  ${answer.gainDb > 0 ? '+' : ''}${answer.gainDb} dB`;
			case 'compression':
				if (answer.detected !== undefined) return answer.detected ? 'Compressed' : 'Dry';
				if (answer.ratio !== undefined) return `${answer.ratio}:1`;
				return '—';
		}
	}
</script>

{#if visible && result}
	<div
		class="fixed inset-x-0 bottom-0 z-20 flex items-end justify-center p-4"
		transition:fly={{ y: 100, duration: 250 }}
	>
		<div
			class="w-full max-w-md rounded-xl border p-6"
			class:bg-green-950={result.correct}
			class:border-green-600={result.correct}
			class:bg-red-950={!result.correct}
			class:border-red-700={!result.correct}
		>
			<div class="mb-4 flex items-start justify-between">
				<span
					class="text-xl font-bold"
					class:text-green-400={result.correct}
					class:text-red-400={!result.correct}
				>
					{result.correct ? 'Correct!' : 'Not quite'}
				</span>
				<span class="font-mono text-lg text-yellow-400">+{result.points} pts</span>
			</div>
			<dl class="mb-5 space-y-1 text-sm">
				<div class="flex justify-between">
					<dt class="text-zinc-400">Your answer</dt>
					<dd class="font-mono text-zinc-100">{formatAnswer(result.userAnswer)}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-zinc-400">Correct</dt>
					<dd class="font-mono text-zinc-100">{formatAnswer(result.correctAnswer)}</dd>
				</div>
			</dl>
			<button
				onclick={onnext}
				class="w-full rounded-lg bg-zinc-700 py-3 font-semibold text-zinc-100 transition-colors hover:bg-zinc-600"
			>
				Next →
			</button>
		</div>
	</div>
{/if}
