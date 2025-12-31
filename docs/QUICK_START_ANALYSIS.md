# SubsTranslator - Quick Start Analysis

## What is this project?

SubsTranslator is an **AI-powered video subtitle generation and translation system** with:
- YouTube and local file support
- Fast Whisper transcription (with Gemini API as alternative)
- Multi-language translation (OpenAI GPT + Google Translate)
- Video editing features (cut, embed subtitles, add watermark, merge)
- React frontend with Hebrew/RTL support
- Flask backend with async processing (Celery + Redis)
- Full Docker containerization

## Key Files at a Glance

### Entry Points
| File | Purpose | Lines |
|------|---------|-------|
| `/backend/app.py` | Flask API (20+ routes) | 2,231 |
| `/backend/tasks.py` | Celery background jobs | 2,535 |
| `/backend/celery_worker.py` | Worker startup | ~30 |
| `/frontend/src/App.tsx` | React main component | 22KB |

### Core Processing
| Module | Purpose | Lines | Key Classes |
|--------|---------|-------|-------------|
| `whisper_smart.py` | Transcription selection | 522 | SmartWhisperManager |
| `gemini_transcription.py` | Google Gemini API | 346 | NEW: Alternative transcription |
| `translation_services.py` | OpenAI + Google Translate | 646 | GoogleTranslator, OpenAITranslator |
| `video_utils.py` | FFmpeg wrapper | 516 | cut_video, embed_subtitles, merge_videos |

### Support Modules
| Module | Purpose | Lines |
|--------|---------|-------|
| `config.py` | Configuration management | 297 |
| `state_manager.py` | Processing state tracking | 296 |
| `metadata_service.py` | Video metadata extraction | 260 |
| `logging_config.py` | Structured logging | 226 |
| `rtl_utils.py` | Hebrew/RTL text handling | 216 |

## Architecture Overview

```
User → Frontend (React) → Backend API (Flask) → Celery Worker
                              ↓
                           Redis Queue
                              ↓
                      (Transcribe → Translate → Process Video)
```

### Docker Services
1. **frontend** - React app (port 80)
2. **backend** - Flask API (port 8081)
3. **redis** - Message broker (port 6379)
4. **worker** - Celery task processor
5. **beat** - Celery scheduler

## API Endpoints (Most Important)

```
POST /upload                    - Upload & process local video
POST /youtube                   - Process YouTube video
POST /download-video-only       - Quick YouTube download
POST /embed-subtitles          - Burn-in subtitles to video
GET  /status/<task_id>         - Check processing status
GET  /download/<filename>      - Download result file
GET  /languages                - Supported languages
GET  /health                   - Health check
GET  /api/stats/*              - Statistics endpoints
```

## Frontend Components (Key)

| Component | Purpose |
|-----------|---------|
| `UploadForm.tsx` | File upload UI |
| `YoutubeForm.tsx` | YouTube URL input |
| `ProgressDisplay.tsx` | Real-time progress |
| `ResultsDisplay.tsx` | Results visualization |
| `EmbedSubtitlesForm.tsx` | Manual subtitle embedding |
| `VideoMergerForm.tsx` | Video merging |
| `WatermarkSettings.tsx` | Watermark configuration |

## Dependencies (Main)

### Backend
```
Flask 3.1.2              - Web framework
Celery 5.4.0             - Task queue
Redis 5.2.1              - Message broker
faster-whisper 1.2.0     - Fast transcription
openai 1.35.13           - GPT translations
google-genai 1.47.0      - Gemini API (NEW)
yt-dlp 2025.10.14        - YouTube downloader
ffmpeg-python 0.2.0      - Video processing
deep-translator 1.11.4   - Translation service
```

### Frontend
```
React 19.1.1
React Router 6.28.0
Firebase 12.1.0
Tailwind CSS 3.4.17
i18next 23.16.8          - Internationalization
Lucide React 0.540.0     - Icons
```

## File Organization Issues

### ⚠️ High Priority Fixes
1. **13 test files in wrong locations**
   - 8 in `/backend/` root → move to `/backend/tests/`
   - 5 in project root → move to `/backend/tests/`

2. **Backup folders need cleanup**
   - `/e2e/helpers_backup/` → archive or remove
   - `/e2e/tests_backup/` → archive or remove

3. **Too many .env files** (8 variants)
   - Consolidate to: `.env.example`, `.env.local`

### 🟡 Medium Priority
1. **Large files** (consider splitting):
   - `tasks.py` (2,535 lines) - Split by feature
   - `app.py` (2,231 lines) - Use Flask blueprints

2. **Potentially unused modules**:
   - `download_video_task.py` - Not imported
   - `fix_existing_srt.py`, `fix_srt_file.py` - Standalone scripts
   - `google_translate_with_batches.py` - Likely superseded

## Recent Changes (Nov 20-23)

- NEW: `gemini_transcription.py` - Google Gemini API support
- UPDATED: `whisper_smart.py` - Model persistence + debugging
- UPDATED: `tasks.py` - Phase A+ improvements
- NEW: `docs/COMPLETE_PROCESSING_FLOW.md` - Full documentation (646 lines)

## Quick Commands

```bash
# Start everything
docker-compose up

# Run tests
pytest backend/tests/

# Run specific test
pytest backend/tests/unit/test_translation_services_unit.py

# Check logs
docker-compose logs -f backend

# Frontend (local dev)
cd frontend && npm start
```

## Dependencies Between Files

```
app.py → tasks.py
        → config.py
        → whisper_smart.py
        → translation_services.py
        → video_utils.py
        → services/stats_service.py
        → services/subtitle_service.py

tasks.py → whisper_smart.py
        → gemini_transcription.py (optional)
        → translation_services.py
        → video_utils.py
        → metadata_service.py
        → quality_gate.py
```

## What to Review First

1. **To understand the flow**: Read `COMPLETE_PROCESSING_FLOW.md`
2. **To understand architecture**: Read `/docs/ARCHITECTURE.md`
3. **To modify backend**: Start with `app.py` (routes) → `tasks.py` (logic)
4. **To modify frontend**: Start with `App.tsx` → components
5. **To understand a feature**: Check both `tasks.py` and the corresponding component

## Testing

- **Unit tests**: `backend/tests/unit/` (18 files)
- **Integration tests**: `backend/tests/integration/`
- **E2E tests**: `e2e/` (Playwright)
- **Run all**: `pytest backend/` or `npm run test:e2e`

## Deployment

- **Backend**: Render.com (Docker container)
- **Frontend**: Vercel.com (React build)
- **Redis**: Upstash (Cloud Redis)
- **Database**: Not explicitly shown (may be Firebase)

## Key Takeaways

✅ Well-structured project with clear separation of concerns
✅ Professional async architecture (Celery + Redis)
✅ Comprehensive features (transcription, translation, video editing)
✅ Good documentation (16+ markdown guides)
✅ Production-ready with Docker setup

⚠️ Some organizational issues (scattered tests, backup folders)
⚠️ Large monolithic files (could benefit from refactoring)
⚠️ Multiple .env configurations (could be consolidated)

---
**Report Generated**: November 24, 2025
**For Full Analysis**: See `PROJECT_COMPREHENSIVE_ANALYSIS.md`
