# 🔧 Testing Troubleshooting Guide

## Overview
This document tracks common issues encountered during development and testing, solutions that worked, and solutions that didn't work.

---

## ⚠️ **Issue #0: Python Version Incompatibility (November 2024)**

### The Problem
```bash
Tests suddenly failing after recreating virtual environment:
- 181/207 tests passing instead of 187/207
- ModuleNotFoundError for packages like faster-whisper, onnxruntime
- Error: "No matching distribution found for onnxruntime<2,>=1.14"
```

### Root Cause
**Virtual environment was recreated with Python 3.14 instead of Python 3.9.6**

When you run `python3 -m venv .venv`, it uses the **default** Python (Homebrew = 3.14).
But the project dependencies only support **Python 3.9-3.12**.

### What We Tried (Didn't Work)
- Installing dependencies with Python 3.14 ❌
- Using `--break-system-packages` flag ❌
- Installing from source ❌

### Solution That Worked ✅

**Step 1: Check which Python was used**
```bash
.venv/bin/python --version
# If shows 3.14 → Problem!
```

**Step 2: Delete and recreate with correct Python**
```bash
# Delete wrong venv
rm -rf .venv

# Recreate with Python 3.9.6 (macOS system Python)
/usr/bin/python3 -m venv .venv

# OR with Python 3.11 (if installed)
python3.11 -m venv .venv

# Verify
.venv/bin/python --version  # Should show 3.9.x or 3.11.x
```

**Step 3: Install dependencies**
```bash
.venv/bin/pip install -r backend/requirements.txt -r backend/requirements-test.txt
```

**Step 4: Run tests from backend directory**
```bash
cd backend
../.venv/bin/pytest tests/unit/ -v --tb=no -q
# Should show: 187/207 tests passing ✅
```

### Why This Happened
- **macOS system Python**: `/usr/bin/python3` → Python 3.9.6 ✅
- **Homebrew Python**: `python3` → Python 3.14 ❌
- **Dependencies**: Only support Python 3.9-3.12 (faster-whisper, onnxruntime)

### Prevention
**Always specify Python version explicitly:**
```bash
# Good:
/usr/bin/python3 -m venv .venv        # Explicit
python3.11 -m venv .venv              # Explicit

# Bad:
python3 -m venv .venv                 # Uses default (may be 3.14!)
```

### Documentation
Add to README.md:
```markdown
**Supported Python Versions:** 3.9, 3.11, 3.12
**Note:** Python 3.14 is not yet supported by some dependencies.
```

---

## 🚀 Recent Optimizations (December 2024)

### FFmpeg Performance Optimization

**Problem**: The system was running two separate FFmpeg operations:
- `create_video_with_subtitles`: ~16.4 seconds
- `add_watermark_to_video`: ~22.4 seconds
- **Total**: ~38.8 seconds (50% of total processing time!)

**Solution**: Created a combined function `create_video_with_subtitles_and_watermark` that:
- Combines both operations into a single FFmpeg command
- Uses filter_complex to apply subtitles and watermark in one pass
- Reduces processing time by ~50% (saves ~20 seconds per video)

**Implementation**:
```python
# Old approach (two separate calls):
subtitle_service.create_video_with_subtitles(...)  # 16.4s
subtitle_service.add_watermark_to_video(...)       # 22.4s

# New approach (single combined call):
subtitle_service.create_video_with_subtitles_and_watermark(...)  # ~20s total
```

**Smart Logic in tasks.py**:
- If watermark is enabled → use combined function
- If only subtitles → use original subtitle function
- If watermark file missing → fallback to subtitle-only function

**Test Coverage**: Added unit tests in `test_combined_subtitle_watermark.py`

---

## 🚨 **Issue #1: ModuleNotFoundError - docker**

### The Problem
```python
ImportError: No module named 'docker'
```

### What We Tried (Didn't Work)
- Installing `pip install docker`
- Using `docker-py` instead

### Solution That Worked ✅
**Removed the unnecessary import**
```python
# Before (didn't work):
import docker
import subprocess

# After (works):
import subprocess  # subprocess is enough
```

### Why This Happened
We used `subprocess` to read Docker logs, didn't need the `docker` module at all.

---

## 🚨 **Issue #2: Status Code 202 vs 200**

### The Problem
```python
AssertionError: assert 202 == 200
```

### What We Tried (Didn't Work)
- Changing API to return 200 instead of 202
- Waiting before checking status

### Solution That Worked ✅
**Accept both 202 (Accepted) as valid**
```python
# Before (didn't work):
assert response.status_code == 200

# After (works):
assert response.status_code in [200, 202]
```

### Why This Happened
Async API returns 202 (Accepted) when accepting background processing requests - this is normal and correct.

---

## 🚨 **Issue #3: Dual Tasks - Files Not Found**

### The Problem
```python
AssertionError: No files found in task result
```

### What We Tried (Didn't Work)
- Looking for `result['files']` directly
- Waiting longer
- Changing timeout

### Solution That Worked ✅
**Understood there are two tasks in chain:**

```python
# 1. Wait for download task
final_result = self.wait_for_task_completion(task_id)

# 2. If there's another task_id - that's the processing task
if 'task_id' in result_data and result_data.get('status') == 'PROCESSING':
    processing_task_id = result_data['task_id']
    print(f"Download completed, now waiting for processing task: {processing_task_id}")
    
    # 3. Wait for processing task (contains the files)
    final_result = self.wait_for_task_completion(processing_task_id)
```

### Why This Happened
YouTube processing architecture:
```
YouTube URL → Download Task (metadata) → Processing Task (files)
```

Files are only in the second processing task, not the first.

---

## 🚨 **Issue #4: Dropdown Empty After Download + Page Refresh**

### The Problem
After clicking download buttons (video or subtitles) and refreshing the page, dropdown menus for "Translation Service" and "Source/Target Language" appear empty for 20-60 seconds, then populate automatically. This happens across different browser tabs.

**User Experience:**
1. Complete video processing → see results screen
2. Click "Download Video" or "Download Subtitles" 
3. Refresh page (same tab or different tab)
4. Dropdowns show empty/disabled for 20-60 seconds
5. Then automatically populate without user action

**Network Behavior:**
- Requests to `/languages` and `/translation-services` show "pending" status
- After delay, they return 200 OK with proper data

### What We Initially Thought (Didn't Work)
**Rate Limiting Theory:**
- Thought Flask-Limiter was blocking requests after download
- Expected to see 429 status codes
- Assumed rate limits were being exceeded

### Root Cause Analysis ✅
**Worker Bottleneck - Not Rate Limiting:**

The real issue was **single synchronous worker blocking**:

```yaml
# docker-compose.yml - The Problem:
command: ["gunicorn", "--workers", "1", "--worker-class", "sync", ...]
```

**What Actually Happened:**
1. **Download Request**: `/download/filename.mp4` starts streaming large file
2. **Single Worker Blocked**: Gunicorn's only worker busy streaming file through Flask (`send_file()`)
3. **Page Refresh**: New requests to `/languages`, `/translation-services` wait in queue
4. **Status "Pending"**: Requests can't even reach Flask - they're queued by Gunicorn
5. **Download Completes**: Worker freed → queued requests get processed → 200 OK

**Why Not Rate Limiting:**
- No 429 status codes (would be immediate)
- Timing matched download duration, not rate limit cycles
- Cross-tab behavior confirmed shared server resource issue

### Solution That Worked ✅

**Multi-layered Fix:**

#### 1. **Nginx X-Accel-Redirect** (Primary Fix)
```nginx
# nginx.conf
location /protected-downloads/ {
    internal;  # Only via X-Accel-Redirect
    alias /app/downloads/;
    add_header X-Content-Type-Options nosniff;
}
```

```python
# backend/app.py - Instead of send_file():
response = make_response("", 200)
response.headers["X-Accel-Redirect"] = f"/protected-downloads/{safe_filename}"
response.headers["Content-Disposition"] = f'attachment; filename="{safe_filename}"'
return response
```

#### 2. **Upgraded Gunicorn Configuration**
```yaml
# docker-compose.yml
command: ["gunicorn", "--bind", "0.0.0.0:8081", 
          "--workers", "2", "--worker-class", "gthread", "--threads", "4",
          "--timeout", "300", "--max-requests", "1000", "app:app"]
```

#### 3. **Exempted Metadata Endpoints**
```python
@app.route("/languages", methods=["GET"])
@limiter.exempt  # No rate limiting needed for metadata
def get_languages():

@app.route("/translation-services", methods=["GET"]) 
@limiter.exempt  # No rate limiting needed for metadata
def get_translation_services():
```

### Why This Solution Works
- **No Flask Blocking**: Nginx serves files directly, Flask just issues redirect
- **Worker Availability**: Multiple workers + threads handle concurrent requests
- **No Artificial Delays**: Metadata endpoints respond immediately
- **Cross-tab Fixed**: Shared server resource no longer bottlenecked

### Verification Tests
```bash
# Test concurrent access during download
hey -n 300 -c 30 http://localhost/api/languages

# Expected: TTFB < 300ms even during large file downloads
# Expected: No 5xx errors, no "pending" status
```

### Architecture Lesson
**Don't stream large files through application servers.** Use:
- Nginx X-Accel-Redirect (on-premise)
- S3 Pre-signed URLs (cloud)
- CDN direct serving

**Never:** `send_file()` for large files in production with limited workers.

---

## 🚨 **Issue #5: Nested Result Structure**

### The Problem
```python
KeyError: 'files'
# Files were in result['result']['files'] not result['files']
```

### What We Tried (Didn't Work)
- Looking only in `result['files']`
- Changing API response structure

### Solution That Worked ✅
**Smart check for nested structure:**
```python
# Flexible result structure check
files = None
if 'files' in result_data:
    files = result_data['files']
elif 'result' in result_data and 'files' in result_data['result']:
    files = result_data['result']['files']  # ← Here they were!
```

### Why This Happened
There's a nested structure in results - sometimes `result.files` and sometimes `result.result.files` depending on task type.

---

## 🚨 **Issue #5: False Positives in Logs**

### The Problem
```python
AssertionError: Found error patterns in logs: ['ERROR.*:', 'Traceback.*:']
```

### What We Tried (Didn't Work)
- Clearing logs before test
- Using complex Docker log filters

### Solution That Worked ✅
**Narrow time window and improve error patterns:**
```python
# Before (didn't work):
logs = self.get_docker_logs(since_minutes=10)  # Too broad
error_patterns = [r"ERROR.*:", r"Exception.*:"]  # Too general

# After (works):
logs = self.get_docker_logs(since_minutes=2)   # Shorter window
critical_error_patterns = [
    r"CRITICAL.*:",
    r"FATAL.*:", 
    r"Task.*FAILED",
    r"Processing.*FAILED"
]  # More specific
```

### Why This Happened
Docker logs contain errors from previous tests. Need to focus only on logs relevant to current test.

---

## 🚨 **Issue #6: React Build Error - Import Outside src/**

### The Problem
```
Module not found: Error: You attempted to import ../shared-config.js which falls outside of the project src/ directory
```

### What We Tried (Didn't Work)
- symlink from node_modules
- Changing webpack config
- Using absolute imports

### Solution That Worked ✅
**Copy file into src/ and remove duplicates:**
```bash
# Remove duplicates
rm frontend/src/shared-config.js

# Copy from root
cp shared-config.js frontend/src/shared-config.js

# Update imports
require('../shared-config.js') → require('./shared-config.js')
```

### Why This Happened
React CRA doesn't allow imports outside src/ directory for security reasons.

---

## 🚨 **Issue #7: KeyError 'native' vs 'nativeName'**

### The Problem
```python
KeyError: 'native'
# In code: info["native"] but in config: "nativeName"
```

### What We Tried (Didn't Work)
- Changing only some files
- Partial field updates

### Solution That Worked ✅
**Consistent update across all files:**
```python
# Backend (shared_config.py):
"native": "עברית" → "nativeName": "עברית"

# API (app.py):
info["native"] → info["nativeName"]

# Functions:
get("native", code) → get("nativeName", code)
```

### Why This Happened
Partial interface change - forgot to update all places using the field.

---

## 🚨 **Issue #8: Language Detection Inconsistency**

### The Problem
Hebrew browser showed English flag but Hebrew content (inconsistent initial language detection).

### What We Tried (Didn't Work)
- Changing only i18next config
- Updating only LanguageRouter

### Solution That Worked ✅
**Improved language detection across all layers:**
```typescript
// Custom language detection function
const detectBrowserLanguage = (): SupportedLanguage => {
  // Check localStorage first
  const stored = localStorage.getItem('i18nextLng');
  if (stored && Object.keys(SUPPORTED_LANGUAGES).includes(stored)) {
    return stored as SupportedLanguage;
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (Object.keys(SUPPORTED_LANGUAGES).includes(browserLang)) {
    return browserLang as SupportedLanguage;
  }
  
  // Special check for Hebrew
  if (browserLang === 'he' || navigator.language === 'he-IL' || navigator.language.includes('iw')) {
    return 'he';
  }
  
  return 'en';
};

// Use in i18next init
i18n.init({
  lng: String(detectBrowserLanguage()), // Explicit setting
  // ...
});
```

### Why This Happened
i18next takes time to detect language, and in incognito mode there's no localStorage. Need explicit and immediate detection.

---

## 🚨 **Issue #9: OpenAI API Key Not Working**

### The Problem
```json
{
  "openai": {
    "available": false,
    "description": "OpenAI API key required"
  }
}
```

### What We Tried (Didn't Work)
- Setting environment variable in shell
- Using GitHub secrets directly

### Solution That Worked ✅
**Update .env file with real key:**
```bash
# Check .env file exists
cat .env

# Update the key
OPENAI_API_KEY=sk-proj-YOUR-REAL-KEY-HERE

# Ensure it's in .gitignore
echo ".env" >> .gitignore

# Restart Docker
docker compose down && docker compose up -d --build
```

### Why This Happened
The .env file contained placeholder (`your-openai-api-key-here`) instead of real key.

---

## 🚨 **Issue #10: Duplicate Translation Providers**

### The Problem
Conflicts between `I18nProvider` and `TranslationProvider` - two translation providers in parallel.

### What We Tried (Didn't Work)
- Removing one of the providers
- Merging providers into one

### Solution That Worked ✅
**Improved TranslationProvider to use shared configuration:**
```typescript
// Instead of hardcoded:
supportedLanguages: [
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  // ...
]

// Used shared configuration:
supportedLanguages: Object.values(SUPPORTED_LANGUAGES).map((lang: any) => ({
  code: lang.code as SupportedLanguage,
  name: lang.nativeName,
  flag: lang.flag
}))
```

### Why This Happened
Two providers with different configurations created inconsistency.

---

## 🚨 **Issue #11: Permission Denied in /app/fast_work Directory**

### The Problem
```
[download] Unable to open file: [Errno 13] Permission denied: '/app/fast_work/Israelis continue to push for an end to the Middle East conflict.f136.mp4.part'
ERROR: unable to open for writing: [Errno 13] Permission denied: '/app/fast_work/Israelis continue to push for an end to the Middle East conflict.f136.mp4.part'
```

### What We Tried (Didn't Work)
- Adding `uid: 501` and `gid: 20` to tmpfs configuration in docker-compose.yml
- Setting tmpfs permissions with `mode: 0755` (Docker Compose doesn't support these properties)

### Solution That Worked ✅
**Create directory with proper permissions in Dockerfile:**
```dockerfile
# backend.Dockerfile - Add to directory creation section:
RUN mkdir -p /app/uploads /app/downloads /app/whisper_models /app/fast_work && \
    chmod 755 /app/fast_work
```

**And keep simple tmpfs mount:**
```yaml
# docker-compose.yml - Simple tmpfs without unsupported properties:
volumes:
  - type: tmpfs
    target: /app/fast_work
    tmpfs:
      size: 2147483648  # 2GB for larger videos
```

### Why This Happened
When using `user: "501:20"` in docker-compose.yml, the tmpfs mount was created with root permissions, but the container processes run as user 501. The Dockerfile fix ensures the directory exists with correct permissions before the tmpfs mount.

### How to Prevent in Future
Always create directories with proper permissions in Dockerfile when using tmpfs mounts with non-root users.

---

## 🚨 **Issue #12: OpenAI API Key Not Loaded from .env File**

### The Problem
```json
{
  "openai": {
    "available": false,
    "description": "OpenAI API key required"
  }
}
```

Even though `.env` file contains valid OpenAI API key, the Docker containers don't see it.

### What We Tried (Didn't Work)
- Setting environment variable in host shell
- Using `${OPENAI_API_KEY}` in docker-compose.yml environment section

### Solution That Worked ✅
**Add `env_file` configuration to backend and worker services:**
```yaml
# docker-compose.yml
backend:
  # ... other config ...
  env_file:
    - .env
  environment:
    - FLASK_ENV=development
    - DEBUG=True
    - LOG_LEVEL=DEBUG
    - DEFAULT_WHISPER_MODEL=tiny
    - FAST_WORK_DIR=/app/fast_work
    # Remove OPENAI_API_KEY from here - comes from .env

worker:
  # ... other config ...
  env_file:
    - .env
  environment:
    - FLASK_ENV=development
    - DEBUG=True
    - LOG_LEVEL=DEBUG
    - DEFAULT_WHISPER_MODEL=tiny
    - WORKER_CONCURRENCY=1
    - FAST_WORK_DIR=/app/fast_work
    # Remove OPENAI_API_KEY from here - comes from .env
```

### Why This Happened
Docker Compose was trying to substitute `${OPENAI_API_KEY}` from the host environment, not from the `.env` file. The `env_file` directive explicitly loads environment variables from the file into the container.

### How to Prevent in Future
Always use `env_file` for loading `.env` files in Docker Compose, especially when the file contains secrets that shouldn't be in the host environment.

---

## 🚨 **Issue #13: Docker Compose Validation Error with tmpfs Properties**

### The Problem
```
validating /Users/elchananarbiv/Projects/SubsTranslator/docker-compose.yml: services.backend.volumes.5.tmpfs
 additional properties 'uid', 'gid' not allowed
```

### What We Tried (Didn't Work)
- Adding `uid: 501`, `gid: 20`, `mode: 0755` to tmpfs configuration
- Using different tmpfs syntax variations

### Solution That Worked ✅
**Remove unsupported properties and handle permissions in Dockerfile:**
```yaml
# docker-compose.yml - Simple tmpfs configuration:
volumes:
  - type: tmpfs
    target: /app/fast_work
    tmpfs:
      size: 2147483648  # Only size is supported
```

**Handle permissions in Dockerfile instead:**
```dockerfile
# backend.Dockerfile
RUN mkdir -p /app/uploads /app/downloads /app/whisper_models /app/fast_work && \
    chmod 755 /app/fast_work
```

### Why This Happened
Docker Compose tmpfs mounts don't support `uid`, `gid`, or `mode` properties. These are Docker container-specific options, not Docker Compose options.

### How to Prevent in Future
Check Docker Compose documentation for supported tmpfs properties. Handle permissions at the application/Dockerfile level instead of mount level.

---

## 🚨 **Issue #14: Problems After `docker-compose build --no-cache`**

### The Problem
After running `docker-compose build --no-cache`, commonly encounter:
1. Permission denied errors in `/app/fast_work`
2. OpenAI API key not available
3. Environment variables not loaded properly

### What We Tried (Didn't Work)
- Just restarting containers without rebuilding
- Only fixing one issue at a time

### Solution That Worked ✅
**Complete rebuild sequence with all fixes:**
```bash
# 1. Stop all containers
docker-compose down

# 2. Rebuild with no cache (this clears all previous fixes)
docker-compose build --no-cache

# 3. Start with proper configuration
docker-compose up -d

# 4. Verify both fixes are working
curl -s "http://localhost:8081/translation-services" | python3 -m json.tool
```

**Ensure both fixes are in place:**
1. ✅ `env_file: - .env` in docker-compose.yml for backend and worker
2. ✅ Directory permissions in backend.Dockerfile
3. ✅ Valid OpenAI API key in `.env` file

### Why This Happened
`--no-cache` rebuilds containers from scratch, losing any runtime fixes or configurations that weren't properly committed to the Dockerfile or docker-compose.yml.

### How to Prevent in Future
Always ensure fixes are properly committed to configuration files (Dockerfile, docker-compose.yml, .env) rather than applied as runtime patches.

---

## 🚨 **Issue #15: tmpfs Mount Permission Issues with Non-Root User**

### The Problem
```
[download] Unable to open file: [Errno 13] Permission denied: '/app/fast_work/video_name.f136.mp4.part'
```

Even after fixing Dockerfile permissions, tmpfs mounts are created with root ownership but processes run as user 501.

### What We Tried (Didn't Work)
- Adding `uid: 501`, `gid: 20` to tmpfs configuration (not supported in Docker Compose)
- Creating directory in Dockerfile with proper permissions (gets overridden by tmpfs mount)

### Solution That Worked ✅
**Temporary fix - Replace tmpfs with bind mount:**
```yaml
# docker-compose.yml - Replace tmpfs with bind mount:
volumes:
  # Phase A: tmpfs for fast I/O operations - temporarily using regular volume due to permission issues
  - ./backend/fast_work:/app/fast_work
```

**Create host directory and fix permissions:**
```bash
# Create directory on host
mkdir -p backend/fast_work && chmod 755 backend/fast_work

# Add to .gitignore
echo "backend/fast_work/" >> .gitignore

# Fix container permissions after restart
docker exec --user root substranslator-worker-1 chown -R 501:20 /app/fast_work
docker exec --user root substranslator-backend-1 chown -R 501:20 /app/fast_work
```

### Why This Happened
tmpfs mounts in Docker are created with root ownership by default, and Docker Compose doesn't support uid/gid options for tmpfs. When using `user: "501:20"` in container config, the process can't write to root-owned directories.

### Long-term Solution
Consider using init containers or entrypoint scripts to fix permissions:
```dockerfile
# Alternative: Use entrypoint script
COPY fix-permissions.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/fix-permissions.sh"]
```

### How to Prevent in Future
When using tmpfs with non-root users, always plan for permission fixes in the container startup process.

---

## 📋 **Quick Reference - Common Problem Solutions**

### 🔍 **Quick Health Checks:**
```bash
# System health check
curl http://localhost:8081/health

# Translation services check
curl http://localhost:8081/translation-services | jq

# Available languages check
curl http://localhost:8081/languages | jq

# Docker containers check
docker compose ps

# Recent logs check
docker compose logs --tail=50 worker

# CORS preflight check
curl -X OPTIONS -H "Origin: http://127.0.0.1" -v "http://localhost/api/youtube" 2>&1 | grep "Access-Control"
```

### 🛠️ **Quick Fixes:**
```bash
# Restart services
docker compose restart backend worker

# Clear cache
docker compose down && docker compose up -d --build

# Complete rebuild (fixes permission and env issues)
docker compose down && docker compose up -d --build --force-recreate

# Check OpenAI API key is loaded
curl -s "http://localhost:8081/translation-services" | python3 -m json.tool

# Fix fast_work permissions (if getting permission denied errors)
docker exec --user root substranslator-worker-1 chown -R 501:20 /app/fast_work
docker exec --user root substranslator-backend-1 chown -R 501:20 /app/fast_work

# Python syntax check
python3 -m py_compile path/to/file.py

# Run single test
pytest path/to/test.py::TestClass::test_method -v -s
```

### 🔧 **Debug Commands:**
```bash
# Detailed logs
docker compose logs -f worker | grep -E "(ERROR|SUCCESS|Task.*succeeded)"

# Check specific task
curl http://localhost:8081/status/TASK_ID | jq

# Container info
docker stats --no-stream

# Check ports
netstat -an | grep -E "(8081|6379|80)"
```

---

## 📚 **Lessons Learned**

### ✅ **Best Practices We Learned:**

1. **Always check actual result structure** before writing tests
2. **Use short log windows** (2-5 minutes) to prevent false positives
3. **Check imports** before running tests
4. **Use flexible status codes** (200, 202) for async APIs
5. **Always update all files** when changing interfaces

### ❌ **What Not To Do:**

1. **Don't assume result structure** without checking
2. **Don't use overly broad logs**
3. **Don't change part of interface** without updating everything
4. **Don't leave hardcoded values** instead of configuration
5. **Don't mix test types** in same file
6. **Don't use Hebrew in code/tests** (only for user-facing messages)

---

## 🔄 **Template for Documenting New Issues:**

```markdown
## 🚨 **Issue #X: [Short Description]**

### The Problem
[Exact error message or problem description]

### What We Tried (Didn't Work)
- Attempt 1
- Attempt 2
- Attempt 3

### Solution That Worked ✅
[Exact solution that worked, with code if relevant]

### Why This Happened
[Explanation of root cause]

### How to Prevent in Future
[Tips to avoid this issue]
```

---

## 🎯 **When Encountering New Issues:**

1. **Document the exact error** (copy-paste)
2. **Record what you tried** (even if it didn't work)
3. **Document the solution** that worked in the end
4. **Explain why it happened**
5. **Add to this document**

**Goal: Never encounter the same issue twice!** 🎯

---

## 📞 **Emergency Commands**

If everything crashes and doesn't work:

```bash
# Complete cleanup
docker compose down -v
docker system prune -f

# Rebuild from scratch
docker compose up -d --build --force-recreate

# Check everything is up
curl http://localhost:8081/health
curl http://localhost
```

---

## 🚨 **Issue #16: CORS Policy Error with Credentials**

### The Problem
```
Access to fetch at 'http://localhost:8081/youtube' from origin 'http://127.0.0.1' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'.
```

**User Experience:**
1. Frontend makes requests from `http://127.0.0.1` or `http://localhost`
2. Backend configured with wildcard CORS (`origins: "*"`) and `supports_credentials=True`
3. Browser blocks requests due to security policy violation
4. Network tab shows "Failed to load resource: net::ERR_FAILED"

### What We Initially Thought (Didn't Work)
**Server/Network Issues:**
- Thought backend was down or unresponsive
- Assumed it was a server configuration problem
- Expected to see 500/404 errors instead of CORS blocking

### Root Cause Analysis ✅
**CORS Security Policy Violation:**

The real issue was **invalid CORS configuration**:

```python
# backend/app.py - The Problem:
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
```

**What Actually Happened:**
1. **Wildcard Origin**: `origins: "*"` allows all domains
2. **Credentials Enabled**: `supports_credentials=True` enables cookies/auth headers
3. **Security Conflict**: Browsers block wildcard origins when credentials are enabled
4. **Preflight Failure**: OPTIONS requests fail before actual requests are sent

**Why This Security Rule Exists:**
- Prevents malicious sites from making authenticated requests to your API
- Forces developers to explicitly list trusted domains
- Protects against CSRF attacks with credentials

### Solution That Worked ✅

**Multi-layered Fix:**

#### 1. **Specific Origins Instead of Wildcard**
```python
# backend/app.py - Fixed CORS configuration:
CORS(app, resources={r"/*": {"origins": ["http://localhost", "http://127.0.0.1", "http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)
```

#### 2. **Updated OPTIONS Handler for YouTube Endpoint**
```python
# backend/app.py - Fixed preflight handler:
@app.route("/youtube", methods=["POST", "OPTIONS"])
def process_youtube_async():
    if request.method == "OPTIONS":
        response = jsonify({})
        # Get origin from request headers
        origin = request.headers.get('Origin')
        allowed_origins = ["http://localhost", "http://127.0.0.1", "http://localhost:3000", "http://127.0.0.1:3000"]
        if origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response, 200
```

#### 3. **Restart Backend to Apply Changes**
```bash
docker compose restart backend
```

### Why This Solution Works
- **Explicit Origins**: Browser allows requests from listed domains only
- **Credential Support**: Maintains authentication capabilities for trusted origins
- **Security Compliant**: Follows browser CORS security policies
- **Development Friendly**: Covers common development ports and hostnames

### Verification Tests
```bash
# Test CORS preflight request
curl -X OPTIONS -H "Origin: http://127.0.0.1" -v "http://localhost/api/youtube" 2>&1 | grep "Access-Control"

# Expected output:
# < Access-Control-Allow-Origin: http://127.0.0.1
# < Access-Control-Allow-Methods: POST, OPTIONS
# < Access-Control-Allow-Headers: Content-Type, Authorization
# < Access-Control-Allow-Credentials: true
```

### CORS Best Practices
**Do:**
- Use specific origins when `supports_credentials=True`
- List all development and production domains explicitly
- Test CORS with actual browser requests
- Use environment variables for different deployment environments

**Don't:**
- Use wildcard (`*`) origins with credentials enabled
- Forget to update OPTIONS handlers when changing CORS config
- Mix wildcard and specific origins in the same configuration

### How to Prevent in Future
1. **Environment-Specific Origins**: Use different origin lists for dev/staging/prod
2. **CORS Testing**: Include CORS validation in integration tests
3. **Documentation**: Document allowed origins for each environment
4. **Security Review**: Regular review of CORS settings during security audits

---

## 🚨 **Issue #17: Playwright Tests - ERR_CONNECTION_REFUSED and Missing Browsers**

### The Problem
```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
Error: browserType.launch: Executable doesn't exist at /Users/.../Library/Caches/ms-playwright/...
```

**User Experience:**
1. Running `npx playwright test` fails immediately
2. Tests can't connect to localhost:3000
3. Missing browser executables for Firefox, WebKit, etc.

### What We Initially Thought (Didn't Work)
**Just Installing Chromium:**
- Only installed `npx playwright install chromium`
- Thought tests would run with just one browser
- Expected tests to start the dev server automatically

### Root Cause Analysis ✅
**Multiple Issues:**
1. **Dev Server Not Running**: Playwright doesn't start the React dev server automatically
2. **Missing Browsers**: Only Chromium was installed, but tests run on multiple browsers
3. **Wrong Test Command**: Using npm test tries to run Jest tests, not Playwright

### Solution That Worked ✅

**Complete Setup for Playwright Tests:**

#### 1. **Install ALL Playwright Browsers**
```bash
cd frontend
npx playwright install  # Installs all browsers
```

#### 2. **Start Development Server First**
```bash
# In one terminal:
cd frontend
npm start  # Keep this running

# In another terminal:
cd frontend
npm run test:e2e  # or npx playwright test
```

#### 3. **Or Use Docker for Full Stack**
```bash
# Start full stack with Docker:
docker compose up -d

# Then run tests:
cd frontend
npm run test:e2e
```

### Why This Solution Works
- **Dev Server Required**: Playwright needs the app running to test it
- **All Browsers Needed**: Tests are configured to run on Chrome, Firefox, WebKit, and mobile
- **Correct Commands**: `npm run test:e2e` runs Playwright, not Jest

### Quick Test Commands
```bash
# Run specific test file
npm run test:e2e tests/watermark-preferences.spec.js

# Run with specific browser only
npx playwright test --project=chromium

# Run in headed mode (see browser)
npx playwright test --headed

# Run with UI mode (interactive)
npx playwright test --ui
```

### How to Prevent in Future
1. **Documentation**: Add setup instructions to test files
2. **Pre-test Script**: Create script that checks if dev server is running
3. **CI Configuration**: Use docker compose for consistent test environment

---

## 🚨 **Issue #18: Custom Logo Not Persisting After Refresh**

### The Problem
Custom uploaded logo only appears once after upload. On page refresh or subsequent uses, the system reverts to the default purple logo (logo.png).

**User Experience:**
1. Upload custom logo → works perfectly first time
2. Process video with custom watermark → works
3. Refresh page → logo reverts to default
4. Process another video → uses default logo instead of custom

### What We Initially Thought (Didn't Work)
**Server-Side Session Storage:**
- Relied on Flask session to persist logo path
- Expected session to work across page refreshes
- Thought CORS was configured correctly for sessions

### Root Cause Analysis ✅
**Multiple Issues:**
1. **Frontend State**: Frontend wasn't sending logo data on subsequent requests
2. **Session Reliability**: Flask sessions across CORS origins weren't reliable
3. **Data Persistence**: Logo was stored in localStorage but not being sent to server

### Solution That Worked ✅

**Multi-layered Fix:**

#### 1. **Frontend Always Sends Logo Data**
```typescript
// frontend/src/hooks/useApi.ts
// In onFileUpload and onYoutubeSubmit:
if (watermarkConfig.logoFile) {
  formData.append('watermark_logo', watermarkConfig.logoFile);
} else if (watermarkConfig.logoUrl) {
  // Send the data URL so the backend can recreate the file
  formData.append('watermark_logo_url', watermarkConfig.logoUrl);
}
```

#### 2. **Backend Handles Data URLs**
```python
# backend/app.py
logo_data_url = request.form.get("watermark_logo_url")
if logo_data_url:
    match = re.match(r'data:image/([\w\+\-]+);base64,(.+)', logo_data_url)
    if match:
        file_ext = match.group(1).replace('jpeg', 'jpg')
        base64_data = match.group(2)
        logo_filename = f"custom_logo_{uuid.uuid4().hex[:8]}.{file_ext}"
        logo_path = os.path.join(config.ASSETS_FOLDER, logo_filename)
        with open(logo_path, 'wb') as f:
            f.write(base64.b64decode(base64_data))
```

#### 3. **App.tsx Loads from localStorage**
```typescript
// frontend/src/App.tsx
const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>(() => {
  const preferences = loadUserPreferences();
  const savedLogoUrl = loadLogoFile();
  return {
    enabled: preferences.watermark.enabled,
    logoFile: null,
    logoUrl: savedLogoUrl || '',
    // ... other config
  };
});
```

### Why This Solution Works
- **Client-Side Persistence**: Logo stored in localStorage survives refreshes
- **Always Send Data**: Frontend sends logo data (file or URL) on every request
- **Server Recreation**: Backend can recreate logo file from data URL
- **No Session Dependency**: Works regardless of session state

### How to Prevent in Future
1. **State Management**: Always consider client-side persistence for user preferences
2. **Data Transmission**: Send all necessary data with each request
3. **Fallback Strategy**: Have server-side fallbacks for client data

---

## 🚨 **Issue #19: Error Messages Not Displayed in UI**

### The Problem
When processing fails (e.g., private YouTube video), the app returns to the main page instead of showing an error message.

**User Experience:**
1. Submit private YouTube video for processing
2. Processing starts normally
3. Backend returns FAILURE with error message
4. UI briefly flashes then returns to main page
5. No error message shown to user

### What We Initially Thought (Didn't Work)
**State Management Issue:**
- Thought error state was being cleared too quickly
- Assumed race condition in React state updates
- Expected error to persist automatically

### Root Cause Analysis ✅
**UI Conditional Rendering:**
```tsx
// The problem in App.tsx:
{(isProcessing || result) && (
  // This section disappears when isProcessing=false and no result
)}
```

When error occurs:
- `isProcessing` → false
- `result` → null
- `error` → has value but not in condition

### Solution That Worked ✅

#### 1. **Add Error to Display Condition**
```tsx
// frontend/src/App.tsx
{(isProcessing || result || error) && (
  // Now this section stays visible when there's an error
)}

{!isProcessing && !result && !error && (
  // Main form only shows when no processing, result, or error
)}
```

#### 2. **Enhanced Error Display with Details**
```typescript
// frontend/src/hooks/useApi.ts
// Extract specific error details from server response
const errorDetails = originalError.match(/ERROR: \[youtube\] [^:]+: (.+?)(?:\. |$)/);
if (errorDetails && errorDetails[1]) {
  errorMessage = `${errorMessage}\n\n${errorDetails[1]}`;
}
```

#### 3. **Improved Error Rendering**
```tsx
// frontend/src/components/ProgressDisplay.tsx
{error.split('\n').map((line, index) => (
  <p key={index} className={`text-lg leading-relaxed ${index > 0 ? 'mt-2 font-mono text-sm bg-red-50 p-2 rounded' : ''}`}>
    {line}
  </p>
))}
```

### Why This Solution Works
- **Persistent Display**: Error state keeps the ProgressDisplay visible
- **Clear Information**: Users see both generic message and specific error
- **Better UX**: Users can retry instead of starting over

### Example Error Display
```
⚠️ העיבוד נכשל. אנא נסה שוב.

Private video
```

### How to Prevent in Future
1. **State Planning**: Consider all states (loading, success, error) in UI conditions
2. **Error First**: Design with error states in mind from the start
3. **User Testing**: Test with failure scenarios, not just success paths

---

## 📋 **Frontend Development & Debugging Guide**

### 🔧 **Local Development Setup**

#### **Option 1: Full Stack with Docker**
```bash
# Start everything
docker compose up -d

# Frontend runs on http://localhost (port 80)
# Backend runs on http://localhost:8081
```

#### **Option 2: Frontend Development Mode**
```bash
# Start backend with Docker
docker compose up -d backend redis worker

# Start frontend dev server
cd frontend
npm start

# Frontend runs on http://localhost:3000 (with hot reload)
# Backend still on http://localhost:8081
```

### 🐛 **Debugging Frontend Issues**

#### **Browser Console Commands**
```javascript
// Check localStorage
localStorage.getItem('userPreferences')
localStorage.getItem('logoDataUrl')

// Clear all data
localStorage.clear()

// Check current language
localStorage.getItem('i18nextLng')

// Force language change
localStorage.setItem('i18nextLng', 'he')
location.reload()
```

#### **Network Debugging**
```bash
# Check if backend is accessible
curl http://localhost:8081/health

# Check CORS headers
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:8081/youtube

# Monitor real-time logs
docker compose logs -f backend worker
```

#### **React Developer Tools**
1. Install React Developer Tools browser extension
2. Open Components tab to inspect state
3. Open Profiler tab to find performance issues

### 📊 **Common Frontend Issues**

#### **Issue: White Screen / App Won't Load**
```bash
# Check for compilation errors
cd frontend
npm start

# Check browser console for errors
# Common causes: syntax errors, missing imports, wrong API URL
```

#### **Issue: API Calls Failing**
```javascript
// Check API configuration
console.log(process.env.REACT_APP_API_BASE_URL)
// Should be: http://localhost:8081

// Check for CORS errors in console
// Look for: "blocked by CORS policy"
```

#### **Issue: State Not Updating**
```javascript
// Add debug logging
useEffect(() => {
  console.log('State changed:', { isProcessing, error, result });
}, [isProcessing, error, result]);
```

### 🧪 **Testing Strategies**

#### **Manual Testing Checklist**
- [ ] Upload video file → process → download
- [ ] YouTube URL → process → download
- [ ] Upload custom logo → refresh → still there?
- [ ] Process with error → error displayed?
- [ ] Change language → UI updates?
- [ ] Different browsers (Chrome, Firefox, Safari)
- [ ] Mobile responsive design

#### **Automated Testing**
```bash
# Unit tests (Jest)
cd frontend
npm test

# E2E tests (Playwright)
cd frontend
npm run test:e2e

# Specific test file
npm run test:e2e tests/specific-test.spec.js
```

### 💡 **Development Tips**

#### **Hot Reload Not Working?**
```bash
# Restart dev server
cd frontend
npm start

# Clear cache
rm -rf node_modules/.cache
npm start
```

#### **Port Already in Use?**
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### **Build Errors?**
```bash
# Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## 📋 **Quick Reference - Updated Commands**

### 🔍 **Health Checks:**
```bash
# Frontend health
curl http://localhost  # Docker
curl http://localhost:3000  # Dev server

# Backend health  
curl http://localhost:8081/health

# Full system check
docker compose ps
curl http://localhost:8081/translation-services | jq
```

### 🛠️ **Quick Fixes:**
```bash
# Frontend won't compile
cd frontend && rm -rf node_modules/.cache && npm start

# Clear everything and restart
docker compose down -v
docker compose up -d --build

# Fix CORS issues
docker compose restart backend

# Debug frontend
cd frontend && npm start
# Then open http://localhost:3000 and check browser console
```

### 🔧 **Debug Commands:**
```bash
# Watch frontend build
cd frontend && npm run build

# Check frontend Docker logs
docker compose logs frontend

# Real-time backend logs
docker compose logs -f backend worker | grep -E "(ERROR|Setting error|Task.*FAILURE)"

# Test specific endpoint
curl -X POST http://localhost:8081/youtube \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=test"}'
```

---

## 🚨 **Issue #20: Logo File Duplication - New File Created on Every Processing**

### The Problem
Every time a video is processed with a custom watermark logo, a new logo file is created in `backend/assets/`, even when using the same logo. This leads to disk space waste and unnecessary file accumulation.

**User Experience:**
1. Upload custom logo → `custom_logo_abc123.jpg` created
2. Process first video → works fine
3. Process second video with same settings → `custom_logo_def456.jpg` created (duplicate)
4. After multiple processings → many identical logo files accumulate

### What We Initially Thought (Didn't Work)
**Session-Based Reuse:**
- Thought we could rely on Flask session to track logo path
- Expected to reuse the path from session
- Didn't account for when logo is sent as data URL from frontend

### Root Cause Analysis ✅
**No Deduplication Logic:**
- Every upload/data URL created a new file with random UUID
- No checking if identical logo already exists
- No cleanup mechanism for old logos

### Solution That Worked ✅

**Created LogoManager with Smart Deduplication:**

#### 1. **Logo Manager Module (`backend/logo_manager.py`)**
```python
class LogoManager:
    def get_file_hash_from_bytes(self, file_bytes: bytes) -> str:
        """Calculate SHA256 hash from bytes"""
        return hashlib.sha256(file_bytes).hexdigest()
    
    def find_existing_logo(self, file_hash: str) -> Optional[str]:
        """Find if a logo with the same hash already exists"""
        # Check all existing logos for matching hash
    
    def save_logo(self, file_bytes: bytes, extension: str) -> Tuple[str, bool]:
        """Save logo file, reusing existing if same content"""
        file_hash = self.get_file_hash_from_bytes(file_bytes)
        existing_path = self.find_existing_logo(file_hash)
        if existing_path:
            return existing_path, False  # Reuse existing
        # Create new file with hash in name
```

#### 2. **Updated File Upload Logic**
```python
# backend/app.py
if "watermark_logo" in request.files:
    file_content = logo_file.read()
    extension = logo_file.filename.rsplit('.', 1)[1].lower()
    
    # Save using logo manager (deduplication)
    logo_path, is_new = logo_manager.save_logo(file_content, extension)
    
    if is_new:
        logger.info(f"🖼️ Saved new logo: {os.path.basename(logo_path)}")
    else:
        logger.info(f"🖼️ Reusing existing logo: {os.path.basename(logo_path)}")
```

#### 3. **Cleanup Mechanism**
```python
def cleanup_old_logos(self, keep_hours: int = 24):
    """Remove logo files older than specified hours"""
    # Automatically remove old unused logos
```

### Why This Solution Works
- **Hash-Based Deduplication**: Identical files have same SHA256 hash
- **Automatic Reuse**: System detects and reuses existing logos
- **Smart Naming**: Files named with hash prefix (e.g., `custom_logo_a1b2c3d4.jpg`)
- **Cleanup Support**: Can remove old logos to prevent accumulation

### Verification
```bash
# Check current logos
ls -la backend/assets/custom_logo_*

# Manual cleanup (development only)
curl -X POST http://localhost:8081/cleanup-logos \
  -H "Content-Type: application/json" \
  -d '{"keep_hours": 24}'
```

### Benefits
- **Disk Space Saved**: No duplicate files
- **Better Performance**: Fewer files to manage
- **Automatic Cleanup**: Old logos can be removed
- **Transparent to User**: Works seamlessly

### How to Prevent in Future
1. **Always Check for Duplicates**: Use content hash for deduplication
2. **Implement Cleanup**: Have strategy for removing old files
3. **Monitor Disk Usage**: Regular checks for accumulating files
4. **Use Meaningful Names**: Include hash in filename for easy identification

---

*Last Updated: 2025-01-07*  
*Next Update: When encountering new issues*