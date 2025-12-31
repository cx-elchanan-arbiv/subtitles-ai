/**
 * E2E Tests for Watermark Preferences
 * Tests user preference persistence and collapsible UI
 */

const { test, expect } = require('@playwright/test');

test.describe('Watermark Preferences', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:3000');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should remember watermark preferences across page reloads', async ({ page }) => {
    // Enable watermark and set preferences
    await page.check('input[type="checkbox"]'); // Enable watermark
    
    // Wait for options to appear
    await page.waitForSelector('.watermark-options', { state: 'visible' });
    
    // Set position to top-left
    await page.click('[data-testid="position-top-left"]');
    
    // Set size to large
    await page.click('[data-testid="size-large"]');
    
    // Reload page
    await page.reload();
    
    // Check that preferences are restored
    await expect(page.locator('input[type="checkbox"]')).toBeChecked();
    await expect(page.locator('[data-testid="position-top-left"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="size-large"]')).toBeChecked();
  });

  test('should collapse and expand watermark settings', async ({ page }) => {
    // Enable watermark
    await page.check('input[type="checkbox"]');
    
    // Wait for options to appear
    await page.waitForSelector('.watermark-options', { state: 'visible' });
    
    // Find and click collapse button
    const collapseButton = page.locator('.collapse-toggle');
    await expect(collapseButton).toBeVisible();
    await collapseButton.click();
    
    // Check that options are hidden
    await expect(page.locator('.watermark-options')).not.toBeVisible();
    
    // Check that button shows expand icon
    await expect(collapseButton).toHaveClass(/collapsed/);
    
    // Click to expand again
    await collapseButton.click();
    
    // Check that options are visible again
    await page.waitForSelector('.watermark-options', { state: 'visible' });
    await expect(collapseButton).toHaveClass(/expanded/);
  });

  test('should auto-expand when enabling watermark', async ({ page }) => {
    // Initially disabled
    await expect(page.locator('input[type="checkbox"]')).not.toBeChecked();
    await expect(page.locator('.watermark-options')).not.toBeVisible();
    
    // Enable watermark
    await page.check('input[type="checkbox"]');
    
    // Should auto-expand
    await page.waitForSelector('.watermark-options', { state: 'visible' });
    
    // Collapse button should be in expanded state
    const collapseButton = page.locator('.collapse-toggle');
    await expect(collapseButton).toHaveClass(/expanded/);
  });

  test('should auto-collapse when disabling watermark', async ({ page }) => {
    // Enable watermark first
    await page.check('input[type="checkbox"]');
    await page.waitForSelector('.watermark-options', { state: 'visible' });
    
    // Disable watermark
    await page.uncheck('input[type="checkbox"]');
    
    // Options should be hidden
    await expect(page.locator('.watermark-options')).not.toBeVisible();
    
    // Collapse button should not be visible when disabled
    await expect(page.locator('.collapse-toggle')).not.toBeVisible();
  });

  test('should remember collapse state across page reloads', async ({ page }) => {
    // Enable watermark
    await page.check('input[type="checkbox"]');
    await page.waitForSelector('.watermark-options', { state: 'visible' });
    
    // Collapse the settings
    await page.locator('.collapse-toggle').click();
    await expect(page.locator('.watermark-options')).not.toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Should still be collapsed
    await expect(page.locator('input[type="checkbox"]')).toBeChecked();
    await expect(page.locator('.watermark-options')).not.toBeVisible();
    await expect(page.locator('.collapse-toggle')).toHaveClass(/collapsed/);
  });

  test('should persist custom logo across page reloads', async ({ page }) => {
    // Enable watermark
    await page.check('input[type="checkbox"]');
    await page.waitForSelector('.watermark-options', { state: 'visible' });
    
    // Create a test image file
    const testImagePath = require('path').join(__dirname, '../assets/test-logo.png');
    
    // Upload logo (if file input exists)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(testImagePath);
      
      // Wait for image to be processed
      await page.waitForSelector('.watermark-preview img', { state: 'visible' });
      
      // Reload page
      await page.reload();
      
      // Check that logo is still there
      await expect(page.locator('input[type="checkbox"]')).toBeChecked();
      await expect(page.locator('.watermark-preview img')).toBeVisible();
    }
  });

  test('should clear preferences when reset', async ({ page }) => {
    // Set some preferences
    await page.check('input[type="checkbox"]');
    await page.waitForSelector('.watermark-options', { state: 'visible' });
    await page.click('[data-testid="position-top-right"]');
    
    // Clear localStorage (simulating reset)
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    
    // Should be back to defaults
    await expect(page.locator('input[type="checkbox"]')).not.toBeChecked();
    await expect(page.locator('.watermark-options')).not.toBeVisible();
  });

  test('should handle localStorage errors gracefully', async ({ page }) => {
    // Mock localStorage to throw errors
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('Storage quota exceeded');
      };
    });
    
    // Should still work without throwing errors
    await page.check('input[type="checkbox"]');
    await page.waitForSelector('.watermark-options', { state: 'visible' });
    
    // Change settings (should not crash)
    await page.click('[data-testid="position-bottom-left"]');
    
    // UI should still be responsive
    await expect(page.locator('[data-testid="position-bottom-left"]')).toHaveClass(/active/);
  });
});
