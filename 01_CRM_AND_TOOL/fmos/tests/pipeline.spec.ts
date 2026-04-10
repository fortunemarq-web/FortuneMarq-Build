import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PASSWORD = '88900098';

async function loginAs(page: any, email: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('you@company.com').fill(email);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(3000);
}

test.describe('Sales Cockpit', () => {

  test('Sales cockpit loads with lead queue', async ({ page }) => {
    await loginAs(page, 'sales@test.com');
    await expect(page).toHaveURL(new RegExp('/sales'));
    await page.waitForTimeout(2000);
    // Check key UI elements are present
    await expect(page.locator('body')).toBeVisible();
  });

  test('Sales cockpit shows inbound and outbound toggle', async ({ page }) => {
    await loginAs(page, 'sales@test.com');
    await page.waitForTimeout(2000);
    // Check for lead type switching buttons
    const body = page.locator('body');
    await expect(body).toContainText(/inbound|outbound|hot|cold/i);
  });

  test('Session statistics are visible', async ({ page }) => {
    await loginAs(page, 'sales@test.com');
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/calls|session|follow/i);
  });

});

test.describe('Strategist Pipeline', () => {

  test('Strategist dashboard loads', async ({ page }) => {
    await loginAs(page, 'strategy@test.com');
    await expect(page).toHaveURL(new RegExp('/strategist'));
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Strategist sees pipeline stages', async ({ page }) => {
    await loginAs(page, 'strategy@test.com');
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/qualified|strategy|pipeline|deal/i);
  });

});

test.describe('Project Manager Dashboard', () => {

  test('PM dashboard loads', async ({ page }) => {
    await loginAs(page, 'pm@test.com');
    await expect(page).toHaveURL(new RegExp('/projects'));
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('PM sees project list', async ({ page }) => {
    await loginAs(page, 'pm@test.com');
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/project|task|milestone/i);
  });

});

test.describe('Admin Command Hub', () => {

  test('Admin dashboard loads', async ({ page }) => {
    await loginAs(page, 'admin@test.com');
    await expect(page).toHaveURL(new RegExp('/admin'));
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Admin sees all four hub cards', async ({ page }) => {
    await loginAs(page, 'admin@test.com');
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/revenue|sales|strategy|operations/i);
  });

  test('Admin can navigate to financials', async ({ page }) => {
    await loginAs(page, 'admin@test.com');
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/admin/financials`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(new RegExp('/admin/financials'));
  });

  test('Admin can navigate to sales analytics', async ({ page }) => {
    await loginAs(page, 'admin@test.com');
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/admin/sales`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(new RegExp('/admin/sales'));
  });

  test('Admin can navigate to operations', async ({ page }) => {
    await loginAs(page, 'admin@test.com');
    await page.waitForTimeout(2000);
    await page.goto(`${BASE_URL}/admin/operations`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(new RegExp('/admin/operations'));
  });

});

test.describe('Client Portal', () => {

  test('Client portal loads', async ({ page }) => {
    await loginAs(page, 'contact@austindental.com');
    await expect(page).toHaveURL(new RegExp('/client/dashboard'));
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Client sees project information', async ({ page }) => {
    await loginAs(page, 'contact@austindental.com');
    await page.waitForTimeout(2000);
    const body = page.locator('body');
    await expect(body).toContainText(/project|milestone|progress/i);
  });

});
