import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  SUPPORTED_LANGUAGES, 
  SupportedLanguage, 
  extractLanguageFromPath, 
  getLocalizedPath,
  detectBrowserLanguage
} from '../i18n/config';

// Language detection and routing wrapper
const LanguageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { lng } = useParams<{ lng: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      // Extract language from URL
      const currentLang = lng as SupportedLanguage;
      
      // Validate language parameter
      if (currentLang && Object.keys(SUPPORTED_LANGUAGES).includes(String(currentLang))) {
        // Change i18n language if different
        if (i18n.language !== String(currentLang)) {
          await i18n.changeLanguage(String(currentLang));
        }
        setIsInitialized(true);
      } else {
        // Invalid or missing language - redirect to default
        const browserLang = navigator.language.split('-')[0] as SupportedLanguage;
        const defaultLang = Object.keys(SUPPORTED_LANGUAGES).includes(String(browserLang)) 
          ? browserLang 
          : 'en';
        
        // Get current path without language prefix
        const pathWithoutLang = location.pathname.replace(/^\/[a-z]{2}/, '') || '/';
        const newPath = getLocalizedPath(pathWithoutLang, defaultLang);
        
        navigate(newPath, { replace: true });
        return;
      }
    };

    initializeLanguage();
  }, [lng, location.pathname, navigate, i18n]);

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Root redirect component
const RootRedirect: React.FC = () => {
  const location = useLocation();
  
  const defaultLang = detectBrowserLanguage();
  
  // Check if we're already on a localized path
  const { language } = extractLanguageFromPath(location.pathname);
  if (Object.keys(SUPPORTED_LANGUAGES).includes(String(language))) {
    return null; // Already on correct path
  }
  
  // Redirect to localized version
  const localizedPath = getLocalizedPath(location.pathname, defaultLang);
  return <Navigate to={localizedPath} replace />;
};

// Language-aware route component
interface LocalizedRouteProps {
  path: string;
  element: React.ReactElement;
  index?: boolean;
}

const LocalizedRoute: React.FC<LocalizedRouteProps> = ({ path, element, index }) => {
  if (index) {
    return <Route index element={element} />;
  }
  return <Route path={path} element={element} />;
};

// Main language router component
interface LanguageRouterProps {
  children: React.ReactNode;
}

export const LanguageRouter: React.FC<LanguageRouterProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<RootRedirect />} />
        
        {/* Localized routes */}
        <Route path="/:lng/*" element={
          <LanguageWrapper>
            {children}
          </LanguageWrapper>
        } />
        
        {/* Fallback for any unmatched routes */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

// Hook for language-aware navigation
export const useLocalizedNavigate = () => {
  const navigate = useNavigate();
  const { lng } = useParams<{ lng: string }>();
  const currentLang = lng as SupportedLanguage;

  const navigateLocalized = (path: string, options?: { replace?: boolean }) => {
    const localizedPath = getLocalizedPath(path, currentLang);
    navigate(localizedPath, options);
  };

  const changeLanguage = async (newLanguage: SupportedLanguage, path?: string) => {
    // This will be handled by the I18nProvider
    const currentPath = path || window.location.pathname.replace(/^\/[a-z]{2}/, '') || '/';
    const newPath = getLocalizedPath(currentPath, newLanguage);
    navigate(newPath, { replace: true });
  };

  return {
    navigate: navigateLocalized,
    changeLanguage,
    currentLanguage: currentLang,
  };
};

// Hook to get current localized path
export const useLocalizedPath = () => {
  const location = useLocation();
  const { lng } = useParams<{ lng: string }>();
  
  const getPath = (path: string) => {
    const currentLang = lng as SupportedLanguage;
    return getLocalizedPath(path, currentLang);
  };
  
  const getCurrentPath = () => {
    return location.pathname.replace(/^\/[a-z]{2}/, '') || '/';
  };
  
  return {
    getPath,
    getCurrentPath,
    currentLanguage: lng as SupportedLanguage,
    fullPath: location.pathname,
  };
};

// Component for language-aware links
interface LocalizedLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  replace?: boolean;
}

export const LocalizedLink: React.FC<LocalizedLinkProps> = ({ 
  to, 
  children, 
  className = '',
  replace = false 
}) => {
  const { navigate } = useLocalizedNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to, { replace });
  };
  
  return (
    <a 
      href={to} 
      onClick={handleClick} 
      className={className}
    >
      {children}
    </a>
  );
};

// SEO component for language alternates
export const LanguageAlternates: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  return (
    <>
      {Object.keys(SUPPORTED_LANGUAGES).map(lang => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`${window.location.origin}${getLocalizedPath(currentPath, lang as SupportedLanguage)}`}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${window.location.origin}${getLocalizedPath(currentPath, 'en')}`}
      />
    </>
  );
};

export default LanguageRouter;
