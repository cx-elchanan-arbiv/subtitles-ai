import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/TranslationContext';
import type { WatermarkConfig } from '../types';
import {
  loadUserPreferences,
  updateWatermarkPreferences,
  saveLogoFile,
  loadLogoFile,
  removeLogoFile
} from '../utils/userPreferences';

interface WatermarkSettingsProps {
  config: WatermarkConfig;
  onChange: (config: WatermarkConfig) => void;
  disabled?: boolean;
}

const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(config.isCollapsed ?? false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const preferences = loadUserPreferences();
        const savedLogoUrl = loadLogoFile();

        // Only update if this is the initial load and we have saved preferences
        if (!isInitialized && (preferences.watermark.enabled || savedLogoUrl)) {
          const updatedConfig = {
            ...config,
            enabled: preferences.watermark.enabled,
            position: preferences.watermark.position,
            size: preferences.watermark.size,
            opacity: preferences.watermark.opacity ?? 40, // Default 40%
            logoUrl: savedLogoUrl || config.logoUrl,
            isCollapsed: preferences.watermark.isCollapsed ?? false
          };

          setIsCollapsed(updatedConfig.isCollapsed);
          onChange(updatedConfig);
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load watermark preferences:', error);
        setIsInitialized(true);
      }
    };

    loadPreferences();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save preferences whenever config changes (but only after initialization)
  useEffect(() => {
    if (isInitialized) {
      updateWatermarkPreferences({
        enabled: config.enabled,
        position: config.position,
        size: config.size,
        opacity: config.opacity,
        isCollapsed: isCollapsed
      });
    }
  }, [config.enabled, config.position, config.size, config.opacity, isCollapsed, isInitialized]);

  const handleToggle = () => {
    const newEnabled = !config.enabled;
    
    // Auto-expand when enabling, auto-collapse when disabling
    setIsCollapsed(!newEnabled);
    
    onChange({
      ...config,
      enabled: newEnabled
    });
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleFileSelect = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        // Save file to localStorage and get data URL
        const dataUrl = await saveLogoFile(file);
        
        onChange({
          ...config,
          logoFile: file,
          logoUrl: dataUrl
        });
      } catch (error) {
        console.error('Failed to save logo file:', error);
        // Fallback to object URL
        const imageUrl = URL.createObjectURL(file);
        onChange({
          ...config,
          logoFile: file,
          logoUrl: imageUrl
        });
      }
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    onChange({
      ...config,
      size
    });
  };

  const handlePositionChange = (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
    onChange({
      ...config,
      position
    });
  };

  const handleOpacityChange = (opacity: number) => {
    onChange({
      ...config,
      opacity
    });
  };

  const removeImage = async () => {
    if (config.logoUrl) {
      URL.revokeObjectURL(config.logoUrl);
    }
    
    // Remove from localStorage as well
    removeLogoFile();
    
    // Clear from server session as well
    try {
      const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';
      await fetch(`${apiBaseUrl}/clear-watermark-logo`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.warn('Failed to clear watermark logo from server:', error);
    }
    
    onChange({
      ...config,
      logoFile: null,
      logoUrl: ''
    });
  };

  return (
    <div className="watermark-settings">
      {/* כותרת ומתג הפעלה/ביטול */}
      <div className="watermark-header">
        <div className="watermark-header-content">
          <label className="watermark-toggle">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={handleToggle}
              disabled={disabled}
            />
            <span className="watermark-toggle-text">
              {t('watermark.enabled')}
            </span>
          </label>
          
          {/* כפתור קיפול/פתיחה */}
          {config.enabled && (
            <button
              type="button"
              className={`collapse-toggle ${isCollapsed ? 'collapsed' : 'expanded'}`}
              onClick={toggleCollapse}
              disabled={disabled}
              title={isCollapsed ? t('watermark.expand') : t('watermark.collapse')}
            >
              <span className="collapse-icon">
                {isCollapsed ? '▼' : '▲'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* אפשרויות מתקדמות - מוצגות רק אם מופעל ולא מקופל */}
      {config.enabled && !isCollapsed && (
        <div className="watermark-options">
          
          {/* העלאת תמונת לוגו */}
          <div className="watermark-section">
            <h4>{t('watermark.logo')}</h4>
            
            {!config.logoUrl ? (
              <div 
                className={`logo-upload-area ${dragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">📷</div>
                <p className="upload-text">
                  {t('watermark.uploadText')}
                </p>
                <p className="upload-hint">
                  {t('watermark.uploadHint')}
                </p>
              </div>
            ) : (
              <div className="logo-preview">
                <img src={config.logoUrl} alt="Logo preview" />
                <div className="logo-actions">
                  <button 
                    type="button"
                    className="btn-change-logo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t('watermark.change')}
                  </button>
                  <button 
                    type="button"
                    className="btn-remove-logo"
                    onClick={removeImage}
                  >
                    {t('watermark.remove')}
                  </button>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>

          {/* בחירת גודל */}
          <div className="watermark-section">
            <h4>{t('watermark.size')}</h4>
            <div className="size-options" data-testid="size-options">
              {(['small', 'medium', 'large'] as const).map(size => (
                <label key={size} className="size-option">
                  <input
                    type="radio"
                    name="watermark-size"
                    value={size}
                    checked={config.size === size}
                    onChange={() => handleSizeChange(size)}
                    data-testid={`size-${size}`}
                  />
                  <span className="size-label">
                    {t(`watermark.sizes.${size}`)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* בחירת מיקום */}
          <div className="watermark-section">
            <h4>{t('watermark.position')}</h4>
            <div className="position-grid" data-testid="position-options">
              <button
                type="button"
                className={`position-btn ${config.position === 'top-left' ? 'active' : ''}`}
                onClick={() => handlePositionChange('top-left')}
                data-testid="position-top-left"
              >
                <div className="position-preview top-left">
                  <div className="corner-indicator"></div>
                </div>
                <span>{t('watermark.positions.topLeft')}</span>
              </button>
              
              <button
                type="button"
                className={`position-btn ${config.position === 'top-right' ? 'active' : ''}`}
                onClick={() => handlePositionChange('top-right')}
                data-testid="position-top-right"
              >
                <div className="position-preview top-right">
                  <div className="corner-indicator"></div>
                </div>
                <span>{t('watermark.positions.topRight')}</span>
              </button>
              
              <button
                type="button"
                className={`position-btn ${config.position === 'bottom-left' ? 'active' : ''}`}
                onClick={() => handlePositionChange('bottom-left')}
                data-testid="position-bottom-left"
              >
                <div className="position-preview bottom-left">
                  <div className="corner-indicator"></div>
                </div>
                <span>{t('watermark.positions.bottomLeft')}</span>
              </button>
              
              <button
                type="button"
                className={`position-btn ${config.position === 'bottom-right' ? 'active' : ''}`}
                onClick={() => handlePositionChange('bottom-right')}
                data-testid="position-bottom-right"
              >
                <div className="position-preview bottom-right">
                  <div className="corner-indicator"></div>
                </div>
                <span>{t('watermark.positions.bottomRight')}</span>
              </button>
            </div>
          </div>

          {/* שקיפות */}
          <div className="watermark-section">
            <h4>{t('watermark.opacity')}</h4>
            <div className="opacity-control">
              <input
                type="range"
                min="0"
                max="100"
                value={config.opacity}
                onChange={(e) => handleOpacityChange(Number(e.target.value))}
                className="opacity-slider"
                data-testid="opacity-slider"
              />
              <div className="opacity-value">
                {config.opacity}%
              </div>
            </div>
            <div className="opacity-labels">
              <span className="opacity-label-min">{t('watermark.opacityTransparent')}</span>
              <span className="opacity-label-max">{t('watermark.opacityOpaque')}</span>
            </div>
          </div>

          {/* תצוגה מקדימה */}
          {config.logoUrl && (
            <div className="watermark-section">
              <h4>{t('watermark.preview')}</h4>
              <div className="watermark-demo">
                <div className="demo-video">
                  <div
                    className={`demo-watermark ${config.position} ${config.size}`}
                  >
                    <img
                      src={config.logoUrl}
                      alt="Watermark preview"
                      style={{ opacity: config.opacity / 100 }}
                    />
                  </div>
                  <div className="demo-video-overlay">
                    <span>{t('watermark.videoPreview')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WatermarkSettings;