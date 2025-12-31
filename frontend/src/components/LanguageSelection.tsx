import React from 'react';
import { useTranslation } from '../i18n/TranslationContext';

interface LanguageSelectionProps {
  sourceLang: string;
  targetLang: string;
  languages: { [key: string]: string };
  onSourceLangChange: (lang: string) => void;
  onTargetLangChange: (lang: string) => void;
  disabled: boolean;
}

const LanguageSelection: React.FC<LanguageSelectionProps> = ({
  sourceLang,
  targetLang,
  languages,
  onSourceLangChange,
  onTargetLangChange,
  disabled,
}) => {
  const { t } = useTranslation();
  
  return (
    <div className="language-selection">
      <div className="language-row">
        <div className="language-group">
          <label>{t.sourceLanguage}</label>
          <select
            value={sourceLang}
            onChange={(e) => onSourceLangChange(e.target.value)}
            disabled={disabled}
          >
            {Object.entries(languages).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>
        <div className="arrow">→</div>
        <div className="language-group">
          <label>{t.targetLanguage}</label>
          <select
            value={targetLang}
            onChange={(e) => onTargetLangChange(e.target.value)}
            disabled={disabled}
          >
            {Object.entries(languages)
              .filter(([code]) => code !== 'auto')
              .map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;
