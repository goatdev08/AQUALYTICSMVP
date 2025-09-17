import { chromium, expect } from '@playwright/test';

async function globalSetup() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) {
    throw new Error('E2E_EMAIL y E2E_PASSWORD son requeridos para el login E2E.');
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  await page.goto(baseURL + '/login?redirect=%2Fdashboard');

  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);
  await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

  await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
  // Si permanece en login, intentar registro y reintentar login
  if (page.url().includes('/login')) {
    // Ir a registro
    await page.goto(baseURL + '/register');
    await page.locator('input#email').fill(email);
    await page.locator('input#password').fill(password);
    await page.locator('input#confirmPassword').fill(password);
    // Seleccionar rol entrenador si existe
    const entrenador = page.getByText('Entrenador');
    if (await entrenador.count()) {
      await entrenador.click();
    }
    await page.getByRole('button', { name: /Crear Cuenta/i }).click();
    // Esperar redirect post-registro
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 15000 });
    // Si aún no estamos en dashboard, reintentar login
    if (page.url().includes('/login')) {
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Contraseña').fill(password);
      await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
      await page.waitForURL(/\/(dashboard)/, { timeout: 15000 });
    }
  }

  await context.storageState({ path: './tests/e2e/.auth/user.json' });
  await browser.close();
}

export default globalSetup;


