import { test, expect } from '@playwright/test';

// Read-only UI smoke test against a running Headlamp with visible Tanzu Pods.
// Set HEADLAMP_URL and HEADLAMP_CLUSTER to target a different local instance.
const base = process.env.HEADLAMP_URL || 'http://127.0.0.1:4466';
const cluster = process.env.HEADLAMP_CLUSTER || 'tnz-9cbba8455f-admin@tnz-9cbba8455f';
const explorer = `${base}/c/${cluster}/tanzu-apps`;

test('browse orgs, spaces, apps, and native Pod details with working history', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(explorer);
  await expect(page.getByRole('link', { name: 'Tanzu Apps', exact: true }).first()).toBeVisible();
  const main = page.getByRole('main');
  await expect(main.getByRole('columnheader', { name: /^Organization(?: |$)/ })).toBeVisible();
  await main.locator('a[href*="?org="]').first().click();
  await expect(main.getByRole('columnheader', { name: /^Space(?: |$)/ })).toBeVisible();
  const orgURL = page.url();
  await main.locator('a[href*="space="]').first().click();
  await expect(main.getByRole('columnheader', { name: /^Application Sort/ })).toBeVisible();
  await main.locator('a[href*="app="]').first().click();
  const appURL = page.url();
  await expect(main.getByRole('columnheader', { name: /^Pod(?: |$)/ })).toBeVisible();
  await expect(main.getByRole('columnheader', { name: /^Restarts(?: |$)/ })).toBeVisible();
  await page.reload();
  await expect(main.getByRole('columnheader', { name: /^Pod(?: |$)/ })).toBeVisible();
  const pod = main.locator('a[href*="/pods/"]').first();
  const podName = await pod.innerText();
  await pod.click();
  await expect(page.getByText('Tanzu Application', { exact: true })).toBeVisible();
  const drawer = page.getByRole('complementary', { name: `Pod ${podName}`, exact: true });
  if (await drawer.isVisible()) {
    await expect(drawer.getByRole('button', { name: 'Show Logs', exact: true })).toBeVisible();
    await drawer.getByRole('button', { name: 'Close', exact: true }).click();
  } else {
    await expect(page).toHaveURL(/\/pods\//);
    await page.goBack();
  }
  await expect(page).toHaveURL(appURL);
  await expect(main.getByRole('columnheader', { name: /^Pod(?: |$)/ })).toBeVisible();
  await page.goBack();
  await expect(main.getByRole('columnheader', { name: /^Application Sort/ })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(appURL);
  await main.locator('nav[aria-label="Tanzu navigation"] a').nth(1).click();
  await expect(page).toHaveURL(orgURL);
  await expect(main.getByRole('columnheader', { name: /^Space(?: |$)/ })).toBeVisible();
  await expect(page.getByText('Something went wrong with cluster', { exact: false })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a stale app selection explains the missing runtime data', async ({ page }) => {
  await page.goto(`${explorer}?org=missing-org`);
  await expect(page.getByText('This selection has no visible runtime Pods.', { exact: false })).toBeVisible();
});
