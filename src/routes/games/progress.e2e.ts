import { expect, test } from '@playwright/test';

const seed = (id: string, difficulty: string, accuracies: number[]) => ({
	id,
	history: accuracies.map((accuracy) => ({
		timestamp: new Date().toISOString(),
		score: 4,
		accuracy,
		meta: { difficulty, roundCount: 5 }
	}))
});

async function seedStats(
	page: import('@playwright/test').Page,
	id: string,
	difficulty: string,
	accuracies: number[]
) {
	const s = seed(id, difficulty, accuracies);
	await page.addInitScript((data) => {
		localStorage.setItem(
			`auris:stats:${data.id}`,
			JSON.stringify({
				gamesPlayed: data.history.length,
				bestScore: 5,
				lastPlayed: data.history.at(-1)!.timestamp,
				history: data.history
			})
		);
	}, s);
}

test('suggests a harder level after consistently high accuracy, and applies it', async ({
	page
}) => {
	await seedStats(page, 'freq-id', 'medium', [90, 95, 100]);
	await page.goto('/games/frequency-id');

	const hint = page.getByTestId('suggestion');
	await expect(hint).toContainText('Last 3 sessions on medium: 95%');
	await page.getByRole('button', { name: 'try hard' }).click();
	await expect(page.getByRole('button', { name: 'Hard', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	// Hard has no suggestion above it, nor recent history at that level
	await expect(hint).not.toContainText('try');
});

test('suggests an easier level after low accuracy; nothing for the middle band', async ({
	page
}) => {
	await seedStats(page, 'panning', 'medium', [30, 40]);
	await page.goto('/games/panning');
	await expect(page.getByTestId('suggestion')).toContainText('try easy');

	await seedStats(page, 'db-change', 'medium', [70, 65]);
	await page.goto('/games/db-change');
	await expect(page.getByTestId('suggestion')).not.toContainText('try');
});

test('applying a suggestion on EQ Matching resets the band knobs for the new difficulty', async ({
	page
}) => {
	await seedStats(page, 'eq-matching', 'medium', [95, 95]);
	await page.goto('/games/eq-matching');
	await expect(page.getByText('Band 2')).toBeVisible();
	await expect(page.getByText('Band 3')).toHaveCount(0);
	await page.getByRole('button', { name: 'try hard' }).click();
	await expect(page.getByText('Band 3')).toBeVisible();
});
