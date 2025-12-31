import { useState, useRef } from 'react';
import { useTranslation } from '../i18n/TranslationContext';

interface LogoOnlyFormProps {
  onSubmit: (videoFile: File, logoFile: File, position: string, size: string, opacity: number) => void;
  isProcessing: boolean;
}

const LogoOnlyForm: React.FC<LogoOnlyFormProps> = ({
  onSubmit,
  isProcessing
}) => {
  const { t } = useTranslation();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [videoDragOver, setVideoDragOver] = useState(false);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [position, setPosition] = useState<string>('top-right');
  const [size, setSize] = useState<string>('medium');
  const [opacity, setOpacity] = useState<number>(40);

  // Video handlers
  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setVideoDragOver(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setVideoDragOver(false);
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setVideoDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setSelectedVideoFile(file);
      }
    }
  };

  const handleVideoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedVideoFile(files[0]);
    }
  };

  // Logo handlers
  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setLogoDragOver(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setLogoDragOver(false);
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setLogoDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setSelectedLogoFile(file);
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleLogoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedLogoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (selectedVideoFile && selectedLogoFile) {
      onSubmit(selectedVideoFile, selectedLogoFile, position, size, opacity);
    }
  };

  return (
    <div className="logo-only-form">
      {/* Two columns layout */}
      <div className="upload-columns">
        {/* Column 1: Upload Video File */}
        <div className="watermark-section upload-column">
          <h4>🎬 {t('logoOnly.uploadVideo')}</h4>

          {!selectedVideoFile ? (
            <div
              className={`logo-upload-area ${videoDragOver ? 'drag-over' : ''}`}
              onDragOver={handleVideoDragOver}
              onDragLeave={handleVideoDragLeave}
              onDrop={handleVideoDrop}
              onClick={() => videoInputRef.current?.click()}
            >
              <div className="upload-icon">🎬</div>
              <p className="upload-text">{t('logoOnly.dragVideo')}</p>
              <p className="upload-hint">{t('logoOnly.videoFormats')}</p>
            </div>
          ) : (
            <div className="logo-preview">
              <div className="selected-file-info">
                <span className="file-icon">🎬</span>
                <span className="file-name">{selectedVideoFile.name}</span>
              </div>
              <div className="logo-actions">
                <button
                  type="button"
                  className="btn-change-logo"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {t('logoOnly.change')}
                </button>
                <button
                  type="button"
                  className="btn-remove-logo"
                  onClick={() => setSelectedVideoFile(null)}
                  disabled={isProcessing}
                >
                  {t('logoOnly.remove')}
                </button>
              </div>
            </div>
          )}

          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoInput}
            style={{ display: 'none' }}
          />
        </div>

        {/* Column 2: Upload Logo File */}
        <div className="watermark-section upload-column">
          <h4>🖼️ {t('logoOnly.uploadLogo')}</h4>

          {!selectedLogoFile ? (
            <div
              className={`logo-upload-area ${logoDragOver ? 'drag-over' : ''}`}
              onDragOver={handleLogoDragOver}
              onDragLeave={handleLogoDragLeave}
              onDrop={handleLogoDrop}
              onClick={() => logoInputRef.current?.click()}
            >
              <div className="upload-icon">📷</div>
              <p className="upload-text">{t('logoOnly.dragLogo')}</p>
              <p className="upload-hint">{t('logoOnly.logoFormats')}</p>
            </div>
          ) : (
            <div className="logo-preview">
              {logoPreview && (
                <img src={logoPreview} alt="Logo preview" className="logo-preview-img" />
              )}
              <div className="selected-file-info">
                <span className="file-icon">🖼️</span>
                <span className="file-name">{selectedLogoFile.name}</span>
              </div>
              <div className="logo-actions">
                <button
                  type="button"
                  className="btn-change-logo"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {t('logoOnly.change')}
                </button>
                <button
                  type="button"
                  className="btn-remove-logo"
                  onClick={() => {
                    setSelectedLogoFile(null);
                    setLogoPreview('');
                  }}
                  disabled={isProcessing}
                >
                  {t('logoOnly.remove')}
                </button>
              </div>
            </div>
          )}

          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoInput}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Logo Position */}
      <div className="watermark-section">
        <h4>{t('watermark.position')}</h4>
        <div className="position-grid">
          <button
            type="button"
            className={`position-btn ${position === 'top-left' ? 'active' : ''}`}
            onClick={() => setPosition('top-left')}
            disabled={isProcessing}
          >
            <div className="position-preview top-left">
              <div className="corner-indicator"></div>
            </div>
            <span>{t('watermark.positions.topLeft')}</span>
          </button>

          <button
            type="button"
            className={`position-btn ${position === 'top-right' ? 'active' : ''}`}
            onClick={() => setPosition('top-right')}
            disabled={isProcessing}
          >
            <div className="position-preview top-right">
              <div className="corner-indicator"></div>
            </div>
            <span>{t('watermark.positions.topRight')}</span>
          </button>

          <button
            type="button"
            className={`position-btn ${position === 'bottom-left' ? 'active' : ''}`}
            onClick={() => setPosition('bottom-left')}
            disabled={isProcessing}
          >
            <div className="position-preview bottom-left">
              <div className="corner-indicator"></div>
            </div>
            <span>{t('watermark.positions.bottomLeft')}</span>
          </button>

          <button
            type="button"
            className={`position-btn ${position === 'bottom-right' ? 'active' : ''}`}
            onClick={() => setPosition('bottom-right')}
            disabled={isProcessing}
          >
            <div className="position-preview bottom-right">
              <div className="corner-indicator"></div>
            </div>
            <span>{t('watermark.positions.bottomRight')}</span>
          </button>
        </div>
      </div>

      {/* Logo Size */}
      <div className="watermark-section">
        <h4>{t('watermark.size')}</h4>
        <div className="size-options">
          {(['small', 'medium', 'large'] as const).map(sizeOption => (
            <label key={sizeOption} className="size-option">
              <input
                type="radio"
                name="logo-size"
                value={sizeOption}
                checked={size === sizeOption}
                onChange={() => setSize(sizeOption)}
                disabled={isProcessing}
              />
              <span className="size-label">
                {t(`watermark.sizes.${sizeOption}`)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Logo Opacity */}
      <div className="watermark-section">
        <h4>{t('watermark.opacity')}</h4>
        <div className="opacity-control">
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            className="opacity-slider"
            disabled={isProcessing}
          />
          <div className="opacity-value">
            {opacity}%
          </div>
        </div>
        <div className="opacity-labels">
          <span className="opacity-label-min">{t('watermark.opacityTransparent')}</span>
          <span className="opacity-label-max">{t('watermark.opacityOpaque')}</span>
        </div>
      </div>

      {/* Logo Settings Info */}
      <div className="logo-settings-info">
        <h4>✨ {t('logoOnly.logoSettings')}</h4>
        <ul>
          <li><strong>{t('logoOnly.position')}:</strong> {position}</li>
          <li><strong>{t('logoOnly.size')}:</strong> {size}</li>
          <li><strong>{t('logoOnly.opacity')}:</strong> {opacity}%</li>
          <li><strong>{t('logoOnly.recommendedFormat')}:</strong> {t('logoOnly.transparentPng')}</li>
        </ul>
      </div>

      {/* Submit Button */}
      <button
        type="button"
        className="btn-add-logo"
        onClick={handleSubmit}
        disabled={!selectedVideoFile || !selectedLogoFile || isProcessing}
      >
        {isProcessing ? (
          <>⏳ {t('logoOnly.processing')}</>
        ) : (
          <>🎬 {t('logoOnly.addLogoButton')}</>
        )}
      </button>

      {/* Help text */}
      {(!selectedVideoFile || !selectedLogoFile) && (
        <p className="help-text" style={{ textAlign: 'center', marginTop: '10px', color: '#666' }}>
          {!selectedVideoFile && !selectedLogoFile && '📌 ' + t('logoOnly.uploadBothFiles')}
          {selectedVideoFile && !selectedLogoFile && '📌 ' + t('logoOnly.uploadLogoFile')}
          {!selectedVideoFile && selectedLogoFile && '📌 ' + t('logoOnly.uploadVideoFile')}
        </p>
      )}
    </div>
  );
};

export default LogoOnlyForm;
