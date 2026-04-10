import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PASSWORD = '88900098';

async function loginAs(page: any, email: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('you@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(2000);
}

test.describe('Role-Based Access Control', () => {

  test('Sales exec cannot access admin dashboard', async ({ page }) => {
    await loginAs(page, 'sales@test.com');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(`${BASE_URL}/admin`);
  });

  test('Staff cannot access admin dashboard', async ({ page }) => {
    await loginAs(page, 'staff@test.com');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(`${BASE_URL}/admin`);
  });

  test('Client cannot access admin dashboard', async ({ page }) => {
    await loginAs(page, 'contact@austindental.com');
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(`${BASE_URL}/admin`);
  });

  test('Client cannot access sales cockpit', async ({ page }) => {
    await loginAs(page, 'contact@austindental.com');
    await page.goto(`${BASE_URL}/sales`);
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(`${BASE_URL}/sales`);
  });

  test('Client cannot access projects dashboard', async ({ page }) => {
    await loginAs(page, 'contact@austindental.com');
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(`${BASE_URL}/projects`);
  });

  test('Staff cannot access strategist dashboard', async ({ page }) => {
    await loginAs(page, 'staff@test.com');
    await page.goto(`${BASE_URL}/strategist`);
    await page.waitForTimeout(2000);
    await expect(page).not.toHaveURL(`${BASE_URL}/strategist`);
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
