import React from 'react';
import { useTranslation } from '../i18n/TranslationContext';

interface TabsProps {
  activeTab: 'upload' | 'youtube';
  onTabChange: (tab: 'upload' | 'youtube') => void;
  disabled: boolean;
  youtubeEnabled?: boolean;
  youtubeRestricted?: boolean;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, disabled, youtubeEnabled = true, youtubeRestricted = false }) => {
  const { t } = useTranslation();

  // YouTube is visible if enabled OR if restricted (show with lock)
  const showYoutubeTab = youtubeEnabled || youtubeRestricted;

  return (
    <div className="tabs">
      <button
        className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
        onClick={() => onTabChange('upload')}
        disabled={disabled}
        data-tab="upload"
      >
        📁 {t.uploadTab}
      </button>
      {showYoutubeTab && (
        <button
          className={`tab ${activeTab === 'youtube' ? 'active' : ''} ${youtubeRestricted ? 'restricted' : ''}`}
          onClick={() => !youtubeRestricted && onTabChange('youtube')}
          disabled={disabled || youtubeRestricted}
          title={youtubeRestricted ? (t('features.youtube_pro_only') || 'Available for PRO users only') : undefined}
          style={youtubeRestricted ? {
            opacity: 0.7,
            cursor: 'not-allowed',
          } : undefined}
        >
          📺 {t.youtubeTab}
          {youtubeRestricted && (
            <span style={{ marginInlineStart: '6px' }}>
              [PRO] 🔒
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default Tabs;
