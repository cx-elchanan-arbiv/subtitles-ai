import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  getLanguageInfo, 
  isRTL
} from './config';
import './config'; // Import to initialize i18next

interface I18nContextType {
  language: SupportedLanguage;
  direction: 'ltr' | 'rtl';
  isRTL: boolean;
  font: string;
  changeLanguage: (language: SupportedLanguage) => Promise<void>;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  ready: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const { t, i18n, ready } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Safely get current language with fallback and better Hebrew detection
  const getCurrentLanguage = (): SupportedLanguage => {
    let lang = i18n.language;
    
    // If no language set, try to detect from browser
    if (!lang) {
      const browserLang = navigator.language.split('-')[0];
      if (Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)) {
        lang = browserLang;
        // Set it immediately to avoid inconsistencies
        i18n.changeLanguage(browserLang);
      } else {
        lang = 'en';
      }
    }
    
    return Object.keys(SUPPORTED_LANGUAGES).includes(String(lang)) ? lang as SupportedLanguage : 'en';
  };
  
  const currentLanguage = getCurrentLanguage();
  const languageInfo = getLanguageInfo(currentLanguage);
  
  // Initialize document attributes and fonts
  useEffect(() => {
    const initializeLanguage = () => {
      const langInfo = getLanguageInfo(currentLanguage);
      
      // Set document attributes
      document.documentElement.dir = langInfo.dir;
      document.documentElement.lang = String(currentLanguage);
      
      // Set font family CSS variable
      document.documentElement.style.setProperty('--font-family', langInfo.font);
      
      // Add language-specific classes
      document.documentElement.className = document.documentElement.className
        .replace(/lang-\w+/g, '')
        .replace(/dir-\w+/g, '') + ` lang-${String(currentLanguage)} dir-${langInfo.dir}`;
      
      // Set page title with current language
      if (ready) {
        document.title = t('app.title') + ' - ' + t('app.subtitle');
      }
      
      setIsInitialized(true);
    };

    if (ready) {
      initializeLanguage();
    }
  }, [currentLanguage, ready, t]);

  // Handle language change
  const changeLanguage = async (language: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(String(language));
      
      const langInfo = getLanguageInfo(language);
      
      // Update document attributes immediately
      document.documentElement.dir = langInfo.dir;
      document.documentElement.lang = String(language);
      document.documentElement.style.setProperty('--font-family', langInfo.font);
      
      // Update classes
      document.documentElement.className = document.documentElement.className
        .replace(/lang-\w+/g, '')
        .replace(/dir-\w+/g, '') + ` lang-${String(language)} dir-${langInfo.dir}`;
      
      // Store preference
      localStorage.setItem('i18nextLng', String(language));
      
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { 
          language, 
          direction: langInfo.dir,
          font: langInfo.font 
        }
      }));
      
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    }
  };

  const contextValue: I18nContextType = {
    language: currentLanguage,
    direction: languageInfo?.dir || 'ltr',
    isRTL: isRTL(currentLanguage),
    font: languageInfo?.font || 'Inter',
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    ready: ready && isInitialized,
  };

  // Show loading state while i18n is initializing
  if (!ready || !isInitialized) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};


