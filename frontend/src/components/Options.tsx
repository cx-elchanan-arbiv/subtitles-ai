import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/TranslationContext';
import { useI18n } from '../i18n/I18nProvider';
import type { WhisperModel, TranslationService as TranslationServiceType } from '../types';

interface TranslationService {
  name: string;
  available: boolean;
  description: string;
}

interface WhisperModelOption {
  name: string;
  description: string;
  time_estimate: string;
  accuracy: string;
  best_for: string;
  compute_type: string;
}

interface OptionsProps {
  autoCreateVideo: boolean;
  onAutoCreateVideoChange: (checked: boolean) => void;
  whisperModel: WhisperModel;
  onWhisperModelChange: (model: WhisperModel) => void;
  translationService: TranslationServiceType;
  onTranslationServiceChange: (service: TranslationServiceType) => void;
  transcriptionOnly: boolean;
  onTranscriptionOnlyChange: (checked: boolean) => void;
  disabled: boolean;
}

const Options: React.FC<OptionsProps> = ({
  autoCreateVideo,
  onAutoCreateVideoChange,
  whisperModel,
  onWhisperModelChange,
  translationService,
  onTranslationServiceChange,
  transcriptionOnly,
  onTranscriptionOnlyChange,
  disabled,
}) => {
  const { t } = useTranslation();
  const { language } = useI18n();
  const [translationServices, setTranslationServices] = useState<Record<string, TranslationService>>({});
  const [whisperModels, setWhisperModels] = useState<Record<string, WhisperModelOption>>({});

  useEffect(() => {
    const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

    // Load translation services with current language
    fetch(`${apiBaseUrl}/translation-services`, {
      headers: {
        'Accept-Language': String(language)
      }
    })
      .then(res => res.json())
      .then(data => {
        setTranslationServices(data);
      })
      .catch(err => {
        console.error('Failed to load translation services:', err);
        // Fallback to default services
        setTranslationServices({
          google: { name: 'Google Translate', available: true, description: t('options.googleDescription') || 'Free translation service' },
          openai: { name: 'OpenAI (GPT-4o)', available: false, description: t('options.openaiDescription') || 'OpenAI API key required' }
        });
      });

    // Load Whisper models
    fetch(`${apiBaseUrl}/whisper-models`)
      .then(res => res.json())
      .then(data => {
        // Apply translations to server data
        const serverModels = data.models || {};
        const translatedModels: any = {};

        Object.keys(serverModels).forEach(key => {
          const model = serverModels[key];
          translatedModels[key] = {
            ...model,
            name: `${model.name.split('(')[0].trim()} (${t(`whisperModels.${key}`)})`,
            description: t(`modelDetails.${key === 'base' ? 'goodBalance' :
                           key === 'medium' ? 'perfectBalance' : 'maximumAccuracy'}`),
            time_estimate: t(`modelDetails.${key}Time`),
            accuracy: t(`modelDetails.${key}Accuracy`),
            best_for: t(`modelDetails.${key}BestFor`),
            compute_type: t('modelDetails.computeTypeInt8')
          };
        });

        setWhisperModels(translatedModels);
      })
      .catch(err => {
        console.error('Failed to load whisper models:', err);
        // Fallback to default models (all using int8 on CPU)
        setWhisperModels({
          base: {
            name: `Base (${t('whisperModels.base')})`,
            description: t('modelDetails.goodBalance'),
            time_estimate: t('modelDetails.baseTime'),
            accuracy: t('modelDetails.baseAccuracy'),
            best_for: t('modelDetails.baseBestFor'),
            compute_type: t('modelDetails.computeTypeInt8')
          },
          medium: {
            name: `Medium (${t('whisperModels.medium')})`,
            description: t('modelDetails.perfectBalance'),
            time_estimate: t('modelDetails.mediumTime'),
            accuracy: t('modelDetails.mediumAccuracy'),
            best_for: t('modelDetails.mediumBestFor'),
            compute_type: t('modelDetails.computeTypeInt8')
          },
          large: {
            name: `Large (${t('whisperModels.large')})`,
            description: t('modelDetails.maximumAccuracy'),
            time_estimate: t('modelDetails.largeTime'),
            accuracy: t('modelDetails.largeAccuracy'),
            best_for: t('modelDetails.largeBestFor'),
            compute_type: t('modelDetails.computeTypeInt8')
          },
          gemini: {
            name: 'Gemini 2.5 Flash (⚡ ניסיוני)',
            description: 'AI מתקדם מאת Google - מהיר במיוחד',
            time_estimate: 'מהיר מאוד (1-2 דקות)',
            accuracy: 'ניסיוני (יכול להיות פחות מדויק)',
            best_for: 'סרטונים קצרים מ-YouTube (עד 15 דקות)',
            compute_type: 'Cloud API'
          }
        });
      });
  }, [t, language]);

  return (
    <div className="options">
      {whisperModel === 'gemini' && (
        <div className="model-warning" style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          color: '#856404',
          fontSize: '0.9em'
        }}>
          ⚠️ <strong>Gemini בשלב ניסיוני:</strong><br/>
          • מומלץ לסרטונים קצרים (עד 15 דקות)<br/>
          • עובד רק עם YouTube URLs<br/>
          • אם נכשל, המערכת תעבור אוטומטית ל-Whisper
        </div>
      )}
      <div className="checkbox-option">
        <input
          type="checkbox"
          id="autoCreateVideo"
          checked={autoCreateVideo}
          onChange={(e) => onAutoCreateVideoChange(e.target.checked)}
          disabled={disabled}
        />
        <label htmlFor="autoCreateVideo">{t.autoCreateVideo}</label>
      </div>
      <div className="model-selection">
        <label>{t.whisperModel}</label>
        <div className="model-controls">
          <select
            value={whisperModel}
            onChange={(e) => onWhisperModelChange(e.target.value as WhisperModel)}
            disabled={disabled}
          >
            {Object.entries(whisperModels).map(([key, model]) => (
              <option
                key={key}
                value={key}
              >
                {model.name}{key === 'large' ? ` [${t('whisperModels.pro')}]` : ''}
              </option>
            ))}
            {/* Fallback options if API fails */}
            {Object.keys(whisperModels).length === 0 && (
              <>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <option value="base">Base ({t('whisperModels.base')})</option>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <option value="medium">Medium ({t('whisperModels.medium')})</option>
                {/* eslint-disable-next-line i18next/no-literal-string */}
                <option value="large">
                  Large ({t('whisperModels.large')}) [{t('whisperModels.pro')}]
                </option>
              </>
            )}
          </select>
        </div>
        {Object.keys(whisperModels).length === 0 && (
          <div className="model-hint">
            {t.modelHint}
          </div>
        )}
      </div>
      <div className="checkbox-option transcription-only-option">
        <input
          type="checkbox"
          id="transcriptionOnly"
          checked={transcriptionOnly}
          onChange={(e) => onTranscriptionOnlyChange(e.target.checked)}
          disabled={disabled}
        />
        <label htmlFor="transcriptionOnly">{t('options.transcriptionOnly')}</label>
        <span className="option-hint">{t('options.transcriptionOnlyHint')}</span>
      </div>
      <div className={`translation-service-selection ${transcriptionOnly ? 'disabled-section' : ''}`}>
        <label>{t('options.translationService')}</label>
        <div className="model-controls">
          <select
            value={translationService}
            onChange={(e) => onTranslationServiceChange(e.target.value as TranslationServiceType)}
            disabled={disabled || transcriptionOnly}
          >
            {Object.entries(translationServices).map(([key, service]) => (
              <option
                key={key}
                value={key}
                disabled={!service.available}
                style={{
                  color: service.available ? 'inherit' : '#999',
                  fontStyle: service.available ? 'normal' : 'italic'
                }}
              >
                {service.name} {!service.available ? `(${t('status.unavailable')})` : ''}
              </option>
            ))}
          </select>
        </div>
        {translationServices[translationService] && (
          <div className="service-description" style={{
            fontSize: '0.8em',
            color: translationServices[translationService].available ? '#666' : '#d32f2f',
            marginTop: '4px'
          }}>
            {translationServices[translationService].description}
          </div>
        )}
      </div>

    </div>
  );
};

export default Options;