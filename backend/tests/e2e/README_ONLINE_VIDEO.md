# 📺 Online Video E2E Tests

## Overview
Comprehensive end-to-end tests for YouTube/Online Video processing workflows.

Test URL: [https://www.youtube.com/watch?v=E6ZCY099A8s](https://www.youtube.com/watch?v=E6ZCY099A8s)

## Test Coverage

### 🎯 **Model & Service Matrix Tests** (4 tests)
Tests all combinations of Whisper models and translation services:

| Whisper Model | Translation Service | Test Status |
|---------------|-------------------|-------------|
| `tiny`        | `google`          | ✅ Covered  |
| `tiny`        | `openai`          | ✅ Covered  |
| `large`       | `google`          | ✅ Covered  |
| `large`       | `openai`          | ✅ Covered  |

**Each test verifies:**
- ✅ Correct Whisper model is loaded and used
- ✅ Correct translation service is used  
- ✅ Task completes successfully
- ✅ All expected files are generated
- ✅ Docker logs show successful completion without errors

### 📥 **Download-Only Test** (1 test)
Tests the download-only functionality:
- ✅ Video downloads successfully
- ✅ No processing occurs (no transcription/translation)
- ✅ Task completes quickly (< 60 seconds)
- ✅ Logs show download completion
- ✅ No processing patterns in logs

### ❌ **Error Handling Test** (1 test)
Tests error handling with invalid URLs:
- ✅ Invalid YouTube URL handled gracefully
- ✅ Appropriate error message returned
- ✅ Task fails quickly with meaningful error

## Running the Tests

### Quick Start
```bash
# Run all Online Video tests
python test_online_video.py

# Run specific combinations
python test_online_video.py --model tiny --service google
python test_online_video.py --model large --service openai

# Test download-only functionality
python test_online_video.py --download-only

# Verbose output for debugging
python test_online_video.py --verbose
```

### Direct pytest
```bash
# All Online Video E2E tests
pytest backend/tests/e2e/test_online_video_workflows.py -v

# Specific test patterns
pytest backend/tests/e2e/test_online_video_workflows.py -k "tiny and google"
pytest backend/tests/e2e/test_online_video_workflows.py -k "download_only"
pytest backend/tests/e2e/test_online_video_workflows.py -k "error_handling"
```

## Prerequisites

### 🐳 **Docker Services**
All services must be running:
```bash
docker compose up -d
```

### 🔑 **OpenAI API Key** (for OpenAI tests)
Ensure OpenAI API key is configured:
```bash
# Check if OpenAI is available
curl http://localhost:8081/translation-services | jq '.openai.available'
```

### 🌐 **Internet Connection**
Tests require internet access for:
- YouTube video download
- Translation services (Google Translate, OpenAI API)

## Test Structure

### Test Class: `TestOnlineVideoWorkflows`
Located in: `backend/tests/e2e/test_online_video_workflows.py`

**Key Methods:**
- `wait_for_task_completion()` - Monitors task progress
- `get_docker_logs()` - Retrieves Docker logs for verification
- `verify_model_in_logs()` - Confirms correct Whisper model usage
- `verify_translation_service_in_logs()` - Confirms correct translation service
- `verify_successful_completion_in_logs()` - Ensures no errors occurred

### Fixtures (conftest.py)
- `ensure_backend_running` - Ensures backend is healthy before tests
- `check_required_services` - Verifies all required services are available
- `api_client` - Provides configured API client for tests
- `cleanup_downloads` - Cleans up after tests

## Log Verification Patterns

### Whisper Model Patterns
```python
# Patterns that confirm correct model loading
"Using forced model: {model}"
"Loading {model} model"
"Model {model} loaded.*successfully"
"=== LOADING FASTER-WHISPER MODEL: {MODEL} ==="
```

### Translation Service Patterns
```python
# Google Translate patterns
"Using Google.*translation"
"GoogleTranslator.*translate"
"Google.*translation.*successful"

# OpenAI patterns  
"Using OpenAI.*translation"
"OpenAI.*translation.*successful"
"HTTP Request: POST https://api.openai.com"
"Translating.*segments using OpenAI"
```

### Success/Error Patterns
```python
# Success indicators
"Task.*succeeded"
"Processing.*complete"
"✅.*completed"
"status.*SUCCESS"

# Error indicators (should NOT be present)
"Exception.*:"
"ERROR.*:"
"Traceback.*:"
"FAILED.*:"
"status.*FAILURE"
```

## Expected Test Duration

| Test Type | Expected Duration | Notes |
|-----------|------------------|-------|
| Model + Service Tests | 2-5 minutes each | Depends on video length and model |
| Download-Only | 10-30 seconds | No processing, just download |
| Error Handling | 5-10 seconds | Quick failure expected |

**Total Suite Duration: ~15-25 minutes** (depending on model loading times)

## Troubleshooting

### Common Issues

1. **Backend Not Running**
   ```bash
   # Solution
   docker compose up -d
   ```

2. **OpenAI Tests Failing**
   ```bash
   # Check API key
   curl http://localhost:8081/translation-services | jq '.openai'
   ```

3. **YouTube Access Issues**
   - Check internet connection
   - Verify test URL is still valid
   - Check Docker container has internet access

4. **Slow Tests**
   - Large model takes longer to load initially
   - Network speed affects download time
   - Consider using `--model tiny` for faster testing

### Debug Commands
```bash
# Check Docker logs during test
docker compose logs -f worker

# Run single test with full output
pytest backend/tests/e2e/test_online_video_workflows.py::TestOnlineVideoWorkflows::test_youtube_download_only -v -s

# Check backend health
curl http://localhost:8081/health | jq
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Online Video E2E Tests
  run: |
    # Start services
    docker compose up -d
    
    # Wait for services to be ready
    sleep 30
    
    # Run tests
    python test_online_video.py --verbose
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### Test Markers
- `@pytest.mark.e2e` - End-to-end test
- `@pytest.mark.slow` - Takes longer than 30 seconds
- `@pytest.mark.youtube` - Requires YouTube access
- `@pytest.mark.openai` - Requires OpenAI API key
