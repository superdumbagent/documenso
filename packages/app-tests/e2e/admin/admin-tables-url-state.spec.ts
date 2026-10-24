import { seedUser } from '@documenso/prisma/seed/users';
import { expect, test } from '@playwright/test';

import { apiSignin } from '../fixtures/authentication';

test.describe.configure({ mode: 'parallel' });

// The tables debounce the search input by 1s before writing it to the URL.
const SEARCH_DEBOUNCE_MS = 1500;

test('[ADMIN][USERS_TABLE]: keeps page and search from the URL on load', async ({ page }) => {
  const { user: adminUser } = await seedUser({ isAdmin: true });

  await apiSignin({
    page,
    email: adminUser.email,
    redirectPath: '/admin/users?page=2&perPage=1',
  });

  await expect(page.getByRole('heading', { name: 'Manage users' })).toBeVisible();
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS);

  expect(new URL(page.url()).searchParams.get('page')).toBe('2');

  await page.goto(`/admin/users?search=${encodeURIComponent(adminUser.email)}`);

  await expect(page.getByPlaceholder('Search by name or email')).toHaveValue(adminUser.email);
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS);

  expect(new URL(page.url()).searchParams.get('search')).toBe(adminUser.email);
  await expect(page.getByRole('cell', { name: adminUser.email })).toBeVisible();
});

test('[ADMIN][ORGANISATION_INSIGHTS]: keeps search from the URL on load and when sorting', async ({ page }) => {
  const { user: adminUser } = await seedUser({ isAdmin: true });

  await apiSignin({
    page,
    email: adminUser.email,
    redirectPath: '/admin/organisation-insights?search=acme',
  });

  const searchInput = page.getByPlaceholder('Search by organisation name');

  await expect(searchInput).toHaveValue('acme');
  await page.waitForTimeout(SEARCH_DEBOUNCE_MS);

  expect(new URL(page.url()).searchParams.get('search')).toBe('acme');

  await searchInput.fill('globex');
  await expect.poll(() => new URL(page.url()).searchParams.get('search')).toBe('globex');

  await page.getByRole('columnheader', { name: 'Name' }).getByText('Name').click();

  await expect.poll(() => new URL(page.url()).searchParams.get('sortBy')).toBe('name');
  expect(new URL(page.url()).searchParams.get('search')).toBe('globex');
});
