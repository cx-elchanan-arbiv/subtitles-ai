# SubsTranslator 🎬

> AI-powered video subtitle generation, translation, and burn-in tool with professional RTL support

SubsTranslator is an advanced AI-powered video subtitle generation and translation system. Built with `faster-whisper` for lightning-fast transcription and OpenAI GPT-4 for accurate multilingual translation, it features a sophisticated React frontend and robust Flask backend with async processing.

The entire application is containerized using Docker with professional-grade Hebrew/RTL text support and intelligent model selection.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-required-blue.svg)](https://www.docker.com/)

## 📚 Project Documentation

**Essential Guides**:
- 🏗️ [**Architecture Overview**](docs/ARCHITECTURE.md) - System design & components  
- ⚙️ [**Operations & Runbook**](docs/OPERATIONS.md) - Day-to-day ops & troubleshooting  
- 🤝 [**Contributing Guide**](docs/CONTRIBUTING.md) - Development workflow & standards  

**Quick Start**: See [Operations Guide](docs/OPERATIONS.md#quick-start-local-development)

## 🌟 Key Features


### **Core Functionality**
-   **⚡ Ultra-Fast Transcription:** Uses `faster-whisper` with intelligent model selection (tiny/base/medium/large)
-   **🎯 Smart Model Selection:** Automatically chooses optimal Whisper model based on language and content
-   **🌍 Advanced Multi-language Support:** 11+ languages with specialized Hebrew/Arabic RTL processing
-   **📱 Dual Input Methods:** YouTube URL processing + local file upload support
-   **🔄 Asynchronous Processing:** Celery + Redis for scalable background task processing

### **Advanced Subtitle Features**
-   **🔥 Burn-in Subtitles:** Create videos with embedded subtitles using advanced FFmpeg processing
-   **📝 Manual Subtitle Embedding:** Direct subtitle burn-in from text input with timestamp support
-   **🎨 Hebrew Text Optimization:** Sophisticated RTL text handling with proper directional markers
-   **⚙️ Custom Styling:** Configurable subtitle appearance with Hebrew font optimization

### **Professional Features**
-   **🖼️ Watermark System:** Automatic logo overlay with customizable positioning and transparency
-   **⬇️ Quick Download Mode:** YouTube video download without processing
-   **📊 Real-time Progress:** Live processing updates with detailed status information
-   **🗂️ Multiple Output Formats:** Original SRT, translated SRT, and video with subtitles
-   **🧹 Automated Cleanup:** Background file management and cleanup tasks

### **Developer & Production Ready**
-   **🐳 Full Docker Setup:** One-command deployment with docker-compose
-   **🔒 Security Features:** Path traversal protection and file validation
-   **📈 Monitoring Ready:** Health checks and comprehensive logging
-   **🌐 Bilingual UI:** Hebrew/English interface with RTL support

## Getting Started


4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

### Prerequisites

**Required:**
-   [Docker](https://docs.docker.com/get-docker/) 20.10+
-   [Docker Compose](https://docs.docker.com/compose/install/) 2.0+
-   **API Keys:**
    - OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
    - Firebase project for authentication ([Setup guide](https://firebase.google.com/docs/web/setup))

**For local development (without Docker):**
-   Python 3.9+
-   Node.js 18+
-   FFmpeg 4.4+
-   Redis 6.0+

### Quick Start

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/cx-elchanan-arbiv/SubsTranslator.git
    cd SubsTranslator
    ```

2.  **Configure environment variables:**
    ```bash
    # Copy example files
    cp .env.example .env
    cp frontend/.env.example frontend/.env.local

    # Edit .env and add your API keys:
    # - OPENAI_API_KEY=your_openai_key_here
    # - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD

    # Edit frontend/.env.local and add Firebase config:
    # - REACT_APP_FIREBASE_API_KEY=your_firebase_key
    # - REACT_APP_FIREBASE_AUTH_DOMAIN=...
    ```

3.  **Start the application:**
    ```bash
    ./start.sh
    ```
    This will start all services:
    -   `frontend`: React app on `http://localhost`
    -   `backend`: Flask API on `http://localhost:8081`
    -   `redis`: Message broker for Celery
    -   `worker`: Background task processor
    -   `beat`: Task scheduler

4.  **Verify it's working:**
    ```bash
    # Check health:
    curl http://localhost:8081/health

    # Check frontend:
    curl http://localhost
    ```

5.  **Access the application:**
    Open `http://localhost` in your browser.

### Stopping the Application

```bash
./stop.sh
```

### Troubleshooting

If you encounter issues:

```bash
# Check all services are running:
docker-compose ps

# View logs:
docker-compose logs backend
docker-compose logs worker

# Force stop and restart:
./stop.sh
./start.sh
```

## 📚 Documentation

- **📖 [Project Overview](docs/PROJECT_OVERVIEW.md)** - What SubsTranslator is and how it works
- **🏗️ [Architecture Guide](docs/ARCHITECTURE.md)** - Technical architecture and system design  
- **⚙️ [Development Guide](docs/DEV_GUIDE.md)** - Setup, workflow, and contribution guidelines
- **🧪 [Testing Guide](TESTING.md)** - Complete testing documentation and structure
- **🔧 [Testing Troubleshooting](docs/TESTING_TROUBLESHOOTING.md)** - Solutions to common testing issues

**🚨 IMPORTANT: Before modifying ANY code, read [CODE_MODIFICATION_POLICY.md](CODE_MODIFICATION_POLICY.md)**

## 🔌 API Documentation

### **Core Processing Endpoints**

#### **YouTube Video Processing**
```bash
# Full processing with subtitles and video creation
curl -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/VIDEO_ID","target_lang":"he","auto_create_video":true,"whisper_model":"large"}' \
  http://localhost:8081/youtube

# Quick download only (no processing)
curl -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/VIDEO_ID"}' \
  http://localhost:8081/download-video-only
```

#### **File Upload Processing**
```bash
# Upload and process local video file
curl -X POST -F "file=@video.mp4" \
  -F "source_lang=auto" -F "target_lang=he" \
  -F "auto_create_video=true" -F "whisper_model=large" \
  http://localhost:8081/upload
```

#### **Manual Subtitle Embedding**
```bash
# Embed custom subtitles into video
curl -X POST -F "video=@video.mp4" \
  -F "srt_text=[00:10 - 00:15] Hello world
[00:20 - 00:25] This is a test" \
  http://localhost:8081/embed_subtitles
```

### **Status & Download Endpoints**
```bash
# Check processing status
curl http://localhost:8081/status/{task_id}

# Download processed files
curl http://localhost:8081/download/{filename}

# Health check
curl http://localhost:8081/health

# Get supported languages
curl http://localhost:8081/languages
```

### **Supported Parameters**
- **whisper_model**: `tiny`, `base`, `medium`, `large` (default: `large`)
- **source_lang**: Language code or `auto` for detection
- **target_lang**: Target language code (default: `he`)
- **auto_create_video**: `true`/`false` for video with subtitles creation

## 📁 Project Architecture

```
SubsTranslator/
├── 🐳 Docker Configuration
│   ├── docker-compose.yml       # Multi-service orchestration
│   ├── backend.Dockerfile       # Python Flask + Celery container
│   ├── frontend.Dockerfile      # React + Nginx container
│   └── nginx.conf               # Reverse proxy configuration
│
├── 🔧 Backend (Python Flask + Celery)
│   ├── app.py                   # Main Flask application
│   ├── tasks.py                 # Celery background tasks
│   ├── celery_worker.py         # Celery worker configuration
│   ├── celery_config.py         # Celery settings and queues
│   ├── config.py                # Application configuration
│   ├── whisper_smart.py         # Smart Whisper model management
│   ├── rtl_utils.py             # Hebrew/RTL text processing
│   └── requirements.txt         # Python dependencies
│
├── 🎨 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx              # Main application component
│   │   ├── components/          # Reusable React components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── i18n/                # Internationalization (Hebrew/English)
│   │   └── types/               # TypeScript type definitions
│   ├── package.json             # Node.js dependencies
│   └── public/                  # Static assets
│
├── 🛠️ Scripts & Utilities
│   ├── start.sh                 # Quick start script
│   ├── stop.sh                  # Clean shutdown script
│   └── e2e_subtitle_test.py     # End-to-end testing
│
└── 📚 Documentation
    ├── README.md                # This file
    ├── DEVELOPMENT_GUIDE.md     # Development instructions
    └── CODE_MODIFICATION_POLICY.md # Code change guidelines
```

### **Key Components**

- **🚀 Async Processing**: Celery workers handle video processing in background
- **🌐 Smart Frontend**: React with Hebrew/English UI switching
- **🎯 Intelligent Models**: Dynamic Whisper model selection based on content
- **🔒 Secure Design**: Path traversal protection and input validation
- **📦 Container Ready**: Full Docker deployment with volume mapping

---

## 🛠️ Tech Stack

### Backend
- **Python 3.9+** - Core language
- **Flask 3.0+** - Web framework
- **Celery 5.3+** - Distributed task queue
- **Redis 6.0+** - Message broker & caching
- **faster-whisper** - AI transcription (OpenAI Whisper optimized)
- **OpenAI GPT-4** - Translation & summarization
- **Google Gemini** - Alternative transcription provider
- **FFmpeg** - Video processing & subtitle burn-in
- **yt-dlp** - YouTube video download

### Frontend
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Firebase** - Authentication & user management
- **i18next** - Internationalization (Hebrew/English)

### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy & static file serving
- **pytest** - Testing framework
- **Playwright** - E2E testing

---

## 🤝 Contributing

Contributions are welcome! This project follows standard open source contribution guidelines.

**Quick Start for Contributors:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Run tests: `pytest backend/tests/`
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

For detailed guidelines, see [CONTRIBUTING.md](docs/CONTRIBUTING.md) and [CODE_MODIFICATION_POLICY.md](CODE_MODIFICATION_POLICY.md).

**Code Style:**
- Python: Follow PEP 8, use `black` formatter
- TypeScript: Follow Airbnb style guide, use `prettier`
- Write tests for new features
- Keep test coverage above 70%

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**What this means:**
- ✅ Free to use for personal and commercial projects
- ✅ Modify and distribute as you wish
- ✅ No warranty provided
- ⚠️ Must include original license and copyright notice

---

## 💬 Support & Contact

**Found a bug or have a feature request?**
- 🐛 [Open an issue](https://github.com/cx-elchanan-arbiv/SubsTranslator/issues)
- 💡 [Feature requests](https://github.com/cx-elchanan-arbiv/SubsTranslator/issues/new?labels=enhancement)

**Need help?**
- 📖 Check the [Documentation](docs/)
- 💬 Start a [Discussion](https://github.com/cx-elchanan-arbiv/SubsTranslator/discussions)

**Security Issues:**
- 🔒 Please report security vulnerabilities privately
- See [SECURITY.md](SECURITY.md) for details

---

## 🙏 Credits & Acknowledgments

**Built with amazing open source projects:**
- [OpenAI Whisper](https://github.com/openai/whisper) - Speech recognition
- [faster-whisper](https://github.com/guillaumekln/faster-whisper) - Optimized Whisper implementation
- [FFmpeg](https://ffmpeg.org/) - Video processing
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube download
- [React](https://react.dev/) - Frontend framework
- [Flask](https://flask.palletsprojects.com/) - Backend framework
- [Celery](https://docs.celeryq.dev/) - Task queue

**Special Thanks:**
- OpenAI for GPT-4 and Whisper models
- Google for Gemini API
- All contributors and users of this project

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

It helps others discover the project and motivates continued development.

---

**Made with ❤️ for the open source community**