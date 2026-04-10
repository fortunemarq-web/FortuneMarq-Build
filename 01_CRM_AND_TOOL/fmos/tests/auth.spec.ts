import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const PASSWORD = '88900098';

const users = [
    { email: 'admin@test.com', role: 'admin', expectedURL: '/admin' },
    { email: 'sales@test.com', role: 'sales', expectedURL: '/sales' },
    { email: 'strategy@test.com', role: 'strategist', expectedURL: '/strategist' },
    { email: 'pm@test.com', role: 'pm', expectedURL: '/projects' },
    { email: 'staff@test.com', role: 'staff', expectedURL: '/staff' },
    { email: 'contact@austindental.com', role: 'client', expectedURL: '/client/dashboard' },
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
        await page.getByPlaceholder('you@company.com').fill('admin@test.com');
        await page.getByPlaceholder('••••••••').fill('wrongpassword');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL(`${BASE_URL}/login`);
    });

    for (const user of users) {
        test(`${user.role} can login and lands on correct dashboard`, async ({ page }) => {
            await page.goto(`${BASE_URL}/login`);
            await page.getByPlaceholder('you@company.com').fill(user.email);
            await page.getByPlaceholder('••••••••').fill(PASSWORD);
            await page.getByRole('button', { name: 'Sign In' }).click();
            await page.waitForURL(`**${user.expectedURL}**`, { timeout: 10000 });
            await expect(page).toHaveURL(new RegExp(user.expectedURL));
        });
    }

});