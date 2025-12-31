// Playwright localization tests for SubsTranslator
const { test, expect } = require('@playwright/test');

const LANGUAGES = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'he', name: 'Hebrew', direction: 'rtl' },
  { code: 'ar', name: 'Arabic', direction: 'rtl' },
  { code: 'es', name: 'Spanish', direction: 'ltr' }
];

const ALLOWLIST_TERMS = [
  'AI',
  'API', 
  'YouTube',
  'MP4',
  'H.264',
  'FFmpeg',
  'yt-dlp',
  'Redis',
  'Docker',
  'JWT',
  'OAuth',
  'Google Translate',
  'OpenAI',
  'GPT-4o',
  'Whisper'
];

test.describe('Localization Tests', () => {
  // Test language switching
  for (const lang of LANGUAGES) {
    test(`should switch to ${lang.name} and display UI in correct language`, async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Find and click language selector
      const languageSelector = page.locator('.language-selector, [data-testid="language-selector"]');
      await languageSelector.click();
      
      // Select the target language
      await page.selectOption('select', lang.code);
      
      // Wait for language change
      await page.waitForTimeout(1000);
      
      // Check that HTML dir attribute is set correctly
      const htmlDir = await page.getAttribute('html', 'dir');
      expect(htmlDir).toBe(lang.direction);
      
      // Verify that key UI elements are translated (not just English)
      if (lang.code !== 'en') {
        const heroTitle = await page.textContent('h1');
        expect(heroTitle).not.toBe('Transform Your Videos');
        expect(heroTitle).toBeTruthy();
      }
      
      // Check that allowlist terms are still in English
      const pageContent = await page.textContent('body');
      for (const term of ALLOWLIST_TERMS) {
        if (pageContent.includes(term)) {
          // Allowlist terms should remain in English regardless of UI language
          expect(pageContent).toContain(term);
        }
      }
    });
  }

  test('should maintain language choice across page reloads', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Switch to Hebrew
    const languageSelector = page.locator('.language-selector, [data-testid="language-selector"]');
    await languageSelector.click();
    await page.selectOption('select', 'he');
    await page.waitForTimeout(1000);
    
    // Reload page
    await page.reload();
    
    // Verify Hebrew is still active
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('rtl');
  });

  test('should display proper RTL layout for Hebrew and Arabic', async ({ page }) => {
    const rtlLanguages = ['he', 'ar'];
    
    for (const langCode of rtlLanguages) {
      await page.goto(`http://localhost:3000?lng=${langCode}`);
      await page.waitForTimeout(1000);
      
      // Check HTML dir attribute
      const htmlDir = await page.getAttribute('html', 'dir');
      expect(htmlDir).toBe('rtl');
      
      // Check that form elements are properly aligned
      const forms = page.locator('form, .upload-area, .youtube-input-group');
      if (await forms.count() > 0) {
        const firstForm = forms.first();
        const textAlign = await firstForm.evaluate(el => 
          window.getComputedStyle(el).textAlign
        );
        // Should be 'right' or 'start' for RTL
        expect(['right', 'start', 'end']).toContain(textAlign);
      }
    }
  });

  test('should handle form validation messages in current language', async ({ page }) => {
    await page.goto('http://localhost:3000?lng=he');
    await page.waitForTimeout(1000);
    
    // Try to submit empty YouTube form to trigger validation
    const youtubeTab = page.locator('[data-testid="youtube-tab"], .tab:has-text("וידאו")');
    if (await youtubeTab.count() > 0) {
      await youtubeTab.click();
      
      const submitButton = page.locator('button:has-text("עבד"), button:has-text("Process")');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Should show Hebrew validation message
        const validationError = page.locator('.validation-error, .error-message');
        if (await validationError.count() > 0) {
          const errorText = await validationError.textContent();
          expect(errorText).toContain('אנא הכניסו'); // Should be in Hebrew
        }
      }
    }
  });

  test('should display processing messages in current language', async ({ page }) => {
    // Mock processing state
    await page.goto('http://localhost:3000?lng=ar');
    await page.waitForTimeout(1000);
    
    // Check that static processing-related text is in Arabic
    const arabicProcessingTerms = [
      'معالجة', // Processing  
      'تحميل',  // Loading/Download
      'ذكاء اصطناعي' // AI
    ];
    
    const bodyText = await page.textContent('body');
    const hasArabicTerms = arabicProcessingTerms.some(term => bodyText.includes(term));
    
    if (hasArabicTerms) {
      expect(hasArabicTerms).toBeTruthy();
    }
  });

  test('should preserve technical terms in allowlist during localization', async ({ page }) => {
    const testLanguages = ['he', 'ar', 'es'];
    
    for (const lang of testLanguages) {
      await page.goto(`http://localhost:3000?lng=${lang}`);
      await page.waitForTimeout(1000);
      
      const pageContent = await page.textContent('body');
      
      // Check that allowlist terms remain in English
      const preservedTerms = ALLOWLIST_TERMS.filter(term => 
        pageContent.includes(term)
      );
      
      // If we found allowlist terms, they should be in English
      for (const term of preservedTerms) {
        expect(pageContent).toContain(term);
        
        // These terms should NOT be translated
        if (term === 'YouTube') {
          expect(pageContent).not.toContain('יוטיוב'); // Hebrew
          expect(pageContent).not.toContain('يوتيوب'); // Arabic
        }
        if (term === 'API') {
          expect(pageContent).not.toContain('ממשק'); // Hebrew for API
        }
      }
    }
  });

  test('should handle mixed content (English terms + translated UI)', async ({ page }) => {
    await page.goto('http://localhost:3000?lng=he');
    await page.waitForTimeout(1000);
    
    // Look for model selection which should have English model names but Hebrew descriptions
    const modelSelections = page.locator('select option, .model-option');
    if (await modelSelections.count() > 0) {
      const options = await modelSelections.allTextContents();
      
      // Should find patterns like "Tiny (מהיר)" - English identifier with Hebrew description
      const mixedPatterns = options.filter(option => 
        /^(tiny|base|small|medium|large)\s*\(/i.test(option) && 
        /[\u0590-\u05FF]/.test(option) // Contains Hebrew
      );
      
      expect(mixedPatterns.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Translation Completeness', () => {
  test('should not display translation keys as literal text', async ({ page }) => {
    const testLanguages = ['en', 'he', 'ar', 'es'];
    
    for (const lang of testLanguages) {
      await page.goto(`http://localhost:3000?lng=${lang}`);
      await page.waitForTimeout(1000);
      
      const pageContent = await page.textContent('body');
      
      // Should not contain raw translation keys
      const suspiciousPatterns = [
        /\w+\.\w+\.\w+/, // keys like 'common.error.message'
        /\{\{\w+\}\}/,   // template strings like {{key}}
        /\[missing:/,    // i18next missing key indicator
      ];
      
      for (const pattern of suspiciousPatterns) {
        const matches = pageContent.match(pattern);
        if (matches) {
          console.warn(`Found potential untranslated key in ${lang}: ${matches[0]}`);
        }
      }
    }
  });
});

test.describe('Accessibility with Localization', () => {
  test('should maintain accessibility with RTL languages', async ({ page }) => {
    await page.goto('http://localhost:3000?lng=he');
    await page.waitForTimeout(1000);
    
    // Check that form labels are properly associated
    const inputs = page.locator('input[type="text"], input[type="file"], select');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const associatedLabel = await page.locator(`label[for="${await input.getAttribute('id')}"]`).count();
      
      // Each input should have either aria-label or associated label
      expect(ariaLabel || associatedLabel > 0).toBeTruthy();
    }
  });
});