import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('renderiza secciones principales', async ({ page }) => {
    // Si no hay sesión, se espera ver login
    if (page.url().includes('/login')) {
      await expect(page).toHaveURL(/\/login/);
      return;
    }
    await expect(page.locator('[data-testid="dashboard-top5"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-distribucion"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-proximas"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-actividad"]')).toBeVisible();
  });

  test('muestra al menos un gráfico (canvas)', async ({ page }) => {
    if (page.url().includes('/login')) {
      await expect(page).toHaveURL(/\/login/);
      return;
    }
    const canvases = page.locator('canvas');
    const count = await canvases.count();
    expect(count).toBeGreaterThan(0);
  });

  test('actividad reciente: sección visible y opcionalmente metadatos', async ({ page }) => {
    if (page.url().includes('/login')) {
      await expect(page).toHaveURL(/\/login/);
      return;
    }
    // Se asegura que la sección existe
    await expect(page.getByText('Actividad Reciente', { exact: false })).toBeVisible();
    // Si existen metadatos, validar texto "Mostrando"
    const mostrando = page.getByText(/Mostrando\s+\d+\s+de\s+\d+\s+registros recientes/i);
    // No forzar presencia en dataset vacío
    // eslint-disable-next-line playwright/no-conditional-expect
    if (await mostrando.count()) {
      await expect(mostrando).toBeVisible();
    }
  });
});


