import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PASSWORD = '9353@Fmos';

async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('you@company.com').fill('admin1@fmos.com');
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(3000);
}

test.describe('Finance Dashboard', () => {

  test('Finance page loads without crashing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/finance`);
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(new RegExp('/admin/finance'));
    await expect(page.locator('body')).toBeVisible();
  });

  test('Revenue metrics are visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/finance`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).toContainText(/revenue|invoice|mrr/i);
  });

  test('Charts render without errors', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/finance`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).not.toContainText(/something went wrong|failed/i);
  });

  test('No NaN or undefined values in financial display', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/finance`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).not.toContainText('NaN');
    await expect(body).not.toContainText('undefined');
  });

});

test.describe('Sales Analytics', () => {

  test('Sales analytics page loads without crashing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/sales`);
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(new RegExp('/admin/sales'));
    await expect(page.locator('body')).toBeVisible();
  });

  test('Sales metrics are visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/sales`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).toContainText(/leads|calls|conversion/i);
  });

  test('No NaN or undefined in sales display', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/sales`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).not.toContainText('NaN');
    await expect(body).not.toContainText('undefined');
  });

  test('Leaderboard renders correctly', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/sales`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).not.toContainText(/something went wrong/i);
  });

});

test.describe('Projects Dashboard', () => {

  test('Projects page loads without crashing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
  });

  test('Projects metrics are visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).toContainText(/project|task|overdue/i);
  });

  test('No NaN or undefined in projects display', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/projects`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).not.toContainText('NaN');
    await expect(body).not.toContainText('undefined');
  });

});
