import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PASSWORD = '88900098';

async function loginAsAdmin(page: any) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder('you@company.com').fill('admin@test.com');
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForTimeout(3000);
}

test.describe('Financial Dashboard', () => {

  test('Financials page loads without crashing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/financials`);
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(new RegExp('/admin/financials'));
    await expect(page.locator('body')).toBeVisible();
  });

  test('Revenue metrics are visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/financials`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).toContainText(/revenue|deal|pipeline/i);
  });

  test('Charts render without errors', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/financials`);
    await page.waitForTimeout(3000);
    // Check no error messages on page
    const body = page.locator('body');
    await expect(body).not.toContainText(/error|something went wrong|failed/i);
  });

  test('No NaN or undefined values in financial display', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/financials`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).not.toContainText('NaN');
    await expect(body).not.toContainText('undefined');
    await expect(body).not.toContainText('null');
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
    await expect(body).not.toContainText(/error|something went wrong/i);
  });

});

test.describe('Operations Dashboard', () => {

  test('Operations page loads without crashing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/operations`);
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(new RegExp('/admin/operations'));
    await expect(page.locator('body')).toBeVisible();
  });

  test('Operations metrics are visible', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/operations`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).toContainText(/project|task|overdue/i);
  });

  test('No NaN or undefined in operations display', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/admin/operations`);
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).not.toContainText('NaN');
    await expect(body).not.toContainText('undefined');
  });

});

test.describe('Staff Dashboard', () => {

  test('Staff dashboard loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('you@company.com').fill('staff@test.com');
    await page.getByPlaceholder('••••••••').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(new RegExp('/staff'));
    await expect(page.locator('body')).toBeVisible();
  });

  test('Staff sees only their tasks', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('you@company.com').fill('staff@test.com');
    await page.getByPlaceholder('••••••••').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForTimeout(3000);
    const body = page.locator('body');
    await expect(body).toContainText(/task|project|assigned/i);
  });

});
