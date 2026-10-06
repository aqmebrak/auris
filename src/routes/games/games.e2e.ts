import { expect, test } from '@playwright/test';
import { GAMES } from './game-fixtures.js';

for (const game of GAMES) {
	test(`${game.name}: full 3-round session`, async ({ page }) => {
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await page.goto(game.path);
		await game.setup?.(page);
		await page.getByRole('button', { name: '3', exact: true }).click();
		await page.getByRole('button', { name: game.difficulty ?? 'Easy' }).click();
		await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

		for (let round = 0; round < 3; round++) {
			await page.keyboard.press('Enter');
			await expect(page.getByRole('button', { name: 'REPLAY', exact: true })).toBeEnabled({
				timeout: 20000
			});

			if (game.hasAB) {
				await page.keyboard.press('a');
				await expect(page.getByRole('button', { name: /key A/ })).toHaveAttribute(
					'aria-pressed',
					'true'
				);
			}
			await page.keyboard.press(' '); // pause
			await expect(page.getByRole('button', { name: 'PLAY', exact: true })).toBeVisible();

			await game.answer(page);
			await expect(page.getByText(/CORRECT|WRONG/).first()).toBeVisible();
			await page.getByRole('button', { name: /NEXT ROUND|FINISH/ }).click();
			await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
		}

		await expect(page.getByText('GAME OVER')).toBeVisible();
		expect(errors).toEqual([]);
	});
}
