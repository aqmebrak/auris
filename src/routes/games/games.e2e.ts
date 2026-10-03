import { expect, test, type Page } from '@playwright/test';

async function clickCenter(page: Page, role: 'slider') {
	const box = (await page.getByRole(role).first().boundingBox())!;
	await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

interface Game {
	name: string;
	path: string;
	hasAB: boolean;
	setup?: (page: Page) => Promise<void>;
	answer: (page: Page) => Promise<void>;
}

const dynamics = (mode: string, answer: Game['answer']): Game => ({
	name: `dynamics-${mode}`,
	path: '/games/dynamics',
	hasAB: true,
	setup: (page: Page) => page.getByRole('button', { name: mode, exact: true }).click(),
	answer
});
const clickFirst = (name: RegExp) => (page: Page) =>
	page.getByRole('button', { name }).first().click();

const GAMES: Game[] = [
	dynamics('Detect', clickFirst(/^Clip 1$/)),
	dynamics('Ratio', clickFirst(/^(\d+(\.\d+)?|∞):1$/)),
	dynamics('Attack', clickFirst(/^\d+ ms$/)),
	dynamics('Release', clickFirst(/^\d+ ms$/)),
	dynamics('Match', (page: Page) => page.getByRole('button', { name: 'SUBMIT' }).click()),
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
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));
		await page.goto(game.path);
		await game.setup?.(page);
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
