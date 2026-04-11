import { expect, test } from '@playwright/test';

test('dashboard game card grid renders three cards', async ({ page }) => {
	await page.goto('/');

	const grid = page.getByRole('list');
	await expect(grid).toBeVisible();

	const cards = grid.locator('li');
	await expect(cards).toHaveCount(3);

	// Two cards still coming soon
	const comingSoonButtons = page.getByRole('button', { name: /coming soon/i });
	await expect(comingSoonButtons).toHaveCount(2);
	for (const button of await comingSoonButtons.all()) {
		await expect(button).toBeDisabled();
	}

	// Frequency ID card has a PLAY link
	const playLink = page.getByRole('link', { name: /play/i });
	await expect(playLink).toBeVisible();

	// Section heading
	await expect(page.getByText('TRAINING MODULES')).toBeVisible();

	// Card titles
	await expect(page.getByText('EQ Matching')).toBeVisible();
	await expect(page.getByText('Frequency ID')).toBeVisible();
	await expect(page.getByText('Dynamics')).toBeVisible();
});
