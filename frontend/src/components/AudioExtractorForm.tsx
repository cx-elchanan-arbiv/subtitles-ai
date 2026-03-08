import { useState, useRef } from 'react';
import { useTranslation } from '../i18n/TranslationContext';

interface AudioExtractorFormProps {
  onSubmit: (file: File, format: string) => void;
  isProcessing: boolean;
}

const AudioExtractorForm: React.FC<AudioExtractorFormProps> = ({
  onSubmit,
  isProcessing
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>('mp3');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setErrorMessage('');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setErrorMessage('');
    }
  };

  const handleSubmit = () => {
    setErrorMessage('');

    if (!selectedFile) {
      setErrorMessage(t('audioExtractor.errorNoFile'));
      return;
    }

    onSubmit(selectedFile, format);
  };

  return (
    <div className="video-cutter-form">
      {/* Upload Video File */}
      <div className="watermark-section">
        <h4>📹 {t('audioExtractor.uploadVideo')}</h4>

        {!selectedFile ? (
          <div
            className={`logo-upload-area ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
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
              <span className="file-name">{selectedFile.name}</span>
            </div>
            <div className="logo-actions">
              <button
                type="button"
                className="btn-change-logo"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                {t('watermark.change')}
              </button>
              <button
                type="button"
                className="btn-remove-logo"
                onClick={() => setSelectedFile(null)}
                disabled={isProcessing}
              >
                {t('watermark.remove')}
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {/* Format Selection */}
      <div className="watermark-section">
        <h4>🎵 {t('audioExtractor.outputFormat')}</h4>
        <div className="preset-buttons">
          <button
            type="button"
            className={`preset-btn ${format === 'mp3' ? 'active' : ''}`}
            onClick={() => setFormat('mp3')}
            disabled={isProcessing}
          >
            MP3
          </button>
          <button
            type="button"
            className={`preset-btn ${format === 'wav' ? 'active' : ''}`}
            onClick={() => setFormat('wav')}
            disabled={isProcessing}
          >
            WAV
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="cutter-info">
        <h4>✨ {t('audioExtractor.infoTitle')}</h4>
        <ul>
          <li><strong>{t('audioExtractor.infoFormats')}</strong></li>
          <li><strong>{t('audioExtractor.infoMp3')}</strong></li>
          <li><strong>{t('audioExtractor.infoWav')}</strong></li>
          <li><strong>{t('audioExtractor.infoSpeed')}</strong></li>
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
        disabled={!selectedFile || isProcessing}
      >
        {isProcessing ? (
          <>⏳ {t('status.processing')}</>
        ) : (
          <>🎵 {t('audioExtractor.extractButton')}</>
        )}
      </button>
    </div>
  );
};

export default AudioExtractorForm;
