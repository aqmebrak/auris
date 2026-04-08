<script lang="ts">
	import { onMount } from 'svelte';
	import { audioEngine } from '$lib/audio/engine.svelte.js';
	import { createEQEffect } from '$lib/audio/effects.js';
	import { generateExercise, evaluateAnswer, DIFFICULTY_CONFIG } from '$lib/exercises/eq.svelte.js';
	import { scores } from '$lib/stores/scores.svelte.js';
	import { settings } from '$lib/stores/settings.svelte.js';
	import AudioTransport from '$lib/components/AudioTransport.svelte';
	import FrequencyPicker from '$lib/components/FrequencyPicker.svelte';
	import FeedbackOverlay from '$lib/components/FeedbackOverlay.svelte';
	import type { AnswerResult, EQParams } from '$lib/exercises/types.js';

	let currentDifficulty = $derived(settings.difficulties['eq']);
	let exercise = $state(generateExercise(settings.difficulties['eq']));
	let selectedFrequency = $state<number | null>(null);
	let boostOrCut = $state<'boost' | 'cut' | null>(null);
	let gainDb = $state(0);
	let result = $state<AnswerResult | null>(null);

	let config = $derived(DIFFICULTY_CONFIG[currentDifficulty]);
	let bands = $derived(config.bands);
	let showBoostCut = $derived(config.requireBoostCut);
	let showGain = $derived(config.requireGain);

	let canSubmit = $derived(
		selectedFrequency !== null && (!showBoostCut || boostOrCut !== null)
	);

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
		const params = exercise.params as EQParams;
		audioEngine.playWithEffect(exercise.sampleId, (ctx) =>
			createEQEffect(ctx, params.frequencyHz, params.gainDb, params.Q)
		);
	}

	function handleSubmit() {
		if (!canSubmit || result !== null) return;
		result = evaluateAnswer(
			exercise,
			selectedFrequency!,
			showBoostCut ? (boostOrCut ?? undefined) : undefined,
			showGain ? gainDb : undefined
		);
		scores.recordAnswer(result);
	}

	function handleNext() {
		audioEngine.stop();
		result = null;
		selectedFrequency = null;
		boostOrCut = null;
		gainDb = 0;
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

	<FrequencyPicker
		{bands}
		{selectedFrequency}
		{showBoostCut}
		{boostOrCut}
		{showGain}
		bind:gainDb
		disabled={result !== null}
		onselectfrequency={(hz) => (selectedFrequency = hz)}
		onselectboostcut={(bc) => (boostOrCut = bc)}
	/>

	<button
		onclick={handleSubmit}
		disabled={!canSubmit || result !== null}
		class="w-full rounded-lg bg-cyan-700 py-3 font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
	>
		Submit Answer
	</button>
</div>

<FeedbackOverlay {result} visible={result !== null} onnext={handleNext} />
