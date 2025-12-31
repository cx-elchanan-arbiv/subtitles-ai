import React from 'react';
import { VideoMetadata, UserChoices } from '../hooks/useApi';
import { useTranslation } from '../i18n/TranslationContext';

interface VideoInfoDisplayProps {
  videoMetadata?: VideoMetadata;
  userChoices?: UserChoices;
}

const VideoInfoDisplay: React.FC<VideoInfoDisplayProps> = ({ videoMetadata, userChoices }) => {
  const { t } = useTranslation();
  if (!videoMetadata && !userChoices) {
    return null;
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return bytes + ' B';
  };

  const getLanguageName = (code: string): string => {
    const languages: { [key: string]: string } = {
      'auto': 'זיהוי אוטומטי',
      'he': 'עברית',
      'en': 'אנגלית',
      'ar': 'ערבית',
      'es': 'ספרדית',
      'fr': 'צרפתית',
      'de': 'גרמנית',
      'ru': 'רוסית',
      'ja': 'יפנית',
      'ko': 'קוריאנית',
      'zh': 'סינית'
    };
    return languages[code] || code;
  };

  const getModelName = (model: string): string => {
    const models: { [key: string]: string } = {
      'tiny': 'זעיר (מהיר)',
      'base': 'בסיסי (מאוזן)',
      'small': 'קטן (טוב)',
      'medium': 'בינוני (טוב מאוד)',
      'large': 'גדול (מעולה)',
      'large-v2': 'גדול v2 (הטוב ביותר)',
      'large-v3': 'גדול v3 (הטוב ביותר)'
    };
    return models[model] || model;
  };

  return (
    <div className="video-info-display" style={{
      backgroundColor: '#f8f9fa',
      border: '1px solid #e9ecef',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      direction: 'rtl'
    }}>
      {videoMetadata && (
        <div className="video-metadata" style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#495057', fontSize: '18px' }}>
            📺 {t('videoInfo.title')}
          </h3>
          
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {videoMetadata.thumbnail && (
              <img 
                src={videoMetadata.thumbnail} 
                alt="תמונה מקדימה"
                style={{
                  width: '120px',
                  height: '90px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}
              />
            )}
            
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>{t('videoInfo.videoTitle')}</strong> {videoMetadata.title}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', fontSize: '14px' }}>
                <div><strong>{t('videoInfo.duration')}</strong> {videoMetadata.duration_string}</div>
                <div><strong>{t('videoInfo.views')}</strong> {formatNumber(videoMetadata.view_count)}</div>
                <div><strong>{t('videoInfo.creator')}</strong> {videoMetadata.uploader}</div>
                <div><strong>{t('videoInfo.resolution')}</strong> {videoMetadata.width}×{videoMetadata.height}</div>
                {videoMetadata.fps > 0 && (
                  <div><strong>{t('videoInfo.fps')}</strong> {videoMetadata.fps}</div>
                )}
                {videoMetadata.filesize > 0 && (
                  <div><strong>{t('videoInfo.fileSize')}</strong> {formatFileSize(videoMetadata.filesize)}</div>
                )}
              </div>
              
              {videoMetadata.description && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#6c757d' }}>
                  <strong>{t('videoInfo.description')}</strong> {videoMetadata.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {userChoices && (
        <div className="user-choices">
          <h3 style={{ margin: '0 0 12px 0', color: '#495057', fontSize: '18px' }}>
            ⚙️ {t('videoInfo.yourChoices')}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', fontSize: '14px' }}>
            <div style={{ padding: '8px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
              <strong>{t('videoInfo.sourceLanguage')}</strong><br />
              {getLanguageName(userChoices.source_lang)}
            </div>
            
            <div style={{ padding: '8px', backgroundColor: '#fff2e7', borderRadius: '4px' }}>
              <strong>{t('videoInfo.targetLanguage')}</strong><br />
              {getLanguageName(userChoices.target_lang)}
            </div>
            
            <div style={{ padding: '8px', backgroundColor: '#e7ffe7', borderRadius: '4px' }}>
              <strong>{t('videoInfo.transcriptionModel')}</strong><br />
              {getModelName(userChoices.whisper_model)}
            </div>
            
            <div style={{ padding: '8px', backgroundColor: userChoices.auto_create_video ? '#ffe7e7' : '#f0f0f0', borderRadius: '4px' }}>
              <strong>{t('videoInfo.videoCreation')}</strong><br />
              {userChoices.auto_create_video ? `✅ ${t('actions.yes')}` : `❌ ${t('actions.no')}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoInfoDisplay;
