import { test, expect } from '@playwright/test';

test('un administrador puede iniciar sesion', async ({ page }) => {
  await page.goto('/login');

  await page.locator('#auth-email').fill('admin@rutabus.com');
  await page.locator('#auth-password').fill('admin123');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole('heading', { name: 'Panel de administracion' })
  ).toBeVisible();
});
