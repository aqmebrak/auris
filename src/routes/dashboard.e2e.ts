import { expect, test } from '@playwright/test';

test('dashboard game card grid renders three disabled cards', async ({ page }) => {
	await page.goto('/');

	const grid = page.getByRole('list');
	await expect(grid).toBeVisible();

	const cards = grid.locator('li');
	await expect(cards).toHaveCount(3);

	// Each card should have a disabled "COMING SOON" button
	const buttons = page.getByRole('button', { name: /coming soon/i });
	await expect(buttons).toHaveCount(3);
	for (const button of await buttons.all()) {
		await expect(button).toBeDisabled();
	}

	// Section heading
	await expect(page.getByText('TRAINING MODULES')).toBeVisible();

	// Card titles
	await expect(page.getByText('EQ Matching')).toBeVisible();
	await expect(page.getByText('Frequency ID')).toBeVisible();
	await expect(page.getByText('Dynamics')).toBeVisible();
});
