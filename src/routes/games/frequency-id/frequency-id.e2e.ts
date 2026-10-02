import { expect, test } from '@playwright/test';

test('frequency id: play a full 3-round session with keyboard + mouse', async ({ page }) => {
	await page.goto('/games/frequency-id');

	await page.getByRole('button', { name: '3', exact: true }).click();
	await page.getByRole('button', { name: 'Easy' }).click();

	// Shortcuts are ignored while a button has focus
	await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

	for (let round = 1; round <= 3; round++) {
		await page.keyboard.press('Enter'); // start via keyboard
		await expect(page.getByText('Click the frequency you hear')).toBeVisible({ timeout: 20000 });

		await page.keyboard.press('b'); // A/B shortcuts shouldn't throw
		await page.keyboard.press('a');
		await expect(page.getByRole('button', { name: 'A', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		const strip = page.getByRole('slider').first();
		const box = (await strip.boundingBox())!;
		await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

		await expect(page.getByText(/CORRECT|WRONG/).first()).toBeVisible();
		await page.keyboard.press('Enter'); // next / finish
	}

	await expect(page.getByText('GAME OVER')).toBeVisible();

	const stats = await page.evaluate(() =>
		JSON.parse(localStorage.getItem('auris:stats:freq-id') ?? 'null')
	);
	expect(stats.gamesPlayed).toBe(1);
	expect(stats.history[0].accuracy).toBeGreaterThanOrEqual(0);
	expect(stats.history[0].meta.rounds).toHaveLength(3);
	await page.getByRole('button', { name: 'PLAY AGAIN' }).click();
	await expect(page.getByRole('button', { name: 'PLAY' })).toBeVisible();
});
