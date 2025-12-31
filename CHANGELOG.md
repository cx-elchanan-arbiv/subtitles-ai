# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### Added
- Initial open source release
- Video transcription using OpenAI Whisper (multiple model sizes: tiny, base, small, medium, large)
- Multi-language subtitle translation using GPT-4o
- RTL (Right-to-Left) text support for Hebrew and Arabic
- YouTube video download and processing with quality selection
- SRT and VTT subtitle export formats
- Video watermarking functionality with custom logo support
- Video cutting and merging tools
- Manual subtitle embedding
- Real-time processing progress tracking with WebSocket updates
- Docker Compose deployment setup
- Comprehensive API with rate limiting
- Multi-language UI (English and Hebrew)
- Transcription-only mode (subtitles without translation)

### Security
- Token-based download protection
- Rate limiting on API endpoints
- Input validation and sanitization with DOMPurify
- Non-root Docker container execution
- Secure file permissions (0o755)
- XSS protection for user-generated content

### Infrastructure
- Flask backend with Celery task queue
- Redis for caching and task management
- React 19 frontend with TypeScript
- Docker multi-stage builds
- Health checks for all services

## [Unreleased]

### Planned
- Additional translation service providers
- Batch video processing
- Custom font support for subtitles
- API documentation with OpenAPI/Swagger
