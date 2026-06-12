import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PASSWORD = '9353@Fmos';

const TELECALLER = 'afifa@fmos.com';

async function loginAs(page: any, email: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('you@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(2000);
}

test.describe('Role-Based Access Control', () => {

  test('Telecaller cannot access admin dashboard', async ({ page }) => {
    await loginAs(page, TELECALLER);
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(`${BASE_URL}/admin`);
  });

  test('Telecaller cannot access admin finance', async ({ page }) => {
    await loginAs(page, TELECALLER);
    await page.goto(`${BASE_URL}/admin/finance`);
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(`${BASE_URL}/admin/finance`);
  });

  test('Logged out user cannot access admin', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(new RegExp('/login'));
  });

  test('Logged out user cannot access sales', async ({ page }) => {
    await page.goto(`${BASE_URL}/sales`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(new RegExp('/login'));
  });

});
