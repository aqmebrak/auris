import { expect, test } from '@playwright/test';

test('dashboard renders training module cards', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByText('TRAINING MODULES')).toBeVisible();

	const cards = page.getByRole('list').locator('li');
	await expect(cards.first()).toBeVisible();

	// Every card is either playable (link) or disabled (coming soon)
	const playLinks = page.getByRole('link', { name: /play/i });
	const comingSoon = page.getByRole('button', { name: /coming soon/i });
	const total = await cards.count();
	expect((await playLinks.count()) + (await comingSoon.count())).toBe(total);
	for (const button of await comingSoon.all()) {
		await expect(button).toBeDisabled();
	}

	await expect(page.getByText('Frequency ID')).toBeVisible();
	await expect(page.getByText('EQ Matching')).toBeVisible();
});
