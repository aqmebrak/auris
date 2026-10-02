import { expect, test, type Page } from '@playwright/test';

async function clickCenter(page: Page, role: 'slider') {
	const box = (await page.getByRole(role).first().boundingBox())!;
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

const GAMES = [
	{
		name: 'panning',
		path: '/games/panning',
		hasAB: false,
		answer: (page: Page) => clickCenter(page, 'slider')
	},
	{
		name: 'db-change',
		path: '/games/db-change',
		hasAB: true,
		answer: (page: Page) => page.getByRole('button', { name: /dB/ }).first().click()
	},
	{
		name: 'eq-matching',
		path: '/games/eq-matching',
		hasAB: true,
		answer: (page: Page) => page.getByRole('button', { name: 'SUBMIT' }).click()
	},
	{
		name: 'eq-guess',
		path: '/games/eq-guess',
		hasAB: true,
		answer: (page: Page) => page.getByRole('button', { name: /Hz/ }).first().click()
	}
];

for (const game of GAMES) {
	test(`${game.name}: full 3-round session`, async ({ page }) => {
		await page.goto(game.path);
		await page.getByRole('button', { name: '3', exact: true }).click();
		await page.getByRole('button', { name: 'Easy' }).click();
		await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

		for (let round = 0; round < 3; round++) {
			await page.keyboard.press('Enter');
			await expect(page.getByRole('button', { name: 'REPLAY', exact: true })).toBeVisible({
				timeout: 20000
			});

			if (game.hasAB) {
				await page.keyboard.press('a');
				await expect(page.getByRole('button', { name: 'A', exact: true })).toHaveAttribute(
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
	});
}
