# File Metadata Feature - Implementation Documentation

## Overview
This feature adds unified UX between YouTube/Online Video processing and File Upload processing by displaying file metadata (duration, resolution, size, etc.) immediately after upload, similar to the video info card shown for YouTube videos.

## Changes Summary

### Backend Changes

#### 1. New Module: `backend/file_probe.py`
- **Purpose**: Extract metadata from uploaded media files using ffprobe
- **Key Functions**:
  - `extract_file_metadata(file_path: str) -> Dict[str, Any]`: Main extraction function
  - `probe_file_safe(file_path: str) -> tuple[Optional[Dict], Optional[str]]`: Safe wrapper with error codes
  - `format_duration_string(duration_seconds: float) -> str`: Human-readable duration formatting

- **Metadata Extracted**:
  - `filename`: Original filename
  - `file_size_mb`: File size in megabytes
  - `size_bytes`: File size in bytes
  - `duration`: Duration in seconds
  - `duration_string`: Human-readable duration (e.g., "3:45")
  - `width`, `height`: Video resolution
  - `fps`: Frames per second
  - `mime_type`: MIME type based on extension
  - `extension`: File extension
  - `codec_name`: Video codec
  - `audio_codec`: Audio codec
  - `bit_rate`: Bitrate in bits/second
  - `thumbnail_url`: null (reserved for future thumbnail generation)

- **Error Codes**:
  - `FILE_NOT_FOUND`: File doesn't exist
  - `UNSUPPORTED_MEDIA`: Not a valid media file or unsupported format
  - `PROBE_FAILED`: ffprobe failed for other reasons

#### 2. Updated: `backend/app.py`
- **Import**: Added `from file_probe import probe_file_safe`
- **Modified Endpoint**: `POST /upload`
  - Now calls `probe_file_safe(filepath)` after saving the file
  - Returns `file_metadata` in the 202 response
  - Returns 400 error with `error_code` if probe fails
  - Automatically cleans up uploaded file if probe fails

- **Response Schema** (202 Accepted):
```json
{
  "task_id": "uuid-here",
  "state": "PENDING",
  "user_choices": { ... },
  "initial_request": { "filename": "example.mp4", "type": "upload" },
  "file_metadata": {
    "filename": "example.mp4",
    "file_size_mb": 15.3,
    "size_bytes": 16049152,
    "duration": 180.5,
    "duration_string": "3:01",
    "width": 1920,
    "height": 1080,
    "fps": 30.0,
    "mime_type": "video/mp4",
    "extension": ".mp4",
    "codec_name": "h264",
    "audio_codec": "aac",
    "bit_rate": 2500000,
    "thumbnail_url": null
  },
  "video_metadata": null,
  "progress": { "overall_percent": 0, "steps": [] },
  "result": null,
  "error": null
}
```

- **Error Response** (400 Bad Request):
```json
{
  "error": "File format is not supported. Please upload a valid video or audio file.",
  "error_code": "UNSUPPORTED_MEDIA"
}
```

### Frontend Changes

#### 1. Updated: `frontend/src/types/api.ts`
- **New Interface**: `FileMetadata`
  ```typescript
  export interface FileMetadata {
    filename: string;
    file_size_mb: number;
    size_bytes: number;
    duration: number;
    duration_string: string;
    width: number;
    height: number;
    fps: number;
    mime_type: string;
    extension: string;
    codec_name: string;
    audio_codec: string;
    bit_rate: number;
    thumbnail_url: string | null;
  }
  ```

- **Updated Interfaces**:
  - `TaskStatusResponse`: Added `file_metadata?: FileMetadata | null`
  - `TaskInitResponse`: Added `file_metadata?: FileMetadata`

#### 2. Updated: `frontend/src/hooks/useApi.ts`
- **New State**: `fileMetadata: FileMetadata | undefined`
- **Updated**:
  - `pollStatus`: Now handles `data.file_metadata`
  - `startProcessing`: Extracts and sets `file_metadata` from initial response
  - `resetState`: Clears `fileMetadata`
  - Return value: Added `fileMetadata` to returned object

#### 3. Updated: `frontend/src/App.tsx`
- **Destructured**: `fileMetadata` from `useApi()`
- **Passed**: `fileMetadata` prop to `<ProgressDisplay>`

#### 4. Updated: `frontend/src/components/ProgressDisplay.tsx`
- **New Prop**: `fileMetadata?: FileMetadata`
- **New Component Section**: "File Info Card (Uploaded File)"
  - Displays when `fileMetadata` is available
  - Shows file icon (gradient background with 📁 emoji)
  - Displays:
    - Filename as title
    - Duration
    - File size in MB
    - Resolution (width × height)
    - FPS
  - Shows user choices (source/target lang, whisper model, auto-create video)
  - Styled consistently with Video Info Card

#### 5. Updated: i18n Translations
- **Hebrew** (`frontend/public/locales/he/common.json`):
  - Added `"processing.fileInfo": "מידע על הקובץ"`

- **English** (`frontend/public/locales/en/common.json`):
  - Added `"processing.fileInfo": "File Information"`

## User Experience

### Before (File Upload)
1. User uploads file
2. Processing starts immediately with generic progress bar
3. No information about the uploaded file is shown

### After (File Upload)
1. User uploads file
2. **File metadata is extracted and displayed** (filename, duration, size, resolution)
3. **User choices are shown** (languages, model, settings)
4. Processing starts with detailed progress
5. **Unified UX** with YouTube/Online Video flow

## API Contract

### Upload Endpoint: `POST /upload`

**Success Response (202):**
- Now includes `file_metadata` object
- `file_metadata` contains all extracted media information
- Available immediately in the initial 202 response

**Error Responses:**
- **400** with `error_code`:
  - `UNSUPPORTED_MEDIA`: Invalid media file or unsupported format
  - `PROBE_FAILED`: Failed to analyze media file
  - `FILE_NOT_FOUND`: File saved but couldn't be accessed (rare)

### Status Endpoint: `GET /status/:task_id`

**Response:**
- Now may include `file_metadata` for file upload tasks
- Remains consistent throughout polling

## Testing

### Manual Testing Steps
1. **Upload a valid video file** (MP4, MKV, etc.)
   - ✅ File metadata should be displayed immediately
   - ✅ Shows filename, duration, size, resolution, FPS
   - ✅ Progress display matches YouTube flow

2. **Upload an unsupported file** (TXT, PDF, etc.)
   - ✅ Should return 400 error with clear message
   - ✅ File should be cleaned up from uploads folder

3. **Upload corrupted media file**
   - ✅ Should return `PROBE_FAILED` error
   - ✅ User-friendly error message displayed

### Backend Unit Test (Optional)
```python
from file_probe import extract_file_metadata, probe_file_safe

# Test valid video
metadata, error = probe_file_safe("path/to/valid/video.mp4")
assert error is None
assert metadata["duration"] > 0
assert metadata["width"] > 0

# Test invalid file
metadata, error = probe_file_safe("path/to/text.txt")
assert error == "UNSUPPORTED_MEDIA"
assert metadata is None
```

## Dependencies
- **ffprobe**: Required on backend server (part of ffmpeg package)
  - Already installed as project dependency
  - Used for metadata extraction

## Future Enhancements
1. **Thumbnail Generation**: Generate video thumbnail on upload
   - Set `file_metadata.thumbnail_url` to generated thumbnail path
   - Display thumbnail instead of file icon

2. **Audio-Only Files**: Enhanced display for MP3/WAV files
   - Different icon/styling for audio files
   - Hide resolution/FPS for audio

3. **Progress During Upload**: Show upload progress separately
   - Currently only shows processing progress
   - Could add upload progress bar before metadata extraction

## Files Modified

### Backend
- ✅ `backend/file_probe.py` (NEW)
- ✅ `backend/app.py` (MODIFIED)

### Frontend
- ✅ `frontend/src/types/api.ts` (MODIFIED)
- ✅ `frontend/src/hooks/useApi.ts` (MODIFIED)
- ✅ `frontend/src/App.tsx` (MODIFIED)
- ✅ `frontend/src/components/ProgressDisplay.tsx` (MODIFIED)
- ✅ `frontend/public/locales/he/common.json` (MODIFIED)
- ✅ `frontend/public/locales/en/common.json` (MODIFIED)

### Documentation
- ✅ `FILE_METADATA_FEATURE.md` (NEW - this file)

## Rollback Plan
If issues arise:
1. Remove `file_metadata` logic from `backend/app.py` (lines ~484-506)
2. Revert to `video_metadata: None` in upload response
3. Frontend will gracefully handle missing `file_metadata` (optional field)
4. No database migrations needed (stateless feature)

---

**Implementation Date**: 2025-10-15
**Developer**: Claude (Anthropic)
**Reviewed**: Pending
