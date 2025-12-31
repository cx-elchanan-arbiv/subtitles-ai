/**
 * Test for Private Video Error Display
 * Tests that error messages are properly displayed in the UI
 */

const { test, expect } = require('@playwright/test');

test.describe('Private Video Error Handling', () => {
  test('should display error message for private YouTube video', async ({ page }) => {
    // Go to the app
    await page.goto('http://localhost');
    
    // Wait for page to load - looking for any heading or button
    await page.waitForSelector('h1, button', { timeout: 10000 });
    
    // Switch to YouTube tab
    await page.click('button:has-text("YouTube")');
    
    // Wait for YouTube form to be visible
    await page.waitForSelector('input[type="url"]', { timeout: 5000 });
    
    // Enter a private video URL
    await page.fill('input[type="url"]', 'https://www.youtube.com/watch?v=ZLPCAeIXTrg');
    
    // Click process button
    await page.click('button:has-text("Process with Subtitles")');
    
    // Wait for processing state
    await page.waitForSelector('.main-content', { timeout: 5000 });
    
    // Wait for error to appear - should show error message, not return to home
    const errorLocator = page.locator('.bg-red-50, .text-red-800, .text-red-600, [class*="error"]').first();
    
    // Wait for the error to be visible
    await expect(errorLocator).toBeVisible({ timeout: 30000 });
    
    // Get the error text
    const errorText = await errorLocator.textContent();
    console.log('Error text found:', errorText);
    
    // Verify error content contains expected message
    expect(errorText).toMatch(/error|failed|נכשל|שגיאה|private|פרטי/i);
    
    // Ensure we're not back at the main form
    const uploadForm = page.locator('button:has-text("YouTube")');
    await expect(uploadForm).not.toBeVisible();
    
    // Check for retry button
    const retryButton = page.locator('button:has-text("נסה שוב"), button:has-text("Try Again"), button:has-text("Retry")');
    await expect(retryButton).toBeVisible();
  });

  test('should display error for invalid YouTube URL', async ({ page }) => {
    await page.goto('http://localhost');
    await page.waitForSelector('h1, button', { timeout: 10000 });
    
    // Switch to YouTube tab
    await page.click('button:has-text("YouTube")');
    
    // Wait for YouTube form
    await page.waitForSelector('input[type="url"]', { timeout: 5000 });
    
    // Enter an invalid URL
    await page.fill('input[type="url"]', 'not-a-valid-url');
    
    // Try to click process - should show validation error
    await page.click('button:has-text("Process with Subtitles")');
    
    // Check for HTML5 validation message or custom error
    const input = page.locator('input[type="url"]');
    const validationMessage = await input.evaluate(el => el.validationMessage);
    
    expect(validationMessage).toBeTruthy();
  });
});