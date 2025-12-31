import { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/TranslationContext';
import type { WhisperModel, TranslationService } from '../types';

interface YoutubeFormProps {
  onYoutubeSubmit: (
    youtubeUrl: string,
    sourceLang: string,
    targetLang: string,
    autoCreateVideo: boolean,
    whisperModel: WhisperModel,
    translationService: TranslationService
  ) => void;
  onQuickDownload: (url: string) => void;
  isProcessing: boolean;
  sourceLang: string;
  targetLang: string;
  autoCreateVideo: boolean;
  whisperModel: WhisperModel;
  translationService: TranslationService;
}

const YoutubeForm: React.FC<YoutubeFormProps> = ({ 
  onYoutubeSubmit, 
  onQuickDownload, 
  isProcessing,
  sourceLang,
  targetLang,
  autoCreateVideo,
  whisperModel,
  translationService
}) => {
  const { t } = useTranslation();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  // Validate URL in real-time with debounce
  useEffect(() => {
    if (!youtubeUrl.trim()) {
      setValidationError('');
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      const error = validateVideoUrl(youtubeUrl);
      setValidationError(error);
      setIsValidating(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeUrl]);

  const validateVideoUrl = (url: string): string => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return '';
    
    try {
      const urlObj = new URL(trimmedUrl);
      const domain = urlObj.hostname.toLowerCase();
      
      // Popular supported domains (yt-dlp supports 1849+ sites)
      const popularDomains = [
        // YouTube
        'youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com',
        // Other popular video sites
        'vimeo.com', 'dailymotion.com', 'facebook.com', 'fb.watch',
        'instagram.com', 'tiktok.com', 'twitch.tv', 'reddit.com',
        'soundcloud.com', 'twitter.com', 'x.com', 'foxnews.com'
      ];
      
      // Check if it's a known popular domain
      const isKnownDomain = popularDomains.some(validDomain => domain.includes(validDomain));
      
      if (isKnownDomain) {
        // Additional validation for known domains
        if (domain.includes('youtube.com')) {
          if (!urlObj.pathname.includes('/watch') && !urlObj.searchParams.has('v')) {
            return t('validation.invalidYouTubeUrl');
          }
        } else if (domain === 'youtu.be') {
          if (urlObj.pathname.length <= 1) {
            return t('validation.invalidYouTubeUrl');
          }
        }
        return ''; // Valid
      } else {
        // For unknown domains, assume they might be supported by yt-dlp
        return ''; // Let server handle validation
      }
    } catch {
      return t('validation.invalidUrl');
    }
  };

  const handleSubmit = () => {
    const trimmedUrl = youtubeUrl.trim();
    if (!trimmedUrl) {
      setValidationError(t('validation.enterVideoUrl'));
      return;
    }
    
    const error = validateVideoUrl(trimmedUrl);
    if (error) {
      setValidationError(error);
      return;
    }
    
    onYoutubeSubmit(trimmedUrl, sourceLang, targetLang, autoCreateVideo, whisperModel, translationService);
  };

  const handleQuickDownload = () => {
    const trimmedUrl = youtubeUrl.trim();
    if (!trimmedUrl) {
      setValidationError(t('validation.enterVideoUrl'));
      return;
    }
    
    const error = validateVideoUrl(trimmedUrl);
    if (error) {
      setValidationError(error);
      return;
    }
    
    onQuickDownload(trimmedUrl);
  };

  return (
    <div className="youtube-section">
      <div className="youtube-input-group">
        <div className="relative">
          <input
            type="text"
            className={`youtube-input transition-all duration-300 ${
              validationError 
                ? 'border-red-500 border-2 bg-red-50 focus:border-red-600 focus:ring-red-200' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
            }`}
            placeholder={t('youtube.urlPlaceholder')}
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            disabled={isProcessing}
            dir="ltr"
          />
          {isValidating && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        
        {validationError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fadeIn" dir="rtl">
            <div className="flex items-start gap-2">
              {/* eslint-disable-next-line i18next/no-literal-string */}
              <span className="text-red-500 mt-0.5">⚠️</span>
              <span>{validationError}</span>
            </div>
          </div>
        )}
        
        <div className="youtube-buttons mt-4">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !youtubeUrl.trim() || !!validationError}
            className="youtube-btn youtube-btn-process disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>{t('buttons.processing')}</span>
              </div>
            ) : (
              <>📥 {t('buttons.processButton')}</>
            )}
          </button>
          <button
            onClick={handleQuickDownload}
            disabled={isProcessing || !youtubeUrl.trim() || !!validationError}
            className="youtube-btn youtube-btn-download disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            🎬 {t('buttons.downloadOnly')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YoutubeForm;