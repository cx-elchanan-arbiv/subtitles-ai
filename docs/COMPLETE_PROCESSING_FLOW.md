# 🎬 SubsTranslator - תיעוד מלא של תהליך העיבוד

## תוכן עניינים
1. [סקירה כללית](#סקירה-כללית)
2. [ארכיטקטורת המערכת](#ארכיטקטורת-המערכת)
3. [Flow מלא - מסרטון ל-Subtitle](#flow-מלא---מסרטון-ל-subtitle)
4. [API Endpoints](#api-endpoints)
5. [Celery Tasks & Workers](#celery-tasks--workers)
6. [תהליכי עיבוד](#תהליכי-עיבוד)
7. [טיפול בשגיאות](#טיפול-בשגיאות)

---

## סקירה כללית

**SubsTranslator** היא מערכת מתקדמת לייצור כתוביות AI ותרגום. המערכת מספקת:
- 🎥 תמיכה ב-YouTube URLs וב-Local File Uploads
- 🗣️ תמלול אוטומטי באמצעות Whisper AI
- 🌍 תרגום כתוביות ל-11+ שפות
- 🔥 הטמעת כתוביות בסרטון (burn-in subtitles)
- 🖼️ מערכת watermark
- ⚡ עיבוד אסינכרוני עם Celery + Redis

---

## ארכיטקטורת המערכת

### רכיבים עיקריים

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│                   Port 80 - Nginx + React                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP Requests
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Flask API)                       │
│                      Port 8081                               │
│  - Rate Limiting (Flask-Limiter)                            │
│  - Request Validation                                       │
│  - Task Queueing (Celery)                                   │
│  - File Management                                          │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ Task Queue
      ↓
┌─────────────────────────────────────────────────────────────┐
│                    REDIS (Message Broker)                    │
│                      Port 6379                               │
│  - Celery Task Queue                                        │
│  - Result Backend                                           │
│  - Rate Limiter Storage                                     │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ Task Consumption
      ↓
┌─────────────────────────────────────────────────────────────┐
│                  CELERY WORKER                               │
│  - Background Task Processing                               │
│  - Video Download (yt-dlp)                                  │
│  - Audio Extraction (FFmpeg)                                │
│  - Transcription (faster-whisper)                           │
│  - Translation (Google Translate / OpenAI)                  │
│  - Subtitle Embedding (FFmpeg)                              │
│  - Watermark (FFmpeg)                                       │
└─────────────────────────────────────────────────────────────┘

```

### Docker Services

1. **frontend**: React app served by Nginx
2. **backend**: Flask API server (Gunicorn)
3. **redis**: Message broker and cache
4. **worker**: Celery worker for background processing
5. **beat**: Celery beat scheduler for periodic tasks

### Named Volumes

- **downloads**: Shared storage for processed files
- **storage**: Persistent storage (stats + whisper models)

---

## Flow מלא - מסרטון ל-Subtitle

### תרחיש 1: YouTube URL Processing

```
┌──────────────────────────────────────────────────────────────┐
│  1. USER INPUT                                               │
│  └→ Frontend: User enters YouTube URL                        │
│  └→ Optional: Target language, whisper model, watermark     │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  2. API REQUEST: POST /youtube                               │
│  └→ Backend receives request                                 │
│  └→ Validates URL format                                     │
│  └→ Validates parameters (language, model, etc.)            │
│  └→ Rate limiting check (5 req/min)                         │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  3. TASK CREATION                                            │
│  └→ Creates Celery task: download_and_process_youtube_task  │
│  └→ Returns task_id to frontend (202 Accepted)              │
│  └→ Task queued in Redis                                    │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  4. CELERY WORKER PICKS UP TASK                              │
│  └→ Worker dequeues task from Redis                         │
│  └→ Updates task state to "PROGRESS"                        │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  5. VIDEO DOWNLOAD (yt-dlp)                                  │
│  └→ Downloads video from YouTube                            │
│  └→ Uses optimized format selection                         │
│  └→ Downloads to /app/fast_work (tmpfs for speed)           │
│  └→ Extracts metadata (title, duration, views, etc.)        │
│  └→ Moves to /app/downloads                                 │
│  └→ Progress updates: 0-20%                                 │
│  Location: backend/tasks.py:download_youtube_video()        │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  6. AUDIO EXTRACTION (FFmpeg)                                │
│  └→ Probes video for audio streams                          │
│  └→ Extracts audio to WAV format (16kHz mono)               │
│  └→ Command: ffmpeg -i video.mp4 -ar 16000 -ac 1 audio.wav │
│  └→ Progress updates: 20-30%                                │
│  Location: backend/tasks.py:transcribe_and_translate_streamed()│
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  7. TRANSCRIPTION (faster-whisper)                           │
│  └→ Loads Whisper model (tiny/base/medium/large)            │
│  └→ Transcribes audio to text segments                      │
│  └→ Each segment contains: start, end, text                 │
│  └→ Detects source language automatically (if auto)         │
│  └→ Progress updates: 30-60%                                │
│  Location: backend/whisper_smart.py:smart_whisper()         │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  8. TRANSLATION (Google Translate / OpenAI)                  │
│  └→ Translates each segment to target language              │
│  └→ P1 Optimization: Parallel batch translation             │
│  └→ Batch size: 20 segments                                 │
│  └→ Parallelism: 1-4 workers (configurable)                 │
│  └→ Handles RTL languages (Hebrew, Arabic)                  │
│  └→ Progress updates: 60-80%                                │
│  Location: backend/translation_services.py                  │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  9. SUBTITLE FILE GENERATION                                 │
│  └→ Creates original SRT file (source language)             │
│  └→ Creates translated SRT file (target language)           │
│  └→ Format: SRT with proper timestamps                      │
│  └→ RTL support: Adds directional markers for Hebrew        │
│  └→ Progress updates: 80-85%                                │
│  Location: backend/services/subtitle_service.py             │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  10. VIDEO WITH SUBTITLES (if auto_create_video=true)       │
│  └→ Embeds translated subtitles into video                  │
│  └→ Uses FFmpeg with ass filter                            │
│  └→ Hebrew font optimization (Arial, FreeSerif)             │
│  └→ Progress updates: 85-95%                                │
│  Location: backend/video_utils.py:embed_subtitles_ffmpeg() │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  11. WATERMARK (if watermark_enabled=true)                   │
│  └→ Adds logo overlay to video                             │
│  └→ Position: top-right, bottom-left, etc.                  │
│  └→ Size: small, medium, large                              │
│  └→ Opacity: 0-100                                          │
│  └→ Uses FFmpeg overlay filter                              │
│  └→ Progress updates: 95-98%                                │
│  Location: backend/video_utils.py:add_watermark_to_video() │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  12. FORMAT VERIFICATION                                     │
│  └→ Checks video codec (H.264) and audio codec (AAC)        │
│  └→ Converts if needed for QuickTime compatibility          │
│  └→ Progress updates: 98-100%                               │
│  Location: backend/tasks.py:verify_and_convert_video_format()│
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  13. CLEANUP & RESULT                                        │
│  └→ Removes temporary files (audio WAV, etc.)               │
│  └→ Saves statistics to JSONL file                          │
│  └→ Updates task state to "SUCCESS"                         │
│  └→ Returns result with file paths and metadata             │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  14. FRONTEND POLLS STATUS                                   │
│  └→ GET /status/<task_id> every 2 seconds                   │
│  └→ Displays progress bar and status messages               │
│  └→ Shows download links when complete                      │
└──────────────────────────────────────────────────────────────┘
```

---

### תרחיש 2: File Upload Processing

```
┌──────────────────────────────────────────────────────────────┐
│  1. USER INPUT                                               │
│  └→ Frontend: User uploads video file                        │
│  └→ Max file size: 500MB (configurable)                     │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  2. API REQUEST: POST /upload                                │
│  └→ Backend receives multipart/form-data                     │
│  └→ Validates file type (mp4, avi, mkv, etc.)               │
│  └→ Validates file size                                      │
│  └→ Saves to /app/uploads                                    │
│  └→ Rate limiting check (5 req/min)                         │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  3. FILE PROBE                                               │
│  └→ Uses FFprobe to extract metadata                        │
│  └→ Checks if valid media file                              │
│  └→ Returns error if probe fails                            │
│  Location: backend/file_probe.py:probe_file_safe()          │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────┐
│  4. TASK CREATION                                            │
│  └→ Creates Celery task: process_video_task                 │
│  └→ Returns task_id to frontend (202 Accepted)              │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 ↓
        [Steps 6-14 identical to YouTube flow]
```

---

## API Endpoints

### 1. Core Processing Endpoints

#### **POST /youtube**
- **Purpose**: Process YouTube video with full pipeline
- **Rate Limit**: 5 requests/minute
- **Input**:
  ```json
  {
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "source_lang": "auto",
    "target_lang": "he",
    "auto_create_video": true,
    "whisper_model": "large",
    "translation_service": "google",
    "watermark_enabled": true,
    "watermark_position": "top-right",
    "watermark_size": "medium",
    "watermark_opacity": 40
  }
  ```
- **Output**:
  ```json
  {
    "task_id": "uuid-string",
    "state": "PENDING",
    "user_choices": {...},
    "progress": {"overall_percent": 0}
  }
  ```
- **Location**: `backend/app.py:748`

#### **POST /upload**
- **Purpose**: Upload and process local video file
- **Rate Limit**: 5 requests/minute
- **Input**: multipart/form-data with video file
- **Output**: Same as /youtube
- **Location**: `backend/app.py:554`

#### **POST /download-video-only**
- **Purpose**: Download YouTube video without processing
- **Rate Limit**: 10 requests/minute
- **Input**: `{"url": "youtube_url"}`
- **Output**: Task ID for download-only task
- **Location**: `backend/app.py:962`

---

### 2. Status & Download Endpoints

#### **GET /status/<task_id>**
- **Purpose**: Get task progress and results
- **Rate Limit**: Exempt
- **Output**:
  ```json
  {
    "task_id": "uuid",
    "state": "PROGRESS|SUCCESS|FAILURE",
    "progress": {
      "overall_percent": 75,
      "steps": [
        {"name": "Downloading video", "percent": 100, "status": "completed"},
        {"name": "Transcribing", "percent": 50, "status": "in_progress"}
      ]
    },
    "result": {
      "files": {
        "original_srt": "filename.srt",
        "translated_srt": "filename_he.srt",
        "video_with_subs": "filename_with_subs.mp4"
      }
    },
    "error": null
  }
  ```
- **Location**: `backend/app.py:1411`

#### **GET /download/<filename>**
- **Purpose**: Download processed files
- **Rate Limit**: 30 requests/minute
- **Security**: Path traversal protection
- **Location**: `backend/app.py:1561`

---

### 3. Utility Endpoints

#### **POST /cut-video**
- **Purpose**: Cut video segment from start to end time
- **Input**: video file + start_time + end_time
- **Location**: `backend/app.py:1056`

#### **POST /embed-subtitles**
- **Purpose**: Embed subtitles into video with watermark
- **Input**: video file + srt_file/srt_text + logo options
- **Location**: `backend/app.py:1118`

#### **POST /merge-videos**
- **Purpose**: Merge two videos with automatic resolution handling
- **Input**: video1 + video2
- **Location**: `backend/app.py:1237`

#### **POST /add-logo-to-video**
- **Purpose**: Add watermark to video without transcription
- **Input**: video file + logo file + position/size/opacity
- **Location**: `backend/app.py:1317`

---

### 4. Metadata Endpoints

#### **GET /languages**
- **Purpose**: Get supported languages
- **Output**: `{"auto": "Auto Detect", "he": "עברית", "en": "English", ...}`
- **Location**: `backend/app.py:468`

#### **GET /translation-services**
- **Purpose**: Get available translation services and status
- **Output**:
  ```json
  {
    "google": {"available": true},
    "openai": {"available": false, "description": "Requires API key"}
  }
  ```
- **Location**: `backend/app.py:491`

#### **GET /whisper-models**
- **Purpose**: Get available Whisper models
- **Output**: Model capabilities and descriptions
- **Location**: `backend/app.py:524`

---

### 5. Health & Diagnostics

#### **GET /health**
- **Purpose**: Health check
- **Output**: `{"status": "healthy", "ffmpeg_installed": true}`
- **Location**: `backend/app.py:367`

#### **GET /health/deps**
- **Purpose**: Check all dependencies (Redis, Celery, FFmpeg, yt-dlp)
- **Output**: Status of each dependency
- **Location**: `backend/app.py:389`

---

### 6. Statistics API

#### **GET /api/stats/task/<task_id>**
- **Purpose**: Get statistics for specific task
- **Location**: `backend/app.py:2027`

#### **GET /api/stats/daily**
- **Purpose**: Get daily summary
- **Query**: `?date=2025-01-19`
- **Location**: `backend/app.py:2041`

#### **GET /api/stats/download**
- **Purpose**: Download complete stats JSONL file
- **Location**: `backend/app.py:2149`

---

## Celery Tasks & Workers

### Task Queue Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    TASK QUEUES                               │
│                                                              │
│  Queue: "processing"                                        │
│  └→ download_and_process_youtube_task                        │
│  └→ download_youtube_only_task                              │
│  └→ process_video_task                                      │
│                                                              │
│  Worker Configuration:                                      │
│  └→ Concurrency: 1 (single task at a time)                 │
│  └→ Max tasks per child: 1 (restart after each task)       │
│  └→ Memory limit: 8GB                                       │
└──────────────────────────────────────────────────────────────┘
```

### Main Celery Tasks

#### 1. **download_and_process_youtube_task**
- **Purpose**: Full YouTube video processing pipeline
- **Location**: `backend/tasks.py`
- **Steps**:
  1. Download video with yt-dlp
  2. Extract metadata
  3. Call `process_video_task` for processing

#### 2. **process_video_task**
- **Purpose**: Core processing logic (works for both YouTube and uploads)
- **Location**: `backend/tasks.py`
- **Steps**:
  1. Audio extraction
  2. Transcription with Whisper
  3. Translation
  4. SRT file generation
  5. Video embedding (if requested)
  6. Watermark (if requested)
  7. Format verification

#### 3. **download_youtube_only_task**
- **Purpose**: Download video without any processing
- **Location**: `backend/tasks.py`
- **Output**: Raw video file

---

## תהליכי עיבוד

### 1. Audio Extraction
```python
# Command used:
ffmpeg -i video.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 audio.wav

# Parameters:
-vn: No video (audio only)
-acodec pcm_s16le: PCM 16-bit
-ar 16000: 16kHz sample rate (Whisper optimized)
-ac 1: Mono audio
```

### 2. Transcription with Whisper

**Model Selection:**
- `tiny`: Fast, lower accuracy (39M params)
- `base`: Balanced (74M params) - **Default**
- `medium`: Better accuracy (769M params)
- `large`: Best accuracy (1550M params)

**Process:**
```python
model = WhisperModel(model_size, device="cpu", compute_type="int8")
segments, info = model.transcribe(
    audio_path,
    language=source_lang if source_lang != "auto" else None,
    beam_size=5,
    vad_filter=True  # Voice activity detection
)
```

### 3. Translation

**Services:**
- **Google Translate**: Free, fast, good quality
- **OpenAI (GPT-4o)**: Premium, best quality, requires API key

**P1 Optimization:**
- Parallel batch translation
- Batch size: 20 segments
- Thread pool executor for concurrency

### 4. Subtitle Embedding

**FFmpeg Command:**
```bash
ffmpeg -i video.mp4 -vf "ass=subtitles.ass" \
  -c:v libx264 -preset medium -crf 23 \
  -c:a copy output.mp4
```

**Hebrew Optimization:**
- RTL directional markers
- Font selection: Arial, FreeSerif
- Proper text alignment

### 5. Watermark Overlay

**FFmpeg Command:**
```bash
ffmpeg -i video.mp4 -i logo.png \
  -filter_complex "[1:v]scale=w:h[logo];[0:v][logo]overlay=x:y" \
  -c:a copy output.mp4
```

**Positions:**
- top-left, top-right
- bottom-left, bottom-right
- center

---

## טיפול בשגיאות

### Error Codes

1. **DOWNLOAD_FAILED**: YouTube download failed
2. **AUDIO_EXTRACTION_ERROR**: FFmpeg audio extraction failed
3. **TRANSCRIPTION_ERROR**: Whisper transcription failed
4. **TRANSLATION_ERROR**: Translation service error
5. **SUBTITLE_EMBEDDING_ERROR**: FFmpeg subtitle embedding failed
6. **WATERMARK_ERROR**: Watermark overlay failed
7. **FILE_NOT_FOUND**: Input file missing
8. **UNSUPPORTED_MEDIA**: Invalid media format
9. **PROBE_FAILED**: FFprobe failed

### Error Structure

```json
{
  "code": "ERROR_CODE",
  "message": "Technical error message",
  "user_facing_message": "הודעה ידידותית למשתמש",
  "recoverable": true
}
```

### Retry Logic

- **YouTube Download**: 3 retries with exponential backoff
- **Translation API**: 2 retries
- **FFmpeg Operations**: No automatic retry (fail immediately)

---

## קבצים חשובים

### Backend Core
- `backend/app.py`: Flask API endpoints
- `backend/tasks.py`: Celery tasks and processing logic
- `backend/config.py`: Configuration management
- `backend/celery_worker.py`: Celery worker initialization

### Processing Services
- `backend/whisper_smart.py`: Whisper model management
- `backend/translation_services.py`: Translation engines
- `backend/services/subtitle_service.py`: SRT file generation
- `backend/video_utils.py`: FFmpeg video operations
- `backend/rtl_utils.py`: RTL text handling

### Utilities
- `backend/file_probe.py`: Media file validation
- `backend/logging_config.py`: Structured logging
- `backend/core/exceptions.py`: Custom exceptions
- `backend/ytdlp_hooks.py`: yt-dlp progress hooks

---

## Performance Optimizations (Phase A & P1)

### Phase A: Fast I/O
- **tmpfs workspace** (`/app/fast_work`): Downloads happen in fast tmpfs storage
- **Move to final storage**: After download, files moved to `/app/downloads`
- **Performance monitoring**: Logs download and move performance

### P1: Pipeline Overlap
- **Streaming transcription + translation**: Translates segments as they're transcribed
- **Parallel batch translation**: Multiple threads translate segments concurrently
- **Configuration**:
  - `TRANSLATION_PARALLELISM=1`: Number of parallel workers
  - `TRANSLATION_BATCH_SIZE=20`: Segments per batch

---

## סיכום

המערכת מספקת פתרון מלא לעיבוד סרטונים עם כתוביות:

1. **קלט גמיש**: YouTube URLs או קבצים מקומיים
2. **עיבוד מתקדם**: Whisper AI + Google Translate / OpenAI
3. **פלט מגוון**: SRT files + סרטונים עם כתוביות
4. **ארכיטקטורה מודרנית**: Docker + Celery + Redis
5. **ביצועים מיטביים**: Phase A + P1 optimizations
6. **תמיכה ב-RTL**: Hebrew, Arabic, Farsi
7. **ממשק נוח**: React frontend עם תמיכה דו-לשונית

---

**תאריך עדכון אחרון**: 23 נובמבר 2025
**גרסה**: 1.0.0
