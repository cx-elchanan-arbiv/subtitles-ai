import { useState, useRef } from 'react';
import { useTranslation } from '../i18n/TranslationContext';
import type { WatermarkConfig } from '../types';

interface EmbedSubtitlesFormProps {
  watermarkConfig: WatermarkConfig;
  onSubmit: (
    videoFile: File,
    subtitlesFile: File | null,
    subtitlesText: string,
    includeLogo: boolean,
    position: string,
    size: string,
    opacity: number
  ) => void;
  isProcessing: boolean;
}

const EmbedSubtitlesForm: React.FC<EmbedSubtitlesFormProps> = ({
  watermarkConfig,
  onSubmit,
  isProcessing
}) => {
  const { t } = useTranslation();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const srtInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedSRT, setSelectedSRT] = useState<File | null>(null);
  const [subtitlesText, setSubtitlesText] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [position, setPosition] = useState(watermarkConfig.position);
  const [size, setSize] = useState(watermarkConfig.size);
  const [opacity, setOpacity] = useState(watermarkConfig.opacity);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setSelectedVideo(file);
        setErrorMessage('');
      }
    }
  };

  const handleVideoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedVideo(files[0]);
      setErrorMessage('');
    }
  };

  const handleSRTInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedSRT(files[0]);
      setErrorMessage('');
    }
  };

  const handleSubmit = () => {
    setErrorMessage('');

    if (!selectedVideo) {
      setErrorMessage(t('embedSubtitles.errorNoVideo'));
      return;
    }

    if (inputMode === 'file' && !selectedSRT) {
      setErrorMessage(t('embedSubtitles.errorNoSRT'));
      return;
    }

    if (inputMode === 'text' && !subtitlesText.trim()) {
      setErrorMessage(t('embedSubtitles.errorNoText'));
      return;
    }

    if (includeLogo && !watermarkConfig.enabled) {
      setErrorMessage(t('embedSubtitles.errorLogoNotEnabled'));
      return;
    }

    onSubmit(
      selectedVideo,
      selectedSRT,
      subtitlesText,
      includeLogo,
      position,
      size,
      opacity
    );
  };

  return (
    <div className="embed-subtitles-form">
      {/* Upload Video File */}
      <div className="watermark-section">
        <h4>📹 {t('embedSubtitles.uploadVideo')}</h4>

        {!selectedVideo ? (
          <div
            className={`logo-upload-area ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleVideoDragOver}
            onDragLeave={handleVideoDragLeave}
            onDrop={handleVideoDrop}
            onClick={() => videoInputRef.current?.click()}
          >
            <div className="upload-icon">🎬</div>
            <p className="upload-text">
              {t('upload.dragDrop')}
            </p>
            <p className="upload-hint">
              {t('upload.supportedFormats')}
            </p>
          </div>
        ) : (
          <div className="logo-preview">
            <div className="selected-file-info">
              <span className="file-icon">🎬</span>
              <span className="file-name">{selectedVideo.name}</span>
            </div>
            <div className="logo-actions">
              <button
                type="button"
                className="btn-change-logo"
                onClick={() => videoInputRef.current?.click()}
                disabled={isProcessing}
              >
                {t('watermark.change')}
              </button>
              <button
                type="button"
                className="btn-remove-logo"
                onClick={() => setSelectedVideo(null)}
                disabled={isProcessing}
              >
                {t('watermark.remove')}
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

      {/* Subtitles Input Mode Toggle */}
      <div className="watermark-section">
        <h4>📝 {t('embedSubtitles.subtitlesInput')}</h4>

        <div className="input-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${inputMode === 'file' ? 'active' : ''}`}
            onClick={() => setInputMode('file')}
            disabled={isProcessing}
          >
            📁 {t('embedSubtitles.uploadSRT')}
          </button>
          <button
            type="button"
            className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
            disabled={isProcessing}
          >
            ✍️ {t('embedSubtitles.pasteText')}
          </button>
        </div>

        {inputMode === 'file' ? (
          <>
            {!selectedSRT ? (
              <div
                className="srt-upload-area"
                onClick={() => srtInputRef.current?.click()}
              >
                <div className="upload-icon">📄</div>
                <p className="upload-text">{t('embedSubtitles.clickUploadSRT')}</p>
                <p className="upload-hint">{t('embedSubtitles.srtFormat')}</p>
              </div>
            ) : (
              <div className="logo-preview">
                <div className="selected-file-info">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{selectedSRT.name}</span>
                </div>
                <div className="logo-actions">
                  <button
                    type="button"
                    className="btn-change-logo"
                    onClick={() => srtInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    {t('watermark.change')}
                  </button>
                  <button
                    type="button"
                    className="btn-remove-logo"
                    onClick={() => setSelectedSRT(null)}
                    disabled={isProcessing}
                  >
                    {t('watermark.remove')}
                  </button>
                </div>
              </div>
            )}

            <input
              ref={srtInputRef}
              type="file"
              accept=".srt"
              onChange={handleSRTInput}
              style={{ display: 'none' }}
            />
          </>
        ) : (
          <textarea
            className="subtitles-textarea"
            placeholder={t('embedSubtitles.textareaPlaceholder')}
            value={subtitlesText}
            onChange={(e) => setSubtitlesText(e.target.value)}
            disabled={isProcessing}
            rows={10}
          />
        )}
      </div>

      {/* Logo Options */}
      {watermarkConfig.enabled && (
        <div className="watermark-section">
          <h4>🎨 {t('embedSubtitles.logoOptions')}</h4>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={includeLogo}
              onChange={(e) => setIncludeLogo(e.target.checked)}
              disabled={isProcessing}
            />
            <span>{t('embedSubtitles.addLogo')}</span>
          </label>

          {includeLogo && (
            <div className="logo-options-compact">
              <div className="logo-option-row">
                <label>{t('embedSubtitles.position')}</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={isProcessing}
                  className="compact-select"
                >
                  <option value="top-left">{t('watermark.positions.topLeft')}</option>
                  <option value="top-right">{t('watermark.positions.topRight')}</option>
                  <option value="bottom-left">{t('watermark.positions.bottomLeft')}</option>
                  <option value="bottom-right">{t('watermark.positions.bottomRight')}</option>
                </select>
              </div>

              <div className="logo-option-row">
                <label>{t('embedSubtitles.size')}</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  disabled={isProcessing}
                  className="compact-select"
                >
                  <option value="small">{t('watermark.sizes.small')}</option>
                  <option value="medium">{t('watermark.sizes.medium')}</option>
                  <option value="large">{t('watermark.sizes.large')}</option>
                </select>
              </div>

              <div className="logo-option-row">
                <label>{t('embedSubtitles.opacity')} {opacity}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  disabled={isProcessing}
                  className="compact-slider"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="embed-info">
        <h4>✨ {t('embedSubtitles.infoTitle')}</h4>
        <ul>
          <li><strong>{t('embedSubtitles.infoSrtFormat')}</strong></li>
          <li><strong>{t('embedSubtitles.infoTextFormat')}</strong></li>
          <li><strong>{t('embedSubtitles.infoProcessing')}</strong></li>
          <li><strong>{t('embedSubtitles.infoLogo')}</strong></li>
          <li><strong>{t('embedSubtitles.infoSpeed')}</strong></li>
        </ul>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="watermark-warning">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        className="btn-add-logo"
        onClick={handleSubmit}
        disabled={!selectedVideo || isProcessing}
      >
        {isProcessing ? (
          <>⏳ {t('status.processing')}</>
        ) : (
          <>📝 {t('embedSubtitles.embedButton')}</>
        )}
      </button>
    </div>
  );
};

export default EmbedSubtitlesForm;
