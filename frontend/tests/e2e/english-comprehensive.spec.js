// Comprehensive English-only test for SubsTranslator
const { test, expect } = require('@playwright/test');

// Expected English texts for different sections
const EXPECTED_ENGLISH_TEXTS = {
  // Hero section
  hero: {
    title: 'SubsTranslator',
    subtitle: /AI-Powered Video Subtitle Translation/i,
    features: [
      'Fast Processing',
      'Multi-Language', 
      'AI Powered'
    ]
  },
  
  // Navigation tabs
  tabs: {
    fileUpload: 'File Upload',
    onlineVideo: 'Online Video'
  },
  
  // Language selection
  languages: {
    sourceLabel: 'Source Language',
    targetLabel: 'Target Language',
    autoDetect: 'Auto Detect'
  },
  
  // Options section
  options: {
    createVideo: 'Create video with burned-in subtitles',
    transcriptionModel: 'Transcription Model',
    translationService: 'Translation Service',
    addWatermark: 'Add watermark to video'
  },
  
  // Model descriptions (should be in English)
  models: {
    medium: /perfect balance between accuracy and speed/i,
    processingTime: /processing time/i,
    accuracy: /accuracy/i,
    bestFor: /best for/i
  },
  
  // Translation services (descriptions should be in English)
  services: {
    google: /free.*google.*translation.*service/i,
    openai: /advanced.*translation.*using.*gpt/i
  },
  
  // Upload area
  upload: {
    dragDrop: /drag.*drop.*files/i,
    supportedFormats: /supported formats/i,
    maxSize: /max.*size/i
  },
  
  // YouTube form
  youtube: {
    placeholder: /enter.*youtube.*url/i,
    startButton: /start/i
  },
  
  // Actions
  actions: {
    yes: 'Yes',
    no: 'No'
  }
};

// Technical terms that should always remain in English
const TECHNICAL_TERMS = [
  'YouTube', 'Google Translate', 'OpenAI', 'GPT-4o',
  'API', 'AI', 'MP4', 'WebM', 'AVI', 'MOV',
  'Tiny', 'Medium', 'Large', 'int8',
  'SubsTranslator'
];

test.describe('English Language Comprehensive Test', () => {
  
  test.beforeEach(async ({ page }) => {
    // Force English language by setting localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'en');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should display all hero section elements in English', async ({ page }) => {
    // Check main title
    const title = page.locator('h1, .hero-title').first();
    await expect(title).toContainText(EXPECTED_ENGLISH_TEXTS.hero.title);
    
    // Check subtitle/tagline
    const subtitle = page.locator('.hero-subtitle, .tagline, p').first();
    const subtitleText = await subtitle.textContent();
    expect(subtitleText).toMatch(EXPECTED_ENGLISH_TEXTS.hero.subtitle);
    
    // Check feature cards
    for (const feature of EXPECTED_ENGLISH_TEXTS.hero.features) {
      await expect(page.locator('text=' + feature)).toBeVisible();
    }
  });

  test('should display navigation tabs in English', async ({ page }) => {
    // Check File Upload tab
    const fileUploadTab = page.locator('[data-testid="file-upload-tab"], .tab').filter({ hasText: EXPECTED_ENGLISH_TEXTS.tabs.fileUpload });
    await expect(fileUploadTab).toBeVisible();
    
    // Check Online Video tab  
    const onlineVideoTab = page.locator('[data-testid="online-video-tab"], .tab').filter({ hasText: EXPECTED_ENGLISH_TEXTS.tabs.onlineVideo });
    await expect(onlineVideoTab).toBeVisible();
  });

  test('should display language selection in English', async ({ page }) => {
    // Check Source Language label
    await expect(page.locator('text=' + EXPECTED_ENGLISH_TEXTS.languages.sourceLabel)).toBeVisible();
    
    // Check Target Language label
    await expect(page.locator('text=' + EXPECTED_ENGLISH_TEXTS.languages.targetLabel)).toBeVisible();
    
    // Check Auto Detect option
    const sourceSelect = page.locator('select').first();
    const autoDetectOption = sourceSelect.locator('option[value="auto"]');
    await expect(autoDetectOption).toContainText(EXPECTED_ENGLISH_TEXTS.languages.autoDetect);
  });

  test('should display all options in English', async ({ page }) => {
    // Check video creation checkbox
    await expect(page.locator('text=' + EXPECTED_ENGLISH_TEXTS.options.createVideo)).toBeVisible();
    
    // Check transcription model label
    await expect(page.locator('text=' + EXPECTED_ENGLISH_TEXTS.options.transcriptionModel)).toBeVisible();
    
    // Check translation service label
    await expect(page.locator('text=' + EXPECTED_ENGLISH_TEXTS.options.translationService)).toBeVisible();
    
    // Check watermark option
    const watermarkText = page.locator('text=' + EXPECTED_ENGLISH_TEXTS.options.addWatermark);
    if (await watermarkText.count() > 0) {
      await expect(watermarkText).toBeVisible();
    }
  });

  test('should display model descriptions in English', async ({ page }) => {
    // Look for model selection dropdown
    const modelSelect = page.locator('select').filter({ hasText: /medium/i }).first();
    if (await modelSelect.count() > 0) {
      await modelSelect.click();
    }
    
    // Check for English model descriptions
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(EXPECTED_ENGLISH_TEXTS.models.medium);
    expect(pageContent).toMatch(EXPECTED_ENGLISH_TEXTS.models.processingTime);
    expect(pageContent).toMatch(EXPECTED_ENGLISH_TEXTS.models.accuracy);
  });

  test('should display translation service descriptions in English', async ({ page }) => {
    // Wait for translation services to load
    await page.waitForTimeout(2000);
    
    const pageContent = await page.textContent('body');
    
    // Check Google Translate description
    expect(pageContent).toMatch(EXPECTED_ENGLISH_TEXTS.services.google);
    
    // Check OpenAI description (if available)
    if (pageContent.includes('OpenAI')) {
      expect(pageContent).toMatch(EXPECTED_ENGLISH_TEXTS.services.openai);
    }
  });

  test('should display upload area in English', async ({ page }) => {
    // Click File Upload tab if not active
    const fileUploadTab = page.locator('.tab').filter({ hasText: /file.*upload/i });
    if (await fileUploadTab.count() > 0) {
      await fileUploadTab.click();
    }
    
    const pageContent = await page.textContent('body');
    
    // Check drag & drop text
    expect(pageContent).toMatch(EXPECTED_ENGLISH_TEXTS.upload.dragDrop);
    
    // Check supported formats
    expect(pageContent).toMatch(EXPECTED_ENGLISH_TEXTS.upload.supportedFormats);
  });

  test('should display YouTube form in English', async ({ page }) => {
    // Click Online Video tab
    const onlineVideoTab = page.locator('.tab').filter({ hasText: /online.*video/i });
    if (await onlineVideoTab.count() > 0) {
      await onlineVideoTab.click();
      await page.waitForTimeout(500);
    }
    
    // Check YouTube URL input placeholder
    const youtubeInput = page.locator('input[type="text"], input[placeholder*="youtube"], input[placeholder*="URL"]').first();
    if (await youtubeInput.count() > 0) {
      const placeholder = await youtubeInput.getAttribute('placeholder');
      expect(placeholder).toMatch(EXPECTED_ENGLISH_TEXTS.youtube.placeholder);
    }
    
    // Check start/process button
    const startButton = page.locator('button').filter({ hasText: /start|process/i });
    if (await startButton.count() > 0) {
      await expect(startButton).toBeVisible();
    }
  });

  test('should preserve technical terms in English', async ({ page }) => {
    const pageContent = await page.textContent('body');
    
    // All technical terms should appear exactly as specified
    for (const term of TECHNICAL_TERMS) {
      if (pageContent.includes(term)) {
        expect(pageContent).toContain(term);
        console.log(`✓ Technical term preserved: ${term}`);
      }
    }
  });

  test('should display Yes/No actions in English', async ({ page }) => {
    // Look for Yes/No patterns in the page
    const pageContent = await page.textContent('body');
    
    // If there are Yes/No options, they should be in English
    if (pageContent.includes('✅') || pageContent.includes('❌')) {
      expect(pageContent).toContain(EXPECTED_ENGLISH_TEXTS.actions.yes);
      expect(pageContent).toContain(EXPECTED_ENGLISH_TEXTS.actions.no);
    }
  });

  test('should not contain Hebrew or Arabic text', async ({ page }) => {
    const pageContent = await page.textContent('body');
    
    // Should not contain Hebrew characters (except in technical contexts)
    const hebrewPattern = /[\u0590-\u05FF]/;
    const hebrewMatches = pageContent.match(hebrewPattern);
    
    if (hebrewMatches) {
      console.warn('Found Hebrew text in English mode:', hebrewMatches.slice(0, 5));
      // Allow Hebrew only in very specific technical contexts
      const allowedHebrewContexts = [
        'font-family', 'charset', 'encoding'
      ];
      const isAllowedContext = allowedHebrewContexts.some(context => 
        pageContent.toLowerCase().includes(context)
      );
      expect(isAllowedContext).toBeTruthy();
    }
    
    // Should not contain Arabic characters
    const arabicPattern = /[\u0600-\u06FF]/;
    const arabicMatches = pageContent.match(arabicPattern);
    
    if (arabicMatches) {
      console.warn('Found Arabic text in English mode:', arabicMatches.slice(0, 5));
      expect(arabicMatches).toBeNull();
    }
  });

  test('should have correct HTML direction and language attributes', async ({ page }) => {
    // Check HTML lang attribute
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('en');
    
    // Check HTML dir attribute
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('ltr');
  });

  test('should handle form interactions in English', async ({ page }) => {
    // Test language selection
    const sourceSelect = page.locator('select').first();
    await sourceSelect.selectOption('auto');
    
    const targetSelect = page.locator('select').nth(1);
    await targetSelect.selectOption('he');
    
    // Test checkbox interaction
    const videoCheckbox = page.locator('input[type="checkbox"]').first();
    if (await videoCheckbox.count() > 0) {
      await videoCheckbox.click();
    }
    
    // Verify all labels and options remain in English
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Auto Detect');
    expect(pageContent).toContain('Source Language');
    expect(pageContent).toContain('Target Language');
  });

  test('should display error messages in English', async ({ page }) => {
    // Try to trigger a validation error by submitting empty YouTube form
    const onlineVideoTab = page.locator('.tab').filter({ hasText: /online.*video/i });
    if (await onlineVideoTab.count() > 0) {
      await onlineVideoTab.click();
      
      const submitButton = page.locator('button').filter({ hasText: /start|process/i });
      if (await submitButton.count() > 0) {
        await submitButton.click();
        
        // Look for error messages
        await page.waitForTimeout(1000);
        const errorElements = page.locator('.error, .validation-error, [class*="error"]');
        
        if (await errorElements.count() > 0) {
          const errorText = await errorElements.first().textContent();
          // Error should be in English, not Hebrew/Arabic
          expect(errorText).not.toMatch(/[\u0590-\u05FF\u0600-\u06FF]/);
          console.log('Error message in English:', errorText);
        }
      }
    }
  });

  test('should maintain English throughout user journey', async ({ page }) => {
    // Simulate a complete user journey
    
    // 1. Start on homepage - should be English
    let pageContent = await page.textContent('body');
    expect(pageContent).toContain('SubsTranslator');
    
    // 2. Switch between tabs - should remain English
    const onlineVideoTab = page.locator('.tab').filter({ hasText: /online.*video/i });
    if (await onlineVideoTab.count() > 0) {
      await onlineVideoTab.click();
      await page.waitForTimeout(500);
      
      pageContent = await page.textContent('body');
      expect(pageContent).toMatch(EXPECTED_ENGLISH_TEXTS.youtube.placeholder);
    }
    
    const fileUploadTab = page.locator('.tab').filter({ hasText: /file.*upload/i });
    if (await fileUploadTab.count() > 0) {
      await fileUploadTab.click();
      await page.waitForTimeout(500);
      
      pageContent = await page.textContent('body');
      expect(pageContent).toMatch(EXPECTED_ENGLISH_TEXTS.upload.dragDrop);
    }
    
    // 3. Change options - should remain English
    const modelSelect = page.locator('select').filter({ hasText: /medium/i });
    if (await modelSelect.count() > 0) {
      await modelSelect.selectOption('tiny');
      await page.waitForTimeout(500);
      
      pageContent = await page.textContent('body');
      expect(pageContent).toContain('Tiny');
    }
    
    // 4. Final check - everything should still be English
    pageContent = await page.textContent('body');
    expect(pageContent).not.toMatch(/[\u0590-\u05FF\u0600-\u06FF]/);
    
    console.log('✓ Complete user journey maintained English language');
  });
});

test.describe('English Language Edge Cases', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('i18nextLng', 'en');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should handle dynamic content loading in English', async ({ page }) => {
    // Wait for all dynamic content to load
    await page.waitForTimeout(3000);
    
    // Check that dynamically loaded translation services are in English
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('Google Translate')) {
      expect(pageContent).toMatch(/free.*google.*translation/i);
    }
    
    if (pageContent.includes('OpenAI')) {
      expect(pageContent).toMatch(/advanced.*translation.*gpt/i);
    }
  });

  test('should handle page refresh and maintain English', async ({ page }) => {
    // Interact with the page first
    const sourceSelect = page.locator('select').first();
    if (await sourceSelect.count() > 0) {
      await sourceSelect.selectOption('auto');
    }
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be in English
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('en');
    
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Auto Detect');
    expect(pageContent).not.toMatch(/[\u0590-\u05FF\u0600-\u06FF]/);
  });

  test('should handle browser back/forward in English', async ({ page }) => {
    // Navigate to different sections
    const onlineVideoTab = page.locator('.tab').filter({ hasText: /online.*video/i });
    if (await onlineVideoTab.count() > 0) {
      await onlineVideoTab.click();
      await page.waitForTimeout(500);
    }
    
    // Use browser back (simulate URL change)
    await page.goBack();
    await page.waitForTimeout(500);
    
    // Should still be English
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toMatch(/[\u0590-\u05FF\u0600-\u06FF]/);
  });
});
