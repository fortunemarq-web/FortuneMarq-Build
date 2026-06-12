import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PASSWORD = '9353@Fmos';

const users = [
    { email: 'sayedjabeer@fmos.com', role: 'admin', expectedURL: '/admin' },
    { email: 'admin1@fmos.com', role: 'admin', expectedURL: '/admin' },
    { email: 'admin2@fmos.com', role: 'admin', expectedURL: '/admin' },
    { email: 'afifa@fmos.com', role: 'telecaller', expectedURL: '/sales' },
];

test.describe('Authentication Tests', () => {

    test('Login page loads correctly', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await expect(page.getByPlaceholder('you@company.com')).toBeVisible();
        await expect(page.getByPlaceholder('••••••••')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('Cannot login with wrong password', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);
        await page.getByPlaceholder('you@company.com').fill('admin1@fmos.com');
        await page.getByPlaceholder('••••••••').fill('wrongpassword');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL(`${BASE_URL}/login`);
    });

    for (const user of users) {
        test(`${user.email} (${user.role}) can login and lands on correct dashboard`, async ({ page }) => {
            await page.goto(`${BASE_URL}/login`);
            await page.getByPlaceholder('you@company.com').fill(user.email);
            await page.getByPlaceholder('••••••••').fill(PASSWORD);
            await page.getByRole('button', { name: 'Sign In' }).click();
            await page.waitForURL(`**${user.expectedURL}**`, { timeout: 10000 });
            await expect(page).toHaveURL(new RegExp(user.expectedURL));
        });
    }

});
