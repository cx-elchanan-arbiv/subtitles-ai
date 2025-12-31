/**
 * Shared Language Configuration for SubsTranslator
 * Single source of truth for all language-related settings
 * Used by both frontend and backend
 */

// Core supported languages with complete metadata
export const SUPPORTED_LANGUAGES = {
  he: {
    code: 'he',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
    dir: 'rtl',
    font: 'Heebo',
    rtl: true,
    hasTranslations: true
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: true
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: true
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
    font: 'Noto Sans Arabic',
    rtl: true,
    hasTranslations: true
  }
};

// Extended languages for transcription/translation (without full UI translations)
export const TRANSCRIPTION_LANGUAGES = {
  ...SUPPORTED_LANGUAGES,
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: false
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: false
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: false
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: false
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: false
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: false
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: false
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: false
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    dir: 'ltr',
    font: 'Inter',
    rtl: false,
    hasTranslations: false
  }
};

// Auto-detection option
export const AUTO_DETECT = {
  code: 'auto',
  name: 'Auto Detect',
  nativeName: 'Auto Detect',
  flag: '🔍',
  dir: 'ltr',
  font: 'Inter',
  rtl: false,
  hasTranslations: false
};

// Complete language list including auto-detect
export const ALL_LANGUAGES = {
  auto: AUTO_DETECT,
  ...TRANSCRIPTION_LANGUAGES
};

// Default settings
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_TARGET_LANGUAGE = 'he';

// UI languages (languages with full translation files)
export const UI_LANGUAGES = Object.keys(SUPPORTED_LANGUAGES);

// Source languages (for transcription, includes auto)
export const SOURCE_LANGUAGES = Object.keys(ALL_LANGUAGES);

// Target languages (for translation, excludes auto)
export const TARGET_LANGUAGES = Object.keys(TRANSCRIPTION_LANGUAGES);

// Utility functions
export const getLanguageInfo = (code) => ALL_LANGUAGES[code] || SUPPORTED_LANGUAGES[DEFAULT_LANGUAGE];
export const isRTL = (code) => getLanguageInfo(code).rtl;
export const hasTranslations = (code) => getLanguageInfo(code).hasTranslations;
export const getLanguageName = (code) => getLanguageInfo(code).nativeName;

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js/Backend
  module.exports = {
    SUPPORTED_LANGUAGES,
    TRANSCRIPTION_LANGUAGES,
    ALL_LANGUAGES,
    AUTO_DETECT,
    DEFAULT_LANGUAGE,
    DEFAULT_TARGET_LANGUAGE,
    UI_LANGUAGES,
    SOURCE_LANGUAGES,
    TARGET_LANGUAGES,
    getLanguageInfo,
    isRTL,
    hasTranslations,
    getLanguageName
  };
}
