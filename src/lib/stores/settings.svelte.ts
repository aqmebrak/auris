import { clamp } from '$lib/audio/utils.js';
import type { ModuleId, Difficulty, UserSettings } from '$lib/exercises/types.js';

const DEFAULT_SETTINGS: UserSettings = {
	masterVolume: 0.8,
	preferredSample: 'pink-noise.mp3',
	difficulties: { decibel: 'easy', eq: 'easy', panning: 'easy', compression: 'easy' },
	autoAdvanceDifficulty: false,
	headphonesNoticeDismissed: false
};

function loadSettings(): UserSettings {
	try {
		const raw = localStorage.getItem('auris_state');
		if (!raw) return structuredClone(DEFAULT_SETTINGS);
		const parsed = JSON.parse(raw);
		const s = parsed?.settings;
		if (!s || typeof s !== 'object') return structuredClone(DEFAULT_SETTINGS);
		// Schema migration: headphonesNoticeDismissed added in v1
		return {
			masterVolume:
				typeof s.masterVolume === 'number'
					? clamp(s.masterVolume, 0, 1)
					: DEFAULT_SETTINGS.masterVolume,
			preferredSample:
				typeof s.preferredSample === 'string'
					? s.preferredSample
					: DEFAULT_SETTINGS.preferredSample,
			difficulties: {
				decibel: s.difficulties?.decibel ?? 'easy',
				eq: s.difficulties?.eq ?? 'easy',
				panning: s.difficulties?.panning ?? 'easy',
				compression: s.difficulties?.compression ?? 'easy'
			},
			autoAdvanceDifficulty:
				typeof s.autoAdvanceDifficulty === 'boolean' ? s.autoAdvanceDifficulty : false,
			headphonesNoticeDismissed:
				typeof s.headphonesNoticeDismissed === 'boolean' ? s.headphonesNoticeDismissed : false
		};
	} catch {
		return structuredClone(DEFAULT_SETTINGS);
	}
}

let settingsState = $state<UserSettings>(loadSettings());

export function setVolume(value: number): void {
	settingsState.masterVolume = clamp(value, 0, 1);
}

export function setDifficulty(moduleId: ModuleId, difficulty: Difficulty): void {
	settingsState.difficulties[moduleId] = difficulty;
}

export function setPreferredSample(sampleId: string): void {
	settingsState.preferredSample = sampleId;
}

export function setAutoAdvance(value: boolean): void {
	settingsState.autoAdvanceDifficulty = value;
}

export function dismissHeadphonesNotice(): void {
	settingsState.headphonesNoticeDismissed = true;
}

export const settings = {
	get masterVolume() {
		return settingsState.masterVolume;
	},
	get preferredSample() {
		return settingsState.preferredSample;
	},
	get difficulties() {
		return settingsState.difficulties;
	},
	get autoAdvanceDifficulty() {
		return settingsState.autoAdvanceDifficulty;
	},
	get headphonesNoticeDismissed() {
		return settingsState.headphonesNoticeDismissed;
	},
	/** Full reactive object — access from $effect for deep dependency tracking */
	get value() {
		return settingsState;
	},
	setVolume,
	setDifficulty,
	setPreferredSample,
	setAutoAdvance,
	dismissHeadphonesNotice
};
