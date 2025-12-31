import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useI18n } from './I18nProvider';
import { SUPPORTED_LANGUAGES } from './config';

// Backward compatibility interface
export interface Translation {
  // App
  appTitle: string;
  appSubtitle: string;
  
  // Navigation
  uploadTab: string;
  youtubeTab: string;
  signIn: string;
  signOut: string;
  
  // Language Selection
  sourceLanguage: string;
  targetLanguage: string;
  autoDetect: string;
  
  // Upload Section
  uploadTitle: string;
  uploadHint: string;
  supportedFormats: string;
  
  // Video URL Section
  youtubeUrl: string;
  processButton: string;
  
  // Options
  autoCreateVideo: string;
  whisperModel: string;
  modelTiny: string;
  modelMedium: string;
  modelLarge: string;
  modelHint: string;
  
  // Results
  successTitle: string;
  detectedLanguage: string;
  downloadOriginal: string;
  downloadTranslated: string;
  downloadVideo: string;
  videoReady: string;
  totalTime: string;
  transcribe_video: string;
  translate_segments: string;
  create_video_with_subtitles: string;
  add_watermark: string;
  
  // Authentication
  signInRequired: string;
  signInToUseFeatures: string;
  signInWithGoogle: string;
  signInWithApple: string;
  user: string;
  
  // Watermark
  watermarkEnabled: string;
  watermarkLogo: string;
  uploadLogoText: string;
  uploadLogoHint: string;
  changeLogo: string;
  removeLogo: string;
  watermarkSize: string;
  watermarkSmall: string;
  watermarkMedium: string;
  watermarkLarge: string;
  watermarkPosition: string;
  watermarkTopLeft: string;
  watermarkTopRight: string;
  watermarkBottomLeft: string;
  watermarkBottomRight: string;
  watermarkPreview: string;
  videoPreview: string;
  
  // Progress
  processing: string;
  transcribing: string;
  translating: string;
  creatingVideo: string;
  
  // Progress Card Titles
  processingFileTitle: string;
  processingYouTubeFullTitle: string;
  processingYouTubeDownloadTitle: string;
  processingError: string;
  startingProcess: string;
  progress_display: {
    overall_progress: string;
    show_logs: string;
    hide_logs: string;
  };
  steps: {
    [key: string]: string;
  };
  
  // Languages
  languages: {
    [key: string]: string;
  };
  
  // Loading states
  loading?: {
    dataLoading?: string;
  };
  
  // File info
  fileInfo?: {
    fileSizeLabel?: string;
    downloadHint?: string;
    megabytes?: string;
  };
  
  // Video info
  videoInfo?: {
    title?: string;
    videoTitle?: string;
    duration?: string;
    views?: string;
    creator?: string;
    resolution?: string;
    fps?: string;
    fileSize?: string;
    description?: string;
    yourChoices?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    transcriptionModel?: string;
    videoCreation?: string;
  };
}

export type SupportedLanguage = 'he' | 'en' | 'es' | 'ar';

interface TranslationContextType {
  t: Translation & ((key: string, options?: any) => string);
  currentLanguage: SupportedLanguage;
  language: SupportedLanguage;
  changeLanguage: (lang: SupportedLanguage) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  isRTL: boolean;
  supportedLanguages: readonly { code: SupportedLanguage; name: string; flag: string }[];
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

interface TranslationProviderProps {
  children: ReactNode;
}

// Backward compatibility translations mapping
const createTranslationFromI18next = (t: any): Translation => ({
  appTitle: t('common:app.title', 'SubsTranslator'),
  appSubtitle: t('common:app.subtitle', 'AI-Powered Video Subtitle Translation'),
  
  uploadTab: t('common:tabs.upload', 'File Upload'),
  youtubeTab: t('common:tabs.youtube', 'Online Video'),
  signIn: t('common:auth.signIn', 'Sign In'),
  signOut: t('common:auth.signOut', 'Sign Out'),
  
  sourceLanguage: t('common:language.source', 'Source Language'),
  targetLanguage: t('common:language.target', 'Target Language'),
  autoDetect: t('common:language.autoDetect', 'Auto Detect'),
  
  uploadTitle: t('common:upload.title', 'Click to upload video or audio file'),
  uploadHint: t('common:upload.dragDrop', 'Drag and drop a file here'),
  supportedFormats: t('common:upload.supportedFormats', 'Supports MP4, MKV, MOV, WebM, AVI, MP3, WAV and more'),
  
  youtubeUrl: t('common:youtube.urlPlaceholder', 'Video URL (YouTube, Vimeo, TikTok & more)'),
  processButton: t('common:actions.process', 'Process'),
  
  autoCreateVideo: t('common:options.autoCreateVideo', 'Create video with burned-in subtitles'),
  whisperModel: t('common:options.whisperModel', 'Transcription Model'),
  modelTiny: t('common:models.tiny', 'Tiny - Fastest (Default)'),
  modelMedium: t('common:models.medium', 'Medium - Fast, Good Accuracy'),
  modelLarge: t('common:models.large', 'Large - Most Accurate'),
  modelHint: t('common:models.hint', 'Large: Excellent quality, longer time • Medium: Good quality, short time • Tiny: Fastest, less accurate'),
  
  successTitle: t('common:results.title', 'Processing Complete!'),
  detectedLanguage: t('common:results.detectedLanguage', 'Detected Language'),
  downloadOriginal: t('common:results.downloadOriginal', 'Download Original Subtitles'),
  downloadTranslated: t('common:results.downloadTranslated', 'Download Translated Subtitles'),
  downloadVideo: t('common:results.downloadVideo', 'Watch the Complete Creation'),
  videoReady: t('common:results.videoReady', 'Video with subtitles prepared automatically!'),
  totalTime: t('common:results.totalTime', 'Total Time'),
  transcribe_video: t('common:steps.transcription', 'Transcription'),
  translate_segments: t('common:steps.translation', 'Translation'),
  create_video_with_subtitles: t('common:steps.videoCreation', 'Video Creation'),
  add_watermark: t('common:steps.watermarkAddition', 'Adding Watermark'),
  
  signInRequired: t('common:auth.signInRequired', 'Sign in required'),
  signInToUseFeatures: t('common:auth.signInToUse', 'Please sign in to use this feature'),
  signInWithGoogle: t('common:auth.signInWithGoogle', 'Sign in with Google'),
  signInWithApple: t('common:auth.signInWithApple', 'Sign in with Apple'),
  user: t('common:auth.user', 'User'),
  
  watermarkEnabled: t('common:watermark.enabled', 'Add watermark to video'),
  watermarkLogo: t('common:watermark.logo', 'Choose logo image'),
  uploadLogoText: t('common:watermark.uploadText', 'Click or drag image here'),
  uploadLogoHint: t('common:watermark.uploadHint', 'PNG, JPG, GIF up to 5MB'),
  changeLogo: t('common:watermark.change', 'Change image'),
  removeLogo: t('common:watermark.remove', 'Remove image'),
  watermarkSize: t('common:watermark.size', 'Logo size'),
  watermarkSmall: t('common:watermark.sizes.small', 'Small'),
  watermarkMedium: t('common:watermark.sizes.medium', 'Medium'),
  watermarkLarge: t('common:watermark.sizes.large', 'Large'),
  watermarkPosition: t('common:watermark.position', 'Logo position'),
  watermarkTopLeft: t('common:watermark.positions.topLeft', 'Top Left'),
  watermarkTopRight: t('common:watermark.positions.topRight', 'Top Right'),
  watermarkBottomLeft: t('common:watermark.positions.bottomLeft', 'Bottom Left'),
  watermarkBottomRight: t('common:watermark.positions.bottomRight', 'Bottom Right'),
  watermarkPreview: t('common:watermark.preview', 'Preview'),
  videoPreview: t('common:watermark.preview', 'Video Sample'),
  
  processing: t('common:status.processing', 'Processing...'),
  transcribing: t('common:steps.transcription', 'Transcription'),
  translating: t('common:steps.translation', 'Translation'),
  creatingVideo: t('common:steps.videoCreation', 'Creating Video'),
  
  processingFileTitle: t('common:processing.title', 'Processing Your Video'),
  processingYouTubeFullTitle: t('common:processing.title', 'Processing Your Video'),
  processingYouTubeDownloadTitle: t('common:processing.title', 'Processing Your Video'),
  processingError: t('errors:generic.title', 'Processing Error'),
  startingProcess: t('common:status.processing', 'Processing...'),
  progress_display: {
    overall_progress: t('common:processing.overallProgress', 'Overall Progress'),
    show_logs: t('common:processing.showLogs', 'Show Logs'),
    hide_logs: t('common:processing.hideLogs', 'Hide Logs'),
  },
  steps: {
    uploading: t('common:steps.uploading', 'Uploading Video'),
    downloading: t('common:steps.downloading', 'Downloading Video'),
    audioProcessing: t('common:steps.audioProcessing', 'Audio Processing'),
    modelLoading: t('common:steps.modelLoading', 'Loading AI Model'),
    transcription: t('common:steps.transcription', 'Transcription'),
    translation: t('common:steps.translation', 'Translation'),
    srtCreation: t('common:steps.srtCreation', 'Creating SRT Files'),
    videoCreation: t('common:steps.videoCreation', 'Creating Video'),
    watermarkAddition: t('common:steps.watermarkAddition', 'Adding Watermark'),
    finalizing: t('common:steps.finalizing', 'Finalizing'),
  },
  
  languages: {
    auto: t('common:languages.auto', 'Auto Detect'),
    he: t('common:languages.he', 'Hebrew'),
    en: t('common:languages.en', 'English'),
    es: t('common:languages.es', 'Spanish'),
    ar: t('common:languages.ar', 'Arabic'),
    fr: t('common:languages.fr', 'French'),
    de: t('common:languages.de', 'German'),
    it: t('common:languages.it', 'Italian'),
    pt: t('common:languages.pt', 'Portuguese'),
    ru: t('common:languages.ru', 'Russian'),
    ja: t('common:languages.ja', 'Japanese'),
    ko: t('common:languages.ko', 'Korean'),
    zh: t('common:languages.zh', 'Chinese'),
    tr: t('common:languages.tr', 'Turkish'),
  },
  
  loading: {
    dataLoading: t('common:loading.dataLoading', 'Loading data'),
  },
  
  fileInfo: {
    fileSizeLabel: t('common:fileInfo.fileSizeLabel', 'File size:'),
    downloadHint: t('common:fileInfo.downloadHint', 'The file will be saved to your downloads folder'),
    megabytes: t('common:fileInfo.megabytes', 'MB'),
  },
  
  videoInfo: {
    title: t('common:videoInfo.title', 'Video Information'),
    videoTitle: t('common:videoInfo.videoTitle', 'Title:'),
    duration: t('common:videoInfo.duration', 'Duration:'),
    views: t('common:videoInfo.views', 'Views:'),
    creator: t('common:videoInfo.creator', 'Creator:'),
    resolution: t('common:videoInfo.resolution', 'Resolution:'),
    fps: t('common:videoInfo.fps', 'FPS:'),
    fileSize: t('common:videoInfo.fileSize', 'File size:'),
    description: t('common:videoInfo.description', 'Description:'),
    yourChoices: t('common:videoInfo.yourChoices', 'Your Settings'),
    sourceLanguage: t('common:videoInfo.sourceLanguage', 'Source language:'),
    targetLanguage: t('common:videoInfo.targetLanguage', 'Target language:'),
    transcriptionModel: t('common:videoInfo.transcriptionModel', 'Transcription model:'),
    videoCreation: t('common:videoInfo.videoCreation', 'Video creation:'),
  }
});

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { language, changeLanguage: i18nChangeLanguage } = useI18n();
  const { t: i18nT } = useI18nextTranslation(['common', 'errors', 'forms', 'pages']);
  const [translation, setTranslation] = useState<Translation>(() => createTranslationFromI18next(i18nT));

  useEffect(() => {
    setTranslation(createTranslationFromI18next(i18nT));
  }, [i18nT, language]);

  // Create a callable translation function that also has object properties
  const createCallableTranslation = (translation: Translation, i18nT: any) => {
    const fn = (key: string, options?: any) => i18nT(key, options);
    return Object.assign(fn, translation);
  };

  const value: TranslationContextType = {
    t: createCallableTranslation(translation, i18nT),
    currentLanguage: String(language) as SupportedLanguage,
    language: String(language) as SupportedLanguage,
    changeLanguage: i18nChangeLanguage,
    setLanguage: i18nChangeLanguage,
    isRTL: String(language) === 'he' || String(language) === 'ar',
    supportedLanguages: Object.values(SUPPORTED_LANGUAGES).map((lang: any) => ({
      code: lang.code as SupportedLanguage,
      name: lang.nativeName,
      flag: lang.flag
    })) as readonly { code: SupportedLanguage; name: string; flag: string }[]
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
