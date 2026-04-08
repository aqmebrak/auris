<script lang="ts">
	import { onMount } from 'svelte';
	import { audioEngine } from '$lib/audio/engine.svelte.js';
	import { createGainEffect } from '$lib/audio/effects.js';
	import { generateExercise, evaluateAnswer } from '$lib/exercises/decibel.svelte.js';
	import { scores } from '$lib/stores/scores.svelte.js';
	import { settings } from '$lib/stores/settings.svelte.js';
	import AudioTransport from '$lib/components/AudioTransport.svelte';
	import AnswerSlider from '$lib/components/AnswerSlider.svelte';
	import FeedbackOverlay from '$lib/components/FeedbackOverlay.svelte';
	import type { AnswerResult, DecibelParams } from '$lib/exercises/types.js';

	let currentDifficulty = $derived(settings.difficulties['decibel']);
	let exercise = $state(generateExercise(settings.difficulties['decibel']));
	let userAnswer = $state(0);
	let result = $state<AnswerResult | null>(null);

	let sliderStep = $derived(currentDifficulty === 'hard' ? 0.5 : 1);

	onMount(() => {
		audioEngine.loadSamples([exercise.sampleId]);
	});

	function handlePlay() {
		audioEngine.play(exercise.sampleId);
	}

	function handleStop() {
		audioEngine.stop();
	}

	function handleSelectA() {
		audioEngine.play(exercise.sampleId);
	}

	function handleSelectB() {
		const params = exercise.params as DecibelParams;
		audioEngine.playWithEffect(exercise.sampleId, (ctx) => createGainEffect(ctx, params.gainDb));
	}

	function handleSubmit() {
		result = evaluateAnswer(exercise, userAnswer);
		scores.recordAnswer(result);
	}

	function handleNext() {
		audioEngine.stop();
		result = null;
		userAnswer = 0;
		exercise = generateExercise(currentDifficulty);
		audioEngine.loadSamples([exercise.sampleId]);
	}
</script>

<div class="mx-auto flex max-w-lg flex-col gap-8 px-4 py-8">
	<p class="text-center text-zinc-400">{exercise.question}</p>

	<div class="flex justify-center">
		<AudioTransport
			isPlaying={audioEngine.isPlaying}
			currentMode={audioEngine.currentMode}
			disabled={!audioEngine.isLoaded || result !== null}
			onplay={handlePlay}
			onstop={handleStop}
			onselectA={handleSelectA}
			onselectB={handleSelectB}
		/>
	</div>

	<AnswerSlider
		min={-12}
		max={12}
		step={sliderStep}
		unit="dB"
		label="Volume change"
		bind:value={userAnswer}
		disabled={result !== null}
	/>

	<button
		onclick={handleSubmit}
		disabled={result !== null}
		class="w-full rounded-lg bg-cyan-700 py-3 font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
	>
		Submit Answer
	</button>
</div>

<FeedbackOverlay {result} visible={result !== null} onnext={handleNext} />
