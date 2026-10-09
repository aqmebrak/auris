import { expect, test } from '@playwright/test';
import { GAMES } from '$lib/games/registry.js';

test('dashboard lists every registered game, grouped, each with a PLAY link', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByText('TRAINING MODULES')).toBeVisible();
	await expect(page.getByRole('list').locator('li')).toHaveCount(GAMES.length);
	await expect(page.getByRole('link', { name: 'PLAY', exact: true })).toHaveCount(GAMES.length);
	for (const game of GAMES) {
		await expect(page.getByText(game.title, { exact: true }).first()).toBeVisible();
	}
	await expect(page.getByText('EQ & Filters')).toBeVisible();
	// Nothing played yet → the first game is suggested
	await expect(page.getByTestId('recommendation')).toContainText(GAMES[0].title);
});

test('dashboard shows progress from stored sessions and recommends the weakest game', async ({
	page
}) => {
	await page.addInitScript(() => {
		const session = (accuracy: number, difficulty = 'medium') => ({
			timestamp: new Date().toISOString(),
			score: 3,
			accuracy,
			meta: { difficulty, roundCount: 5 }
		});
		const store = (history: ReturnType<typeof session>[]) =>
			JSON.stringify({
				gamesPlayed: history.length,
				bestScore: 5,
				lastPlayed: history.at(-1)!.timestamp,
				history
			});
		localStorage.setItem('auris:stats:freq-id', store([session(90), session(95), session(100)]));
		localStorage.setItem('auris:stats:eq-matching', store([session(30), session(40)]));
		for (const id of [
			'eq-guess',
			'filter-finder',
			'dynamics',
			'panning',
			'stereo-width',
			'phase-comb',
			'db-change'
		])
			localStorage.setItem(`auris:stats:${id}`, store([session(80), session(85)]));
	});
	await page.goto('/');

	await expect(page.getByTestId('recommendation')).toContainText('EQ Matching');
	await expect(page.getByTestId('recommendation')).toContainText('35%');
	await expect(page.getByRole('img', { name: /Frequency ID accuracy trend/ })).toBeVisible();
	await expect(page.getByText('Modules tried')).toBeVisible();
	await expect(page.getByText('9 / 9')).toBeVisible();
});
