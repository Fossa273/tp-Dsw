import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const viewports = [
  { name: 'sm', width: 375, height: 667 },
  { name: 'md', width: 768, height: 1024 },
  { name: 'lg', width: 1440, height: 900 },
] as const;

test('captura la pagina principal en todos los breakpoints', async ({ page }) => {
  const evidenceDir = '../docs/05 - evidencias/responsive';
  await mkdir(evidenceDir, { recursive: true });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');

    await expect(page.getByText('RutaBus').first()).toBeVisible();
    await page.screenshot({
      path: `${evidenceDir}/home-${viewport.name}.png`,
      fullPage: true,
    });
  }
});

test('captura el flujo administrativo en todos los breakpoints', async ({ page }) => {
  const evidenceDir = '../docs/05 - evidencias/responsive';
  await mkdir(evidenceDir, { recursive: true });

  await page.goto('/login');
  await page.locator('#auth-email').fill('admin@rutabus.com');
  await page.locator('#auth-password').fill('admin123');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole('heading', { name: 'Panel de administracion' })
  ).toBeVisible();

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.screenshot({
      path: `${evidenceDir}/admin-${viewport.name}.png`,
      fullPage: true,
    });
  }
});
