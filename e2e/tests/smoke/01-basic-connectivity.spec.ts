/**
 * Smoke Test: Basic Connectivity
 *
 * Verifies that both frontend and backend are accessible and responding.
 * This is the simplest, fastest test and should always pass first.
 *
 * Expected duration: ~10-20 seconds
 */

import { test, expect } from '@playwright/test';

test.describe('Basic Connectivity', () => {

  test('backend root endpoint responds correctly', async ({ request }) => {
    console.log('🔍 Testing backend root endpoint...');

    const apiUrl = process.env.API_BASE_URL || 'https://api.subs.sayai.io';
    console.log(`   API URL: ${apiUrl}`);

    const response = await request.get(`${apiUrl}/`);

    console.log(`   Status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`   Response:`, data);

    // Verify response structure matches actual backend
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(true);
    expect(data).toHaveProperty('service');
    expect(data.service).toContain('SubsTranslator');

    console.log('   ✅ Backend root endpoint OK');
  });

  test('backend health endpoint responds correctly', async ({ request }) => {
    console.log('🔍 Testing backend health endpoint...');

    const apiUrl = process.env.API_BASE_URL || 'https://api.subs.sayai.io';
    const response = await request.get(`${apiUrl}/health`);

    console.log(`   Status: ${response.status()}`);
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log(`   Health data:`, data);

    // Verify response structure matches actual backend
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('ffmpeg_installed');

    console.log('   ✅ Backend health endpoint OK');
  });

  test('frontend application loads successfully', async ({ page }) => {
    console.log('🔍 Testing frontend loads...');

    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/SubsTranslator|Subs/i);

    // Check main heading is visible (h1 or h2)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });

    const headingText = await heading.textContent();
    console.log(`   ✅ Frontend loaded with heading: "${headingText}"`);
  });

  test('main tabs are visible (using class selectors)', async ({ page }) => {
    console.log('🔍 Testing main tabs visibility...');

    await page.goto('/');

    // Wait for tabs container
    const tabsContainer = page.locator('.tabs');
    await expect(tabsContainer).toBeVisible({ timeout: 10000 });

    // Check individual tabs by class (no data-testid in actual code!)
    const tabs = page.locator('.tab');
    const tabCount = await tabs.count();
    console.log(`   Found ${tabCount} tabs`);
    expect(tabCount).toBeGreaterThanOrEqual(2);

    // Check first tab is visible
    await expect(tabs.first()).toBeVisible();

    console.log('   ✅ Tabs are visible');
  });

  test('can identify tabs by their content', async ({ page }) => {
    console.log('🔍 Testing tab identification by content...');

    await page.goto('/');

    // The actual code shows tabs with emojis and text
    // Example: "📁 {t.uploadTab}" and "📺 {t.youtubeTab}"

    // Try to find upload tab (might be in Hebrew or English)
    const uploadTab = page.locator('.tab').filter({ hasText: /upload|העלאה|📁/ });
    const youtubeTab = page.locator('.tab').filter({ hasText: /youtube|יוטיוב|📺/ });

    // At least one should be visible
    const uploadVisible = await uploadTab.count() > 0;
    const youtubeVisible = await youtubeTab.count() > 0;

    console.log(`   Upload tab found: ${uploadVisible}`);
    console.log(`   YouTube tab found: ${youtubeVisible}`);

    expect(uploadVisible || youtubeVisible).toBeTruthy();

    console.log('   ✅ Tabs can be identified by content');
  });
});
