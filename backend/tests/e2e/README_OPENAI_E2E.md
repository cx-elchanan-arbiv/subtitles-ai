# 🧪 OpenAI E2E Tests

## Overview

The `test_openai_e2e.py` file contains **critical end-to-end tests** that verify the complete OpenAI translation flow works correctly in production.

## Why These Tests Are Critical

### 🚨 **Gap in Current Testing**
- **All existing E2E tests use Google Translate only**
- **No test verifies OpenAI translation actually works**
- **No test checks Hebrew output quality**
- **No test verifies real API key usage**

### 💥 **What Could Break Silently**
Without these tests, the following could break without detection:
- OpenAI API key validation
- Translation service selection in UI
- Hebrew translation quality
- API authentication
- Error handling and fallbacks

## Test Categories

### 1. Full Flow Test (`test_openai_translation_complete_flow`)
**What it tests:**
- Complete YouTube → OpenAI → Hebrew video pipeline
- Verifies OpenAI service is actually used (not Google fallback)
- Checks for translation success in logs
- Ensures no authentication failures
- Validates Hebrew subtitle generation

### 2. Quality Check (`test_openai_translation_quality_check`)
**What it tests:**
- OpenAI produces actual Hebrew translations
- No fallback to original English text
- Proper language detection
- Subtitle file creation

### 3. Unavailable Handling (`test_openai_unavailable_fallback`)
**What it tests:**
- Graceful handling when OpenAI is not available
- Proper error messages or fallback behavior
- No silent failures

### 4. Service Detection (`test_translation_services_endpoint_reflects_openai_status`)
**What it tests:**
- `/translation-services` endpoint accuracy
- UI gets correct availability information
- Proper descriptions for available/unavailable states

## Running the Tests

### ⚠️ **Prerequisites**
These tests require:
1. **Valid OpenAI API key** in `.env` file
2. **Running backend services** (`docker compose up`)
3. **Internet connection** for YouTube downloads

### 🚀 **Run with Real OpenAI Key**
```bash
# Set environment flag to enable OpenAI tests
export TEST_OPENAI_E2E=1

# Run the OpenAI E2E tests
python -m pytest tests/test_openai_e2e.py -v -s

# Run specific test
python -m pytest tests/test_openai_e2e.py::TestOpenAITranslationE2E::test_openai_translation_complete_flow -v -s
```

### 🧪 **Run Without OpenAI Key (Limited)**
```bash
# Run only the availability detection test
python -m pytest tests/test_openai_e2e.py::TestOpenAIServiceAvailability -v -s

# Run fallback handling test (when OpenAI unavailable)
python -m pytest tests/test_openai_e2e.py::TestOpenAITranslationE2E::test_openai_unavailable_fallback -v -s
```

## Expected Behavior

### ✅ **With Valid OpenAI Key**
- All tests should pass
- Logs should show "Using OpenAI for translation"
- Hebrew subtitles should be generated
- No authentication errors

### ❌ **With Invalid/Missing Key**
- `test_openai_translation_complete_flow` should be skipped
- `test_openai_unavailable_fallback` should test error handling
- Service availability should report `"available": false`

## Integration with CI/CD

### GitHub Actions Setup
```yaml
# .github/workflows/e2e-tests.yml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  TEST_OPENAI_E2E: 1

jobs:
  e2e-openai:
    runs-on: ubuntu-latest
    steps:
      - name: Run OpenAI E2E Tests
        run: |
          docker compose up -d
          python -m pytest tests/test_openai_e2e.py -v
```

### Local Development
```bash
# Add to your .env file
OPENAI_API_KEY=sk-your-real-key-here

# Enable E2E testing
echo "TEST_OPENAI_E2E=1" >> .env

# Run tests
./scripts/run_tests.py --category e2e --include-slow
```

## Troubleshooting

### Common Issues

#### "OpenAI service not available"
- Check your `.env` file has valid `OPENAI_API_KEY`
- Verify key starts with `sk-` and is not placeholder
- Restart backend: `docker compose restart backend`

#### "Task did not complete within timeout"
- OpenAI can be slower than Google Translate
- Increase timeout in test if needed
- Check backend logs: `docker compose logs -f worker`

#### "No evidence of OpenAI usage in logs"
- Verify task actually used OpenAI (not fallback to Google)
- Check for authentication errors in logs
- Ensure API key has sufficient quota

## Maintenance

### When to Update These Tests
- After changes to OpenAI integration
- After changes to translation service selection
- After changes to error handling
- When adding new translation services

### Test Data
- Uses short YouTube videos for faster testing
- Fallback URLs in case primary test video becomes unavailable
- Configurable via environment variables if needed
