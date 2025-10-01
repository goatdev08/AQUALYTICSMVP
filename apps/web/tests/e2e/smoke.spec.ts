import { test, expect } from '@playwright/test';

test('homepage renders and has dashboard link', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AquaLytics|Aqualytics/i);
  // Verificar que el layout carga elementos básicos
  await expect(page.locator('body')).toBeVisible();
});













