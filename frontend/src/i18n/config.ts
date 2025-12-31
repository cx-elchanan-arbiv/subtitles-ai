import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import shared configuration  
const sharedConfig = require('../shared-config.js');

// Use shared language configuration
export const SUPPORTED_LANGUAGES = sharedConfig.SUPPORTED_LANGUAGES;
export const ALL_LANGUAGES = sharedConfig.ALL_LANGUAGES;
export const SOURCE_LANGUAGES = sharedConfig.SOURCE_LANGUAGES;
export const TARGET_LANGUAGES = sharedConfig.TARGET_LANGUAGES;

// Custom language detection function for better Hebrew support
export const detectBrowserLanguage = (): SupportedLanguage => {
  // Check localStorage first
  const stored = localStorage.getItem('i18nextLng');
  if (stored && Object.keys(SUPPORTED_LANGUAGES).includes(stored)) {
    return stored as SupportedLanguage;
  }
  
  // Check navigator language
  const browserLang = navigator.language.split('-')[0];
  if (Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)) {
    return browserLang as SupportedLanguage;
  }
  
  // Check for Hebrew specifically (common browser language codes)
  if (browserLang === 'he' || navigator.language === 'he-IL' || navigator.language.includes('iw')) {
    return 'he';
  }
  
  // Default fallback
  return 'en';
};

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;
export type LanguageDirection = 'ltr' | 'rtl';

// Namespaces for organized translations
export const NAMESPACES = ['common', 'errors', 'forms', 'pages'] as const;
export type Namespace = typeof NAMESPACES[number];

// Browser language detection configuration
const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
  checkWhitelist: true,
  // Custom detection logic for Hebrew browsers
  lookupNavigator: true,
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
};

// Backend configuration for loading translation files
const backendOptions = {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  // Remove addPath to prevent 404 errors in development
};

// Initialize i18next with custom language detection
const initLanguage = detectBrowserLanguage();

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Language settings
    lng: String(initLanguage), // Set initial language explicitly
    fallbackLng: 'en',
    supportedLngs: Object.keys(SUPPORTED_LANGUAGES),
    
    // Namespace settings
    ns: NAMESPACES,
    defaultNS: 'common',
    
    // Detection settings
    detection: detectionOptions,
    
    // Backend settings
    backend: backendOptions,
    
    // Development settings
    debug: process.env.NODE_ENV === 'development',
    
    // Interpolation settings
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React settings
    react: {
      useSuspense: false, // Disable suspense for better error handling
    },
    
    // Pluralization settings
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Performance settings
    load: 'languageOnly', // Don't load country-specific variants
    preload: ['en', 'he'], // Preload critical languages
    
    // Fallback settings
    saveMissing: false, // Disable to prevent POST requests to missing.json files
    saveMissingTo: 'current',
    
    // Key separator settings
    keySeparator: '.',
    nsSeparator: ':',
  });

export default i18n;

// Helper functions (using shared configuration)
export const getLanguageInfo = (code: SupportedLanguage) => sharedConfig.getLanguageInfo(code);

export const isRTL = (code: SupportedLanguage): boolean => sharedConfig.isRTL(code);

export const getLanguageDirection = (code: SupportedLanguage): LanguageDirection =>
  sharedConfig.getLanguageInfo(code).dir as LanguageDirection;

export const getLanguageFont = (code: SupportedLanguage): string =>
  sharedConfig.getLanguageInfo(code).font;

// SEO helpers
export const getLanguageAlternates = (currentPath: string) => {
  return Object.keys(SUPPORTED_LANGUAGES).map(lang => ({
    hrefLang: lang,
    href: `/${lang}${currentPath}`,
  }));
};

// URL helpers
export const getLocalizedPath = (path: string, language: SupportedLanguage): string => {
  return `/${String(language)}${path}`;
};

export const extractLanguageFromPath = (pathname: string): {
  language: SupportedLanguage;
  path: string;
} => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && Object.keys(SUPPORTED_LANGUAGES).includes(String(firstSegment))) {
    return {
      language: firstSegment as SupportedLanguage,
      path: '/' + segments.slice(1).join('/'),
    };
  }
  
  return {
    language: 'en', // Default language
    path: pathname,
  };
};



