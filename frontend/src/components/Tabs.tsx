import React from 'react';
import { useTranslation } from '../i18n/TranslationContext';

interface TabsProps {
  activeTab: 'upload' | 'youtube';
  onTabChange: (tab: 'upload' | 'youtube') => void;
  disabled: boolean;
  youtubeEnabled?: boolean;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, disabled, youtubeEnabled = true }) => {
  const { t } = useTranslation();

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
      {youtubeEnabled && (
        <button
          className={`tab ${activeTab === 'youtube' ? 'active' : ''}`}
          onClick={() => onTabChange('youtube')}
          disabled={disabled}
        >
          📺 {t.youtubeTab}
        </button>
      )}
    </div>
  );
};

export default Tabs;
