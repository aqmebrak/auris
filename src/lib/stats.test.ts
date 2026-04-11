import { describe, it, expect, beforeEach } from 'vitest';
import { getStats, saveStats } from './stats.js';

describe('getStats', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('returns defaults when localStorage is empty', () => {
		const stats = getStats();
		expect(stats).toEqual({
			sessionsPlayed: 0,
			bestScore: 0,
			lastPlayed: null,
			freqIdGamesPlayed: 0,
			freqIdBestScore: null
		});
	});

	it('returns defaults when localStorage value is malformed', () => {
		localStorage.setItem('auris:stats', 'not-json');
		const stats = getStats();
		expect(stats).toEqual({
			sessionsPlayed: 0,
			bestScore: 0,
			lastPlayed: null,
			freqIdGamesPlayed: 0,
			freqIdBestScore: null
		});
	});
});

describe('saveStats + getStats round-trip', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('round-trips all fields correctly', () => {
		const data = {
			sessionsPlayed: 5,
			bestScore: 92,
			lastPlayed: '2026-04-10',
			freqIdGamesPlayed: 0,
			freqIdBestScore: null
		};
		saveStats(data);
		const retrieved = getStats();
		expect(retrieved).toEqual(data);
	});

	it('round-trips null lastPlayed correctly', () => {
		const data = {
			sessionsPlayed: 1,
			bestScore: 0,
			lastPlayed: null,
			freqIdGamesPlayed: 0,
			freqIdBestScore: null
		};
		saveStats(data);
		const retrieved = getStats();
		expect(retrieved).toEqual(data);
	});
});

describe('freqId stats derived from history', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('returns freqIdGamesPlayed and freqIdBestScore from history', () => {
		localStorage.setItem(
			'auris_freq_id_history',
			JSON.stringify([
				{ timestamp: '2026-01-01T00:00:00.000Z', difficulty: 'easy', score: 3, rounds: [] },
				{ timestamp: '2026-01-02T00:00:00.000Z', difficulty: 'medium', score: 5, rounds: [] }
			])
		);
		const stats = getStats();
		expect(stats.freqIdGamesPlayed).toBe(2);
		expect(stats.freqIdBestScore).toBe(5);
	});
});
