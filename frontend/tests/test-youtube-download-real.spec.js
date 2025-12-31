/**
 * Test for Real YouTube Video Download
 * Tests that downloading a YouTube video works end-to-end
 */

const { test, expect } = require('@playwright/test');

test.describe('YouTube Download - Real Video', () => {
  test('should successfully download a YouTube video (download-only mode)', async ({ page }) => {
    // Listen to network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/download-video-only') || request.url().includes('/youtube')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        });
        console.log('📤 Request:', request.method(), request.url());
      }
    });
    page.on('response', response => {
      if (response.url().includes('/download-video-only') || response.url().includes('/youtube')) {
        console.log('📥 Response:', response.status(), response.url());
      }
    });

    // Clear localStorage and sessionStorage to prevent loading old tasks
    await page.goto('http://localhost');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('🧹 Cleared browser storage');

    // Reload the page to start fresh
    await page.reload();
    console.log('📱 Navigated to http://localhost');

    // Wait for page to load
    await page.waitForSelector('h1, button', { timeout: 10000 });
    console.log('✅ Page loaded');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test-results/01-initial.png', fullPage: true });

    // Look for "Online Video" tab or YouTube option
    const onlineVideoTab = page.locator('button:has-text("Online Video"), button:has-text("YouTube"), button:has-text("וידאו אונליין")').first();
    await expect(onlineVideoTab).toBeVisible({ timeout: 5000 });
    await onlineVideoTab.click();
    console.log('✅ Clicked Online Video tab');

    await page.screenshot({ path: 'test-results/02-youtube-tab.png', fullPage: true });

    // Wait for YouTube form to be visible
    await page.waitForSelector('input[type="url"], input[placeholder*="YouTube"], input[placeholder*="יוטיוב"]', { timeout: 5000 });
    console.log('✅ YouTube input visible');

    // Enter a real YouTube video URL - "Me at the zoo" (first YouTube video ever)
    const youtubeUrl = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    await page.fill('input[type="url"], input[placeholder*="YouTube"], input[placeholder*="יוטיוב"]', youtubeUrl);
    console.log(`✅ Entered YouTube URL: ${youtubeUrl}`);

    await page.screenshot({ path: 'test-results/03-url-entered.png', fullPage: true });

    // Look for "Download Only" option/button
    const downloadOnlyButton = page.locator('button:has-text("הורד בלבד"), button:has-text("Download Only")').first();

    if (await downloadOnlyButton.isVisible({ timeout: 2000 })) {
      // If there's a separate "Download Only" button, click it
      await downloadOnlyButton.click();
      console.log('✅ Clicked Download Only button');
    } else {
      // Otherwise, just click the main process button
      const processButton = page.locator('button:has-text("Start"), button:has-text("Process"), button:has-text("התחל"), button:has-text("עבד")').first();
      await expect(processButton).toBeVisible({ timeout: 5000 });
      await processButton.click();
      console.log('✅ Clicked Process button');
    }

    await page.screenshot({ path: 'test-results/04-clicked-download.png', fullPage: true });

    // Wait for processing to start - look for progress indicators
    const progressIndicators = page.locator('.progress, .loading, .spinner, [class*="progress"], [class*="loading"]').first();

    // Wait a bit for the request to be sent
    await page.waitForTimeout(2000);
    console.log('⏳ Waiting for processing...');

    await page.screenshot({ path: 'test-results/05-processing.png', fullPage: true });

    // Wait for completion - either success or error
    // Increased timeout to 60 seconds for download
    const maxWaitTime = 60000;
    const startTime = Date.now();

    let downloadSuccess = false;
    let errorOccurred = false;

    while (Date.now() - startTime < maxWaitTime) {
      // Check for success indicators
      const successIndicator = page.locator(
        '.bg-green-50, .text-green-800, button:has-text("Download"), a[href*="/download/"], [class*="success"]'
      ).first();

      if (await successIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        downloadSuccess = true;
        console.log('✅ Download completed successfully!');
        break;
      }

      // Check for error indicators
      const errorIndicator = page.locator(
        '.bg-red-50, .text-red-800, .error-message, [class*="error"]'
      ).first();

      if (await errorIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
        errorOccurred = true;
        const errorText = await errorIndicator.textContent();
        console.log('❌ Error occurred:', errorText);
        await page.screenshot({ path: 'test-results/06-error.png', fullPage: true });
        break;
      }

      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/07-final.png', fullPage: true });

    // Assert results
    if (errorOccurred) {
      const errorText = await page.locator('.bg-red-50, .text-red-800, .error-message, [class*="error"]').first().textContent();

      // Check if it's a bot detection error
      if (errorText.includes('bot') || errorText.includes('בוט') || errorText.includes('Sign in')) {
        test.fail('YouTube bot detection triggered - this is expected sometimes');
        console.log('⚠️ YouTube bot detection - this is a known YouTube issue, not a bug');
      } else {
        // Other errors should fail the test
        throw new Error(`Download failed with error: ${errorText}`);
      }
    } else if (downloadSuccess) {
      console.log('🎉 Test passed - download successful!');

      // Optionally check for download link
      const downloadLink = page.locator('a[href*="/download/"], button:has-text("Download")').first();
      await expect(downloadLink).toBeVisible();

      // Get the video title from the page
      const pageContent = await page.textContent('body');
      console.log('📄 Page content includes:', pageContent.substring(0, 500));

    } else {
      throw new Error('Timeout waiting for download to complete');
    }
  });

  test('should handle invalid YouTube URL gracefully', async ({ page }) => {
    await page.goto('http://localhost');
    await page.waitForSelector('h1, button', { timeout: 10000 });

    // Click Online Video tab
    const onlineVideoTab = page.locator('button:has-text("Online Video"), button:has-text("YouTube"), button:has-text("וידאו אונליין")').first();
    await onlineVideoTab.click();

    // Wait for YouTube form
    await page.waitForSelector('input[type="url"]', { timeout: 5000 });

    // Enter an invalid URL
    await page.fill('input[type="url"]', 'not-a-valid-youtube-url');

    // Try to process
    const processButton = page.locator('button:has-text("Start"), button:has-text("Process"), button:has-text("התחל")').first();
    await processButton.click();

    // Should show validation error or error message
    await page.waitForTimeout(2000);

    // Check for HTML5 validation or error message
    const input = page.locator('input[type="url"]');
    const validationMessage = await input.evaluate(el => el.validationMessage).catch(() => null);

    const errorMessage = page.locator('.error, .text-red-600, [class*="error"]').first();
    const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);

    expect(validationMessage || hasError).toBeTruthy();
    console.log('✅ Invalid URL was rejected as expected');
  });
});
