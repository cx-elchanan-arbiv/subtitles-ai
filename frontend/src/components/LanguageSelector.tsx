import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../i18n/TranslationContext';
import { ChevronDown, Globe } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  className = '', 
  showLabel = true,
  compact = false 
}) => {
  const { currentLanguage, changeLanguage, supportedLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLanguageChange = async (languageCode: any) => {
    try {
      changeLanguage(languageCode);
      setIsOpen(false);

    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  const dropdownVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95, 
      y: -10
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.15 }
    })
  };

  if (compact) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Select language"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className="text-lg" role="img" aria-label={supportedLanguages.find(l => l.code === currentLanguage)?.name}>
            {supportedLanguages.find(l => l.code === currentLanguage)?.flag}
          </span>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute top-full mt-2 right-0 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-xl py-2 min-w-[200px] z-50"
              role="listbox"
              aria-label="Language options"
            >
              {supportedLanguages.map((lang, index) => (
                <motion.button
                  key={lang.code}
                  variants={itemVariants}
                  custom={index}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                    currentLanguage === lang.code ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                  }`}
                  role="option"
                  aria-selected={currentLanguage === lang.code}
                >
                  <span className="text-lg" role="img" aria-label={lang.name}>
                    {lang.flag}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{lang.name}</div>
                  </div>
                  {currentLanguage === lang.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-blue-600 rounded-full"
                    />
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200 min-w-[160px]"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="w-5 h-5 text-white/80" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-lg" role="img" aria-label={supportedLanguages.find(l => l.code === currentLanguage)?.name}>
              {supportedLanguages.find(l => l.code === currentLanguage)?.flag}
            </span>
            {showLabel && (
              <span className="text-white font-medium">
                {supportedLanguages.find(l => l.code === currentLanguage)?.name}
              </span>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-white/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-xl py-2 z-50"
            role="listbox"
            aria-label="Language options"
          >
            {supportedLanguages.map((lang, index) => (
              <motion.button
                key={lang.code}
                variants={itemVariants}
                custom={index}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors duration-150 ${
                  currentLanguage === lang.code ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                }`}
                role="option"
                aria-selected={currentLanguage === lang.code}
              >
                <span className="text-lg" role="img" aria-label={lang.name}>
                  {lang.flag}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {lang.name}
                  </div>
                </div>
                {currentLanguage === lang.code && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-blue-600 rounded-full"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
