import { expect, test, type Page } from '@playwright/test';
import { GAMES } from './game-fixtures.js';

/**
 * The game screen must not jump between states: options, hint and board keep
 * the same position and size through idle → playing → result → next idle, and
 * the transport bar keeps its height.
 */
const TOLERANCE = 1.5; // px

type Box = { top: number; height: number };

async function measure(page: Page, testId: string): Promise<Box> {
	return page.evaluate((id) => {
		const el = document.querySelector(`[data-testid="${id}"]`)!;
		const r = el.getBoundingClientRect();
		return { top: r.top + window.scrollY, height: r.height };
	}, testId);
}

async function snapshot(page: Page) {
	return {
		options: await measure(page, 'options'),
		hint: await measure(page, 'hint'),
		board: await measure(page, 'board'),
		transport: await measure(page, 'transport')
	};
}

const VIEWPORTS = [
	{ name: 'desktop', width: 1280, height: 900 },
	{ name: 'mobile', width: 402, height: 874 }
];

for (const viewport of VIEWPORTS) {
	for (const game of GAMES) {
		test(`${game.name} @${viewport.name}: layout is stable across states`, async ({ page }) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.goto(game.path);
			await game.setup?.(page);
			await page.getByRole('button', { name: '3', exact: true }).click();
			await page.getByRole('button', { name: game.difficulty ?? 'Easy' }).click();
			await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

			const idle = await snapshot(page);

			await page.keyboard.press('Enter');
			await expect(page.getByRole('button', { name: 'REPLAY', exact: true })).toBeEnabled({
				timeout: 20000
			});
			const playing = await snapshot(page);

			await game.answer(page);
			await expect(page.getByText(/CORRECT|WRONG/).first()).toBeVisible();
			const result = await snapshot(page);

			await page.getByRole('button', { name: /NEXT ROUND|FINISH/ }).click();
			await expect(page.getByText(/ROUND\s*2/)).toBeVisible();
			const nextIdle = await snapshot(page);

			const states = { playing, result, nextIdle };
			for (const [state, snap] of Object.entries(states)) {
				for (const key of ['options', 'hint', 'board'] as const) {
					expect(snap[key].top, `${key}.top in ${state}`).toBeCloseTo(idle[key].top, 0);
					expect(
						Math.abs(snap[key].height - idle[key].height),
						`${key}.height in ${state} (${snap[key].height} vs ${idle[key].height})`
					).toBeLessThanOrEqual(TOLERANCE);
				}
				expect(
					Math.abs(snap.transport.height - idle.transport.height),
					`transport.height in ${state}`
				).toBeLessThanOrEqual(TOLERANCE);
			}
		});
	}
}
