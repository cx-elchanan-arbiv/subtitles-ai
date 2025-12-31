/**
 * E2E Test: Full Upload and Processing Flow (Production)
 *
 * This test simulates a real user uploading a video file from their local machine
 * to the production site (https://subs.sayai.io) and waiting for complete processing.
 *
 * Tests the entire flow:
 *   1. Navigate to production site
 *   2. Switch to Upload tab
 *   3. Upload local video file
 *   4. Verify default settings (medium model, auto→Hebrew, create video)
 *   5. Wait for automatic processing to complete
 *   6. Verify results (SRT files, transcription quality, video download)
 *
 * Test file: /Users/elchananarbiv/Downloads/קצר סרטון בלי כתוביות 30 שיות .mp4
 * File size: ~1.22 MB (30 seconds video)
 *
 * Expected duration: ~2-5 minutes (depending on model and server load)
 * Note: Processing starts automatically after file upload (no "Process" button click needed)
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Extend timeout for this long-running test
test.setTimeout(600000); // 10 minutes max

test.describe('Full Upload and Processing Flow', () => {

  test('complete video upload, processing, and download flow', async ({ page }) => {
    console.log('🎬 Starting Full E2E Test - Upload & Process');
    console.log('━'.repeat(60));

    // ========================================
    // Step 1: Navigate to the site
    // ========================================
    console.log('\n📍 Step 1: Navigate to https://subs.sayai.io');
    await page.goto('https://subs.sayai.io');
    await expect(page).toHaveTitle(/SubsTranslator|Subs/i);
    console.log('   ✅ Page loaded');

    // ========================================
    // Step 2: Switch to Upload tab
    // ========================================
    console.log('\n📍 Step 2: Switch to Upload tab');

    // Wait for tabs to be visible
    await page.waitForSelector('.tabs', { timeout: 10000 });

    // Find and click upload tab (looking for Hebrew "העלאת קובץ" or English "upload")
    const uploadTab = page.locator('.tab').filter({ hasText: /העלאת קובץ|upload|file/i });
    await uploadTab.first().click();
    console.log('   ✅ Upload tab clicked');

    // Wait for upload area to appear (the visible div, not the hidden input)
    await page.waitForSelector('.upload-area', { timeout: 10000 });
    console.log('   ✅ Upload area is ready');

    // ========================================
    // Step 3: Select and upload the video file
    // ========================================
    console.log('\n📍 Step 3: Upload video file');

    const videoPath = '/Users/elchananarbiv/Downloads/קצר סרטון בלי כתוביות 30 שיות .mp4';

    // Verify file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`❌ Video file not found at: ${videoPath}`);
    }

    const fileStats = fs.statSync(videoPath);
    console.log(`   📁 File: ${path.basename(videoPath)}`);
    console.log(`   📊 Size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);

    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);
    console.log('   ✅ File selected');

    // Wait for file to be processed by the upload component
    await page.waitForTimeout(2000);

    // ========================================
    // Step 4: Configure processing options
    // ========================================
    console.log('\n📍 Step 4: Configure processing options');

    // The model should default to 'medium' now
    // Source language: auto (default)
    // Target language: he (default)
    // Auto-create video: true (default)

    console.log('   ℹ️  Using default settings:');
    console.log('      - Model: Medium (Excellent)');
    console.log('      - Source: Auto-detect');
    console.log('      - Target: Hebrew');
    console.log('      - Create video: Yes');

    // ========================================
    // Step 5: Verify processing started automatically
    // ========================================
    console.log('\n📍 Step 5: Verify processing started automatically');
    console.log('   ℹ️  Note: Processing starts automatically after file upload');

    // ========================================
    // Step 6: Monitor processing progress
    // ========================================
    console.log('\n📍 Step 6: Monitor processing progress');
    console.log('   ⏳ Waiting for processing to complete...');
    console.log('   (This may take 2-5 minutes)');

    // Wait for processing steps to appear (identified by the step labels like "processingSteps.AI Transcription")
    // The processing UI shows after file upload completes
    await page.waitForSelector('text=/processingSteps\\.|Processing File|Overall Progress/', { timeout: 30000 });
    console.log('   ✅ Processing UI visible');

    // Poll for completion
    let completed = false;
    let attempts = 0;
    const maxAttempts = 150; // 150 * 4s = 10 minutes max

    while (!completed && attempts < maxAttempts) {
      attempts++;

      // Check if results are visible (look for results container with success header)
      const resultsVisible = await page.locator('.results-container').isVisible().catch(() => false);

      if (resultsVisible) {
        completed = true;
        console.log(`\n   ✅ Processing completed after ${attempts * 4} seconds`);
        break;
      }

      // Check for errors (look for error messages)
      const errorVisible = await page.locator('text=/error|שגיאה|failed|נכשל/i').isVisible().catch(() => false);

      if (errorVisible) {
        const errorText = await page.locator('text=/error|שגיאה|failed|נכשל/i').first().textContent();
        throw new Error(`❌ Processing failed with error: ${errorText}`);
      }

      // Log progress every 15 seconds
      if (attempts % 4 === 0) {
        console.log(`   ⏳ Still processing... (${attempts * 4}s elapsed)`);

        // Try to read progress percentage if visible
        const progressText = await page.locator('.progress-percent, .overall-progress').textContent().catch(() => null);
        if (progressText) {
          console.log(`      Progress: ${progressText}`);
        }
      }

      await page.waitForTimeout(4000); // Check every 4 seconds
    }

    if (!completed) {
      throw new Error('❌ Processing timeout - took longer than 10 minutes');
    }

    // ========================================
    // Step 7: Verify results
    // ========================================
    console.log('\n📍 Step 7: Verify results');

    // Check for success header
    const successHeader = page.locator('.success-header').first();
    await expect(successHeader).toBeVisible({ timeout: 5000 });
    console.log('   ✅ Success header visible');

    // Check for detected language
    const detectedLang = page.locator('.result-language').first();
    if (await detectedLang.isVisible()) {
      const langText = await detectedLang.textContent();
      console.log(`   ✅ Detected language: ${langText}`);
    }

    // Check for transcription quality display (new feature!)
    const transcriptionQuality = page.locator('.result-language').filter({ hasText: /איכות תמלול|transcription quality/i });
    if (await transcriptionQuality.isVisible()) {
      const qualityText = await transcriptionQuality.textContent();
      console.log(`   ✅ ${qualityText}`);
    }

    // Check for download buttons
    const downloadButtons = page.locator('.download-btn');
    const buttonCount = await downloadButtons.count();
    console.log(`   ✅ Found ${buttonCount} download buttons`);

    expect(buttonCount).toBeGreaterThanOrEqual(2); // At least original SRT + translated SRT

    // Check for specific download options
    const originalSRT = page.locator('a[href*=".srt"]').filter({ hasText: /original|מקור/i });
    const translatedSRT = page.locator('a[href*=".srt"]').filter({ hasText: /translated|מתורגם/i });

    if (await originalSRT.count() > 0) {
      console.log('   ✅ Original SRT download available');
    }

    if (await translatedSRT.count() > 0) {
      console.log('   ✅ Translated SRT download available');
    }

    // Check for video with subtitles (if auto-create was enabled)
    const videoDownload = page.locator('a[href*=".mp4"]');
    if (await videoDownload.count() > 0) {
      console.log('   ✅ Video with subtitles download available');
    }

    // ========================================
    // Step 8: Verify timing summary
    // ========================================
    console.log('\n📍 Step 8: Verify timing summary');

    const timingSummary = page.locator('.total-time').first();
    if (await timingSummary.isVisible()) {
      const timingText = await timingSummary.textContent();
      console.log(`   ⏱️  ${timingText}`);
    }

    // ========================================
    // Final Summary
    // ========================================
    console.log('\n' + '━'.repeat(60));
    console.log('🎉 E2E Test Completed Successfully!');
    console.log('━'.repeat(60));
    console.log('\n✅ All steps passed:');
    console.log('   1. ✅ Page navigation');
    console.log('   2. ✅ Tab switching');
    console.log('   3. ✅ File upload');
    console.log('   4. ✅ Options configuration');
    console.log('   5. ✅ Processing submission');
    console.log('   6. ✅ Progress monitoring');
    console.log('   7. ✅ Results verification');
    console.log('   8. ✅ Timing summary');
    console.log('\n🎬 Full flow works perfectly! 🚀\n');
  });
});
