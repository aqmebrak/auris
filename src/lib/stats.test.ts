import { describe, it, expect, beforeEach } from 'vitest';
import { getStats, saveStats } from './stats.js';

describe('getStats', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('returns defaults when localStorage is empty', () => {
		const stats = getStats();
		expect(stats).toEqual({ sessionsPlayed: 0, bestScore: 0, lastPlayed: null });
	});

	it('returns defaults when localStorage value is malformed', () => {
		localStorage.setItem('auris:stats', 'not-json');
		const stats = getStats();
		expect(stats).toEqual({ sessionsPlayed: 0, bestScore: 0, lastPlayed: null });
	});
});

describe('saveStats + getStats round-trip', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('round-trips all fields correctly', () => {
		const data = { sessionsPlayed: 5, bestScore: 92, lastPlayed: '2026-04-10' };
		saveStats(data);
		const retrieved = getStats();
		expect(retrieved).toEqual(data);
	});

	it('round-trips null lastPlayed correctly', () => {
		const data = { sessionsPlayed: 1, bestScore: 0, lastPlayed: null };
		saveStats(data);
		const retrieved = getStats();
		expect(retrieved).toEqual(data);
	});
});
