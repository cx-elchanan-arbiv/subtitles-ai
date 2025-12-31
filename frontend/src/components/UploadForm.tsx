import { useRef, useState, useEffect } from 'react';
import { useTranslation } from '../i18n/TranslationContext';

interface FileMetadata {
  duration?: number;
  width?: number;
  height?: number;
}

interface UploadFormProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  isProcessing: boolean;
}

const UploadForm: React.FC<UploadFormProps> = ({ selectedFile, onFileSelect, isProcessing }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata>({});

  // Extract video metadata when file is selected
  useEffect(() => {
    if (!selectedFile) {
      setFileMetadata({});
      return;
    }

    // Only extract metadata for video files
    const videoExtensions = ['mp4', 'mkv', 'mov', 'webm', 'avi'];
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !videoExtensions.includes(fileExtension)) {
      setFileMetadata({});
      return;
    }

    // Create video element to read metadata
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      setFileMetadata({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });

      // Clean up
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      // If video fails to load, just skip metadata
      setFileMetadata({});
    };

    video.src = URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  return (
    <div className="upload-section">
      {!selectedFile ? (
        <>
          <div
            className={`upload-area ${isProcessing ? 'disabled' : ''}`}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            <div className="upload-icon">📎</div>
            <p className="upload-text">{t.uploadTitle}</p>
            <small className="upload-hint">{t.supportedFormats}</small>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mkv,.mov,.webm,.avi,.mp3,.wav"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={isProcessing}
          />
        </>
      ) : (
        <div className="file-preview-container">
          <div className="file-preview">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <div className="file-name">{selectedFile.name}</div>
              <div className="file-meta-grid">
                {fileMetadata.duration && (
                  <div className="file-meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span className="meta-label">{t('upload.duration') || 'משך'}:</span>
                    <span className="meta-value">{formatDuration(fileMetadata.duration)}</span>
                  </div>
                )}
                <div className="file-meta-item">
                  <span className="meta-icon">📊</span>
                  <span className="meta-label">{t('upload.fileSize') || 'גודל קובץ'}:</span>
                  <span className="meta-value">{formatFileSize(selectedFile.size)}</span>
                </div>
                {fileMetadata.width && fileMetadata.height && (
                  <div className="file-meta-item">
                    <span className="meta-icon">🎬</span>
                    <span className="meta-label">{t('upload.resolution') || 'רזולוציה'}:</span>
                    <span className="meta-value">{fileMetadata.width}×{fileMetadata.height}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              className="remove-file-btn"
              onClick={() => {
                onFileSelect(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              disabled={isProcessing}
              title={t.removeFile || 'Remove file'}
            >
              ✕
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mkv,.mov,.webm,.avi,.mp3,.wav"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={isProcessing}
          />
        </div>
      )}
    </div>
  );
};

export default UploadForm;
