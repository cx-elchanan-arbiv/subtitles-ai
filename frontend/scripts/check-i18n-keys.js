#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const LOCALES_PATH = path.join(__dirname, '../public/locales');
const SRC_PATH = path.join(__dirname, '../src');
const SUPPORTED_LANGUAGES = ['en', 'he', 'ar', 'es'];
const TRANSLATION_FILES = ['common.json', 'errors.json', 'forms.json', 'pages.json'];

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load all translation files
function loadTranslations() {
  const translations = {};
  
  for (const lang of SUPPORTED_LANGUAGES) {
    translations[lang] = {};
    const langPath = path.join(LOCALES_PATH, lang);
    
    if (!fs.existsSync(langPath)) {
      log('yellow', `⚠️  Warning: Missing language directory for ${lang}`);
      continue;
    }
    
    for (const file of TRANSLATION_FILES) {
      const filePath = path.join(langPath, file);
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const namespace = file.replace('.json', '');
          translations[lang][namespace] = content;
        } catch (error) {
          log('red', `❌ Error parsing ${filePath}: ${error.message}`);
        }
      }
    }
  }
  
  return translations;
}

// Extract translation keys used in source code
function extractUsedKeys() {
  const usedKeys = new Set();
  const files = glob.sync('**/*.{ts,tsx}', { cwd: SRC_PATH });
  
  for (const file of files) {
    const filePath = path.join(SRC_PATH, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Match t('key') and t("key") patterns
    const tPatterns = [
      /\bt\(\s*['"]([\w.:]+)['"]/g,
      /\bt\(`([\w.:]+)`/g,
      /\bt\(\s*['"`]([\w.:]+)['"`]/g
    ];
    
    // Match i18nT('namespace:key') patterns  
    const i18nTPatterns = [
      /\bi18nT\(\s*['"]([\w.:]+)['"]/g,
      /\bi18nT\(`([\w.:]+)`/g
    ];
    
    for (const pattern of [...tPatterns, ...i18nTPatterns]) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        usedKeys.add(match[1]);
      }
    }
  }
  
  return usedKeys;
}

// Get all available keys from translation files
function getAllAvailableKeys(translations) {
  const availableKeys = new Set();
  
  function addKeysFromObject(obj, prefix = '') {
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        addKeysFromObject(obj[key], fullKey);
      } else {
        availableKeys.add(fullKey);
      }
    }
  }
  
  // Use English as the reference
  if (translations.en) {
    for (const namespace in translations.en) {
      addKeysFromObject(translations.en[namespace], namespace);
    }
  }
  
  return availableKeys;
}

// Check for missing keys across languages
function checkMissingKeys(translations) {
  const missingKeys = {};
  const baseKeys = getAllAvailableKeys({ en: translations.en });
  
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === 'en') continue;
    
    missingKeys[lang] = [];
    const langKeys = getAllAvailableKeys({ [lang]: translations[lang] });
    
    for (const key of baseKeys) {
      if (!langKeys.has(key)) {
        missingKeys[lang].push(key);
      }
    }
  }
  
  return missingKeys;
}

// Main execution
function main() {
  log('blue', '🔍 Starting i18n key validation...\n');
  
  const translations = loadTranslations();
  const usedKeys = extractUsedKeys();
  const availableKeys = getAllAvailableKeys(translations);
  const missingKeys = checkMissingKeys(translations);
  
  let hasErrors = false;
  
  // Check for missing translation keys
  const missingTranslations = [];
  for (const key of usedKeys) {
    if (!availableKeys.has(key)) {
      missingTranslations.push(key);
    }
  }
  
  if (missingTranslations.length > 0) {
    hasErrors = true;
    log('red', '❌ Missing translation keys:');
    for (const key of missingTranslations) {
      log('red', `   • ${key}`);
    }
    console.log();
  }
  
  // Check for unused translation keys
  const unusedKeys = [];
  for (const key of availableKeys) {
    if (!usedKeys.has(key)) {
      unusedKeys.push(key);
    }
  }
  
  if (unusedKeys.length > 0) {
    log('yellow', '⚠️  Unused translation keys:');
    for (const key of unusedKeys) {
      log('yellow', `   • ${key}`);
    }
    console.log();
  }
  
  // Check for missing keys in non-English languages
  for (const lang of Object.keys(missingKeys)) {
    if (missingKeys[lang].length > 0) {
      hasErrors = true;
      log('red', `❌ Missing keys in ${lang}:`);
      for (const key of missingKeys[lang]) {
        log('red', `   • ${key}`);
      }
      console.log();
    }
  }
  
  // Summary
  log('cyan', '📊 Summary:');
  log('cyan', `   • Used keys: ${usedKeys.size}`);
  log('cyan', `   • Available keys: ${availableKeys.size}`);
  log('cyan', `   • Missing translations: ${missingTranslations.length}`);
  log('cyan', `   • Unused keys: ${unusedKeys.length}`);
  
  if (hasErrors) {
    log('red', '\n💥 i18n validation failed! Please fix the issues above.');
    process.exit(1);
  } else {
    log('green', '\n✅ All i18n keys are valid!');
    process.exit(0);
  }
}

// Install glob if not available
try {
  require('glob');
} catch (error) {
  log('red', '❌ Missing required dependency "glob". Please install it:');
  log('red', '   npm install glob');
  process.exit(1);
}

main();