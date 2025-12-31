import { useState, useRef } from 'react';
import { useTranslation } from '../i18n/TranslationContext';

interface VideoMergerFormProps {
  onSubmit: (video1: File, video2: File) => void;
  isProcessing: boolean;
}

const VideoMergerForm: React.FC<VideoMergerFormProps> = ({
  onSubmit,
  isProcessing
}) => {
  const { t } = useTranslation();
  const video1InputRef = useRef<HTMLInputElement>(null);
  const video2InputRef = useRef<HTMLInputElement>(null);
  const [video1, setVideo1] = useState<File | null>(null);
  const [video2, setVideo2] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleVideo1Input = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setVideo1(files[0]);
      setErrorMessage('');
    }
  };

  const handleVideo2Input = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setVideo2(files[0]);
      setErrorMessage('');
    }
  };

  const handleSwap = () => {
    const temp = video1;
    setVideo1(video2);
    setVideo2(temp);
  };

  const handleSubmit = () => {
    setErrorMessage('');

    if (!video1) {
      setErrorMessage(t('videoMerger.errorNoVideo1'));
      return;
    }

    if (!video2) {
      setErrorMessage(t('videoMerger.errorNoVideo2'));
      return;
    }

    onSubmit(video1, video2);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="video-merger-form">
      {/* Video 1 Upload */}
      <div className="merger-section">
        <h4>🎬 {t('videoMerger.video1Title')}</h4>

        {!video1 ? (
          <div
            className="video-upload-area merger-upload"
            onClick={() => video1InputRef.current?.click()}
          >
            <div className="upload-icon">1️⃣</div>
            <p className="upload-text">{t('videoMerger.uploadFirst')}</p>
            <p className="upload-hint">{t('videoMerger.videoFormats')}</p>
          </div>
        ) : (
          <div className="video-file-info">
            <div className="video-file-details">
              <span className="file-icon">🎬</span>
              <div className="file-text">
                <span className="file-name">{video1.name}</span>
                <span className="file-size">{formatFileSize(video1.size)}</span>
              </div>
            </div>
            <div className="file-actions">
              <button
                type="button"
                className="btn-change-file"
                onClick={() => video1InputRef.current?.click()}
                disabled={isProcessing}
              >
                {t('watermark.change')}
              </button>
              <button
                type="button"
                className="btn-remove-file"
                onClick={() => setVideo1(null)}
                disabled={isProcessing}
              >
                {t('watermark.remove')}
              </button>
            </div>
          </div>
        )}

        <input
          ref={video1InputRef}
          type="file"
          accept="video/*"
          onChange={handleVideo1Input}
          style={{ display: 'none' }}
        />
      </div>

      {/* Video 2 Upload */}
      <div className="merger-section">
        <h4>🎬 {t('videoMerger.video2Title')}</h4>

        {!video2 ? (
          <div
            className="video-upload-area merger-upload"
            onClick={() => video2InputRef.current?.click()}
          >
            <div className="upload-icon">2️⃣</div>
            <p className="upload-text">{t('videoMerger.uploadSecond')}</p>
            <p className="upload-hint">{t('videoMerger.videoFormats')}</p>
          </div>
        ) : (
          <div className="video-file-info">
            <div className="video-file-details">
              <span className="file-icon">🎬</span>
              <div className="file-text">
                <span className="file-name">{video2.name}</span>
                <span className="file-size">{formatFileSize(video2.size)}</span>
              </div>
            </div>
            <div className="file-actions">
              <button
                type="button"
                className="btn-change-file"
                onClick={() => video2InputRef.current?.click()}
                disabled={isProcessing}
              >
                {t('watermark.change')}
              </button>
              <button
                type="button"
                className="btn-remove-file"
                onClick={() => setVideo2(null)}
                disabled={isProcessing}
              >
                {t('watermark.remove')}
              </button>
            </div>
          </div>
        )}

        <input
          ref={video2InputRef}
          type="file"
          accept="video/*"
          onChange={handleVideo2Input}
          style={{ display: 'none' }}
        />
      </div>

      {/* Swap Button */}
      {video1 && video2 && (
        <div className="swap-button-container">
          <button
            type="button"
            className="btn-swap-videos"
            onClick={handleSwap}
            disabled={isProcessing}
          >
            🔄 {t('videoMerger.swapOrder')}
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="merger-info">
        <h4>✨ {t('videoMerger.infoTitle')}</h4>
        <ul>
          <li><strong>{t('videoMerger.infoOrder')}</strong></li>
          <li><strong>{t('videoMerger.infoResolution')}</strong></li>
          <li><strong>{t('videoMerger.infoProcessing')}</strong></li>
          <li><strong>{t('videoMerger.infoQuality')}</strong></li>
          <li><strong>{t('videoMerger.infoFormats')}</strong></li>
        </ul>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="merger-warning">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        className="btn-merge-videos"
        onClick={handleSubmit}
        disabled={!video1 || !video2 || isProcessing}
      >
        {isProcessing ? (
          <>⏳ {t('status.processing')}</>
        ) : (
          <>🔗 {t('videoMerger.mergeButton')}</>
        )}
      </button>
    </div>
  );
};

export default VideoMergerForm;
