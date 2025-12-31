# Open Source Migration Plan - SubsTranslator

## Step-by-Step Guide to Create a Clean Public Repository

**Date:** 2025-12-30
**Target:** GitHub Public Repository
**License:** MIT (already exists)

---

## Overview

This document provides exact commands to create a new clean repository for open source release, without the embarrassing git history and without exposing secrets.

---

## Phase 0: Stop the Bleeding (CRITICAL - Do First!)

### 0.1 Revoke Exposed API Keys IMMEDIATELY

**OpenAI API Key exposed in `.env` line 23:**
```
sk-proj-XXXX...XXXX (REVOKED - do not use)
```

**Action:**
1. Go to https://platform.openai.com/api-keys
2. Find this key and click "Revoke"
3. Generate a new key
4. Update your local `.env` with the new key

**Gemini API Key in `.claude/settings.local.json`:**
```
AIzaSyAVPZTDsWW4MCm_kBDSbTXXLdVIZc2nmBA
```

**Action:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Revoke this key
3. Generate new one if needed

### 0.2 Verify .gitignore is Complete

Current `.gitignore` should include (verify these exist):
```gitignore
# Environment files
.env
.env.local
.env.*.local
backend/.env
frontend/.env

# Claude Code settings (contains API keys)
.claude/

# IDE
.vscode/
.idea/

# Dependencies
node_modules/
.venv/
__pycache__/

# Build outputs
dist/
build/
*.egg-info/

# Runtime directories
uploads/
downloads/
fast_work/
whisper_models/
storage/

# Caches
.pytest_cache/
.ruff_cache/
yt_dlp_cache/

# Logs
*.log

# OS
.DS_Store
Thumbs.db
```

---

## Phase 1: Create Clean Repository

### 1.1 Create a Clean Copy

```bash
# Create new directory for clean copy
mkdir ~/SubsTranslator-OpenSource
cd ~/SubsTranslator-OpenSource

# Copy source files (excluding unwanted)
rsync -av --progress ~/Projects/SubsTranslator/ . \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '.pytest_cache' \
  --exclude '.ruff_cache' \
  --exclude 'dist' \
  --exclude 'build' \
  --exclude '*.egg-info' \
  --exclude 'uploads/*' \
  --exclude 'downloads/*' \
  --exclude 'fast_work/*' \
  --exclude 'whisper_models/*' \
  --exclude 'storage/*' \
  --exclude 'yt_dlp_cache' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude 'backend/.env' \
  --exclude 'frontend/.env' \
  --exclude '.claude' \
  --exclude '.vscode' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  --exclude 'test-results' \
  --exclude 'performance_tests/results/*' \
  --exclude 'internal-docs'
```

### 1.2 Clean the .env.example Files

**Root `.env.example` - Replace content with:**
```bash
cat > .env.example << 'EOF'
# ============================================
# SubsTranslator Environment Configuration
# ============================================
# Copy this file to .env and fill in your values
# DO NOT commit .env to version control!
# ============================================

# ============================================
# FLASK CONFIGURATION
# ============================================
FLASK_ENV=development
DEBUG=False
LOG_LEVEL=INFO
SECRET_KEY=  # REQUIRED: Generate with: python -c "import secrets; print(secrets.token_hex(32))"

# ============================================
# API KEYS (Required for translation)
# ============================================
# OpenAI API Key - Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=

# YouTube API Key (optional) - Get from: https://console.cloud.google.com/apis/credentials
YOUTUBE_API_KEY=

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_YOUTUBE_DOWNLOAD=True

# ============================================
# WHISPER MODEL CONFIGURATION
# ============================================
# Options: tiny, base, small, medium, large
DEFAULT_WHISPER_MODEL=base
WHISPER_DEVICE=cpu
WHISPER_MODELS_FOLDER=/app/whisper_models

# ============================================
# REDIS CONFIGURATION
# ============================================
REDIS_URL=redis://redis:6379/0
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Rate limiter
LIMITER_STORAGE_URI=redis://redis:6379/1

# ============================================
# WORKER CONFIGURATION
# ============================================
WORKER_CONCURRENCY=1
WORKER_MAX_TASKS_PER_CHILD=1000

# ============================================
# TRANSLATION OPTIMIZATION
# ============================================
TRANSLATION_PARALLELISM=1
TRANSLATION_BATCH_SIZE=20
MAX_CONCURRENT_OPENAI_REQUESTS=1

# ============================================
# FILE PROCESSING
# ============================================
MAX_FILE_SIZE=1073741824
UPLOAD_FOLDER=/app/uploads
DOWNLOADS_FOLDER=/app/downloads
ASSETS_FOLDER=/app/assets
FAST_WORK_DIR=/app/fast_work

# ============================================
# TIMEOUTS
# ============================================
TASK_SOFT_TIME_LIMIT=1800
TASK_TIME_LIMIT=3600

# ============================================
# CORS (Set specific origins in production!)
# ============================================
CORS_ORIGINS=http://localhost:3000,http://localhost:80
EOF
```

### 1.3 Remove Sensitive Files

```bash
# Remove any remaining sensitive files
rm -f .env .env.local backend/.env frontend/.env
rm -rf .claude/
rm -rf internal-docs/

# Remove any uploaded/processed files
rm -rf backend/uploads/* backend/downloads/* backend/fast_work/*
rm -rf backend/whisper_models/*.bin
rm -rf backend/storage/*

# Keep directory structure with .gitkeep
touch backend/uploads/.gitkeep
touch backend/downloads/.gitkeep
touch backend/fast_work/.gitkeep
touch backend/storage/.gitkeep
```

### 1.4 Fix Security Issues in Code

#### Fix 1: XSS Vulnerability in ResultsDisplay.tsx

**File:** `frontend/src/components/ResultsDisplay.tsx` (line 342)

Install DOMPurify:
```bash
cd frontend
npm install dompurify @types/dompurify
cd ..
```

Then edit the file - replace the dangerouslySetInnerHTML block with sanitized version.

#### Fix 2: Remove DEBUG=True from docker-compose.yml

Edit `docker-compose.yml`:
- Remove `DEBUG=True` lines
- Change `LOG_LEVEL=DEBUG` to `LOG_LEVEL=INFO`

#### Fix 3: Fix 0o777 Permissions

Search and replace in these files:
- `backend/services/youtube_service.py`
- `backend/tasks/download_tasks.py`

Replace:
```python
mode=0o777  ->  mode=0o755
chmod(..., 0o777)  ->  chmod(..., 0o755)
```

#### Fix 4: Make SECRET_KEY Required

Edit `backend/app.py` (around line 58):
```python
# OLD:
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

# NEW:
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY or SECRET_KEY == 'your-secret-key-change-in-production':
    raise ValueError("SECRET_KEY environment variable must be set with a secure value")
app.config['SECRET_KEY'] = SECRET_KEY
```

### 1.5 Initialize New Git Repository

```bash
# Initialize fresh git
git init

# Configure git (use your info)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Create initial commit with proper message
git commit -m "feat: initial open source release of SubsTranslator

SubsTranslator is a web application for automatic video subtitle
translation with support for:

- Whisper-based transcription
- Multi-language translation (OpenAI GPT-4o)
- RTL text support (Hebrew, Arabic)
- YouTube video processing
- SRT/VTT subtitle export
- Video watermarking and editing tools

Tech Stack:
- Frontend: React 19 + TypeScript
- Backend: Flask + Celery
- AI: OpenAI Whisper, GPT-4o
- Infrastructure: Docker, Redis

MIT License"
```

---

## Phase 2: Add Missing Documentation

### 2.1 Create CODE_OF_CONDUCT.md

```bash
cat > CODE_OF_CONDUCT.md << 'EOF'
# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our
community a harassment-free experience for everyone, regardless of age, body
size, visible or invisible disability, ethnicity, sex characteristics, gender
identity and expression, level of experience, education, socio-economic status,
nationality, personal appearance, race, religion, or sexual identity
and orientation.

## Our Standards

Examples of behavior that contributes to a positive environment:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

Examples of unacceptable behavior:

* The use of sexualized language or imagery
* Trolling, insulting/derogatory comments, and personal attacks
* Public or private harassment
* Publishing others' private information without permission
* Other conduct which could reasonably be considered inappropriate

## Enforcement Responsibilities

Community leaders are responsible for clarifying and enforcing our standards of
acceptable behavior and will take appropriate and fair corrective action in
response to any behavior that they deem inappropriate, threatening, offensive,
or harmful.

## Scope

This Code of Conduct applies within all community spaces, and also applies when
an individual is officially representing the community in public spaces.

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the project maintainers. All complaints will be reviewed and
investigated promptly and fairly.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.0, available at
https://www.contributor-covenant.org/version/2/0/code_of_conduct.html

[homepage]: https://www.contributor-covenant.org
EOF
```

### 2.2 Create CHANGELOG.md

```bash
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### Added
- Initial open source release
- Video transcription using OpenAI Whisper
- Multi-language subtitle translation using GPT-4o
- RTL (Right-to-Left) text support for Hebrew and Arabic
- YouTube video download and processing
- SRT and VTT subtitle export formats
- Video watermarking functionality
- Video cutting and merging tools
- Manual subtitle embedding
- Real-time processing progress tracking
- Docker Compose deployment setup
- Comprehensive documentation

### Security
- Token-based download protection
- Rate limiting on API endpoints
- Input validation and sanitization
- Non-root Docker container execution
EOF
```

### 2.3 Create GitHub Templates

```bash
# Create directories
mkdir -p .github/ISSUE_TEMPLATE

# Bug report template
cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Describe the bug
A clear and concise description of what the bug is.

## To Reproduce
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

## Expected behavior
A clear and concise description of what you expected to happen.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome, Safari]
- Version: [e.g., 1.0.0]

## Additional context
Add any other context about the problem here.
EOF

# Feature request template
cat > .github/ISSUE_TEMPLATE/feature_request.md << 'EOF'
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Is your feature request related to a problem?
A clear and concise description of what the problem is.

## Describe the solution you'd like
A clear and concise description of what you want to happen.

## Describe alternatives you've considered
A clear and concise description of any alternative solutions.

## Additional context
Add any other context or screenshots about the feature request here.
EOF

# PR template
cat > .github/PULL_REQUEST_TEMPLATE.md << 'EOF'
## Description
Brief description of changes.

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
EOF
```

### 2.4 Commit Documentation

```bash
git add .
git commit -m "docs: add CODE_OF_CONDUCT, CHANGELOG, and GitHub templates"
```

---

## Phase 3: Create GitHub Repository

### 3.1 Create New Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `SubsTranslator` (or your preferred name)
3. Description: "Automatic video subtitle translation with Whisper & GPT-4o"
4. **Keep it PRIVATE initially** (until Phase 4 is complete)
5. Do NOT initialize with README, .gitignore, or license (we have them)

### 3.2 Push to GitHub

```bash
# Add remote (replace with your repo URL)
git remote add origin git@github.com:YOUR_USERNAME/SubsTranslator.git

# Push
git branch -M main
git push -u origin main
```

### 3.3 Create Release Tag

```bash
git tag -a v1.0.0 -m "Initial open source release"
git push origin v1.0.0
```

---

## Phase 4: Final Checks Before Going Public

### 4.1 Security Checklist

Run these checks before making the repo public:

```bash
# Search for any remaining secrets
grep -rn "sk-" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.json" .
grep -rn "AIza" --include="*.py" --include="*.ts" --include="*.json" .
grep -rn "password.*=" --include="*.py" --include="*.ts" --include="*.json" .
grep -rn "secret.*=" --include="*.py" --include="*.ts" --include="*.json" .

# Check for .env files
find . -name ".env*" -type f

# Check for DEBUG=True
grep -rn "DEBUG.*True" --include="*.py" --include="*.yml" --include="*.yaml" .
```

**All commands should return empty or only test/example data.**

### 4.2 Documentation Checklist

- [ ] README.md is comprehensive
- [ ] LICENSE file exists (MIT)
- [ ] CONTRIBUTING.md exists
- [ ] CODE_OF_CONDUCT.md exists
- [ ] SECURITY.md exists
- [ ] CHANGELOG.md exists
- [ ] .env.example has NO real values

### 4.3 Make Repository Public

1. Go to repository Settings
2. Scroll to "Danger Zone"
3. Click "Change repository visibility"
4. Change to Public
5. Confirm

---

## Quick Command Summary

```bash
# 1. Create clean copy
mkdir ~/SubsTranslator-OpenSource
rsync -av ~/Projects/SubsTranslator/ ~/SubsTranslator-OpenSource/ \
  --exclude '.git' --exclude 'node_modules' --exclude '.venv' \
  --exclude '__pycache__' --exclude '.env' --exclude '.claude' \
  --exclude 'uploads/*' --exclude 'downloads/*' --exclude 'internal-docs'

# 2. Clean sensitive data
cd ~/SubsTranslator-OpenSource
rm -f .env .env.local backend/.env frontend/.env
rm -rf .claude/ internal-docs/

# 3. Initialize git
git init
git add .
git commit -m "feat: initial open source release"

# 4. Add docs
# (create CODE_OF_CONDUCT.md, CHANGELOG.md, templates)
git add .
git commit -m "docs: add open source documentation"

# 5. Push to GitHub
git remote add origin git@github.com:USERNAME/SubsTranslator.git
git push -u origin main
git tag -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

---

## What to Keep in the Original Repository

Your original repository at `/Users/elchananarbiv/Projects/SubsTranslator` can remain private and be used for:
- Development with real API keys in `.env`
- Testing before pushing to public repo
- Internal documentation
- Historical reference

You can set up the public repo as a second remote:
```bash
cd ~/Projects/SubsTranslator
git remote add public git@github.com:USERNAME/SubsTranslator-Public.git
```

---

## Files Summary

| File | Action |
|------|--------|
| `.env` | DELETE (use .env.example) |
| `.env.example` | CLEAN (remove real values) |
| `.claude/` | DELETE |
| `internal-docs/` | DELETE |
| `uploads/*` | DELETE contents |
| `downloads/*` | DELETE contents |
| `node_modules/` | EXCLUDE |
| `.venv/` | EXCLUDE |
| All source code | KEEP |
| Documentation | KEEP |
| Tests | KEEP |
| Docker files | KEEP (fix DEBUG) |

---

*This plan ensures a clean, professional open source release without exposing secrets or embarrassing history.*
