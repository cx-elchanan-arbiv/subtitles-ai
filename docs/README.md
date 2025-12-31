# SubsTranslator Documentation

This directory contains all technical documentation for the SubsTranslator project.

## Core Documentation

### 📖 [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
High-level overview of what SubsTranslator is, its key features, use cases, and how it works. **Start here** if you're new to the project.

### 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md)  
Detailed technical architecture including:
- System design and container architecture
- Backend API structure and endpoints
- Frontend component organization
- Database and caching strategy
- Security and performance considerations

### ⚙️ [DEV_GUIDE.md](DEV_GUIDE.md)
Complete development guide covering:
- Environment setup (Docker + local)
- Development workflow and conventions
- Testing strategy and tools
- Code quality and linting
- Debugging and troubleshooting
- Deployment procedures

## Specialized Guides

### 🚀 [FASTER_WHISPER_GUIDE.md](FASTER_WHISPER_GUIDE.md)
Deep dive into the AI transcription system:
- Whisper model selection and optimization
- Performance tuning and benchmarks
- Language-specific configurations

### 🔤 [HEBREW_SUBTITLES_GUIDE.md](HEBREW_SUBTITLES_GUIDE.md)
RTL language processing and Hebrew subtitle handling:
- Text direction and formatting
- Font selection and styling
- Unicode and encoding considerations

### 🧪 [TESTING.md](TESTING.md)
Testing strategy and implementation:
- Unit, integration, and end-to-end tests
- Mock configurations and test data
- CI/CD pipeline setup

### 🔧 [TESTING_TROUBLESHOOTING.md](TESTING_TROUBLESHOOTING.md)
Troubleshooting guide for common testing issues:
- Python version compatibility
- Dependency conflicts
- Test collection errors

### ⚠️ [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
Known limitations and platform constraints:
- YouTube download quality limitation (360p vs HD)
- Experimental features status
- Workarounds and alternatives

### ⚡ [QUICK_COMMANDS.md](QUICK_COMMANDS.md)
Handy reference for common development tasks:
- Docker commands
- Testing shortcuts
- Debugging utilities

## API Documentation

### 📡 [api/](api/)
OpenAPI/Swagger documentation for REST endpoints (if available).

## Archived Documentation

### 📦 [archive/](archive/)
Contains historical documentation and planning documents:
- Previous refactor plans
- Research and analysis documents
- Deprecated guides

---

## Documentation Guidelines

When updating documentation:

1. **Keep it current** - Update docs when making code changes
2. **Be specific** - Include file paths, line numbers, and examples
3. **Use consistent formatting** - Follow existing Markdown conventions
4. **Cross-reference** - Link between related documents
5. **Test instructions** - Verify all commands and procedures work

## Quick Navigation

- **New to the project?** → Start with [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)
- **Setting up development?** → Go to [DEV_GUIDE.md](DEV_GUIDE.md)
- **Understanding the system?** → Read [ARCHITECTURE.md](ARCHITECTURE.md)
- **Working with Hebrew/RTL?** → Check [HEBREW_SUBTITLES_GUIDE.md](HEBREW_SUBTITLES_GUIDE.md)
- **Optimizing performance?** → See [FASTER_WHISPER_GUIDE.md](FASTER_WHISPER_GUIDE.md)
- **Having issues?** → See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) and [TESTING_TROUBLESHOOTING.md](TESTING_TROUBLESHOOTING.md)

---

*Last updated: December 2024*
