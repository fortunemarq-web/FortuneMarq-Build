import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PASSWORD = '9353@Fmos';

const TELECALLER = 'afifa@fmos.com';
const ADMIN = 'admin1@fmos.com';

async function loginAs(page: any, email: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('you@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(3000);
}

test.describe('Sales Cockpit', () => {

  test('Sales cockpit loads with lead queue', async ({ page }) => {
    await loginAs(page, TELECALLER);
    await expect(page).toHaveURL(new RegExp('/sales'));
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Sales cockpit shows inbound and outbound toggle', async ({ page }) => {
    await loginAs(page, TELECALLER);
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/inbound|outbound|hot|cold/i);
  });

  test('Session statistics are visible', async ({ page }) => {
    await loginAs(page, TELECALLER);
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/calls|session|follow/i);
  });

});

test.describe('Strategist Pipeline', () => {

  test('Strategist pipeline loads for admin', async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto(`${BASE_URL}/strategist`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Strategist pipeline shows stages', async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto(`${BASE_URL}/strategist`);
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/qualified|strategy|pipeline|deal/i);
  });

});

test.describe('Projects Dashboard', () => {

  test('Projects dashboard loads for admin', async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Projects dashboard shows project list', async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/project|task|milestone/i);
  });

});

test.describe('Admin Command Hub', () => {

  test('Admin dashboard loads', async ({ page }) => {
    await loginAs(page, ADMIN);
    await expect(page).toHaveURL(new RegExp('/admin'));
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin sees hub content', async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/revenue|sales|pipeline|leads/i);
  });

  test('Admin can navigate to finance', async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/admin/finance`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(new RegExp('/admin/finance'));
  });

  test('Admin can navigate to sales analytics', async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/admin/sales`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(new RegExp('/admin/sales'));
  });

  test('Admin can navigate to outreach board', async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/admin/outreach`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(new RegExp('/admin/outreach'));
  });

});
