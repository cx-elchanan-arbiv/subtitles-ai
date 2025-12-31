import { useState, useRef } from 'react';
import { useTranslation } from '../i18n/TranslationContext';

interface VideoCutterFormProps {
  onSubmit: (file: File, startTime: string, endTime: string) => void;
  isProcessing: boolean;
}

const VideoCutterForm: React.FC<VideoCutterFormProps> = ({
  onSubmit,
  isProcessing
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:01:00');
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

  // Convert time string (HH:MM:SS or MM:SS) to seconds
  const timeToSeconds = (time: string): number => {
    const parts = time.split(':').map(p => parseInt(p, 10));
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  // Calculate duration between start and end time
  const calculateDuration = (): string => {
    const start = timeToSeconds(startTime);
    const end = timeToSeconds(endTime);
    const duration = end - start;

    if (duration <= 0) return '0s';

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Quick preset buttons
  const applyPreset = (preset: string) => {
    setStartTime('00:00:00');
    switch (preset) {
      case '1min':
        setEndTime('00:01:00');
        break;
      case '3min':
        setEndTime('00:03:00');
        break;
      case '5min':
        setEndTime('00:05:00');
        break;
      case '10min':
        setEndTime('00:10:00');
        break;
      case '30min':
        setEndTime('00:30:00');
        break;
      case '1hour':
        setEndTime('01:00:00');
        break;
    }
    setErrorMessage('');
  };

  const handleSubmit = () => {
    setErrorMessage('');

    if (!selectedFile) {
      setErrorMessage(t('videoCutter.errorNoFile'));
      return;
    }

    const start = timeToSeconds(startTime);
    const end = timeToSeconds(endTime);

    if (end <= start) {
      setErrorMessage(t('videoCutter.errorEndTime'));
      return;
    }

    const duration = end - start;
    if (duration > 14400) { // 4 hours
      setErrorMessage(t('videoCutter.errorMaxDuration'));
      return;
    }

    onSubmit(selectedFile, startTime, endTime);
  };

  return (
    <div className="video-cutter-form">
      {/* Upload Video File */}
      <div className="watermark-section">
        <h4>📹 {t('videoCutter.uploadVideo')}</h4>

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

      {/* Time Inputs */}
      <div className="watermark-section">
        <h4>⏱️ {t('videoCutter.cutTimeRange')}</h4>

        <div className="time-inputs">
          <div className="time-input-group">
            <label>{t('videoCutter.startTime')}</label>
            <input
              type="text"
              className="time-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="00:00:00"
              disabled={isProcessing}
            />
          </div>

          <div className="time-input-group">
            <label>{t('videoCutter.endTime')}</label>
            <input
              type="text"
              className="time-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="00:01:00"
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="duration-preview">
          <strong>{t('videoCutter.duration')}</strong> {calculateDuration()}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="watermark-section">
        <h4>⚡ {t('videoCutter.quickPresets')}</h4>
        <div className="preset-buttons">
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('1min')}
            disabled={isProcessing}
          >
            {t('videoCutter.first1min')}
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('3min')}
            disabled={isProcessing}
          >
            {t('videoCutter.first3min')}
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('5min')}
            disabled={isProcessing}
          >
            {t('videoCutter.first5min')}
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('10min')}
            disabled={isProcessing}
          >
            {t('videoCutter.first10min')}
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('30min')}
            disabled={isProcessing}
          >
            {t('videoCutter.first30min')}
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('1hour')}
            disabled={isProcessing}
          >
            {t('videoCutter.first1hour')}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="cutter-info">
        <h4>✨ {t('videoCutter.infoTitle')}</h4>
        <ul>
          <li><strong>{t('videoCutter.infoFormat')}</strong></li>
          <li><strong>{t('videoCutter.infoExample')}</strong></li>
          <li><strong>{t('videoCutter.infoPrecision')}</strong></li>
          <li><strong>{t('videoCutter.infoSpeed')}</strong></li>
          <li><strong>{t('videoCutter.infoLimit')}</strong></li>
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
          <>✂️ {t('videoCutter.cutButton')}</>
        )}
      </button>
    </div>
  );
};

export default VideoCutterForm;
