# 🧪 Testing Guide - SubsTranslator

## Test Structure Overview

```
📁 Project Root
├── 🔧 backend/tests/
│   ├── unit/         # Fast, isolated tests
│   ├── integration/  # Component interaction tests  
│   └── e2e/         # Full workflow tests
├── ⚛️ frontend/tests/
│   ├── unit/         # Component & hook tests
│   ├── integration/  # Feature integration tests
│   └── e2e/         # User workflow tests
└── 🚀 run_tests.py   # Universal test runner
```

## Test Types Explained

### 🔬 **Unit Tests** (Fast: < 1s each)
- **Purpose**: Test individual functions/classes in isolation
- **Dependencies**: Mocked/stubbed
- **Examples**: Configuration parsing, utility functions, component rendering

### 🔗 **Integration Tests** (Medium: 1-10s each)  
- **Purpose**: Test component interactions
- **Dependencies**: Real services with controlled data
- **Examples**: API endpoints, database operations, service integrations

### 🌐 **E2E Tests** (Slow: 10s-5min each)
- **Purpose**: Test complete user workflows
- **Dependencies**: Full system running
- **Examples**: Video processing, file upload, UI automation

## Running Tests

### Specialized Test Runners
```bash
# Online Video E2E tests
python test_online_video.py                    # All Online Video tests
python test_online_video.py --model tiny       # Test tiny model only
python test_online_video.py --service openai   # Test OpenAI only
python test_online_video.py --download-only    # Test download functionality only
python test_online_video.py --verbose          # Verbose output
```

### Universal Test Runner

#### **Main Command - Run Everything:**
```bash
python run_tests.py
# Runs ALL tests from the new structure:
# - Backend: unit (16) + integration (11) + e2e (10) = 37 tests
# - Frontend: unit (0) + integration (1) + e2e (2) = 3 tests
# Total: 40 tests (~15-25 minutes)

python run_tests.py --verbose
# Same as above but with detailed output
# Shows individual test names, progress, print statements, and detailed results
```

#### **By Test Type:**
```bash
python run_tests.py unit         # Fast tests only (~2-3 min)
python run_tests.py unit --verbose      # Same with detailed output
python run_tests.py integration  # Component interaction tests (~5-8 min)
python run_tests.py e2e          # Full workflow tests (~10-15 min)
python run_tests.py e2e --verbose       # E2E with detailed progress
```

#### **By Component:**
```bash
python run_tests.py all backend   # All backend tests (37 tests, ~10-15 min)
python run_tests.py all frontend  # All frontend tests (3 tests, ~2-3 min)
```

#### **Combined (Specific):**
```bash
python run_tests.py unit backend      # Backend unit tests only (16 tests, ~1 min)
python run_tests.py unit backend --verbose    # Same with detailed output
python run_tests.py e2e backend       # Backend E2E only (10 tests, ~8-12 min)
python run_tests.py e2e backend --verbose     # E2E with detailed progress
python run_tests.py integration frontend  # Frontend integration only (1 test, ~30s)
```

#### **Help & Options:**
```bash
python run_tests.py --help           # Show all available options
python run_tests.py -v               # Short form of --verbose
```

### Backend Tests (Python/pytest)
```bash
# All backend tests
pytest backend/tests/

# By type
pytest backend/tests/unit/ -m unit
pytest backend/tests/integration/ -m integration
pytest backend/tests/e2e/ -m e2e

# Specific markers
pytest -m "unit and not slow"
pytest -m "openai" --openai-key=sk-...
```

### Frontend Tests (Jest/Playwright)
```bash
cd frontend/

# Unit tests (Jest)
npm test -- --testPathPattern=unit

# Integration tests (Jest)  
npm test -- --testPathPattern=integration

# E2E tests (Playwright)
npx playwright test tests/e2e/
```

## Quick Start Examples

### **🚀 Most Common Commands:**

```bash
# Run everything (comprehensive test)
python run_tests.py
# → 40 tests total: Backend (37) + Frontend (3)
# → Time: ~15-25 minutes

# Quick feedback (development)
python run_tests.py unit
# → 16 tests total: Backend unit tests only  
# → Time: ~1-2 minutes

# Test new Online Video features
python test_online_video.py
# → 6 tests: YouTube processing with different models/services
# → Time: ~2-3 minutes

# Backend only (skip frontend)
python run_tests.py all backend
# → 37 tests: unit + integration + e2e
# → Time: ~10-15 minutes
```


### **🎯 What Each Command Tests:**

| Command | Backend | Frontend | Total | Time |
|---------|---------|----------|-------|------|
| `python run_tests.py` | 37 tests | 3 tests | **40** | 15-25 min |
| `python run_tests.py --verbose` | 37 tests | 3 tests | **40** | 15-25 min* |
| `python run_tests.py unit` | 16 tests | 0 tests | **16** | 1-2 min |
| `python run_tests.py unit --verbose` | 16 tests | 0 tests | **16** | 1-2 min* |
| `python run_tests.py e2e` | 10 tests | 2 tests | **12** | 8-15 min |
| `python test_online_video.py` | 6 tests | 0 tests | **6** | 2-3 min |
| `python test_online_video.py --test tiny-google` | 1 test | 0 tests | **1** | 30-45 sec |
| `python test_online_video.py --test tiny-openai` | 1 test | 0 tests | **1** | 30-45 sec |
| `python test_online_video.py --test large-google` | 1 test | 0 tests | **1** | 30-45 sec |
| `python test_online_video.py --test large-openai` | 1 test | 0 tests | **1** | 30-45 sec |
| `python test_online_video.py --test download-only` | 1 test | 0 tests | **1** | 15-30 sec |
| `python test_online_video.py --test error-handling` | 1 test | 0 tests | **1** | 10-20 sec |

*\* Same tests, but with detailed output showing individual test names and progress*

## Test Count by Category

### Backend Tests  
- **Unit**: 16 tests (translation services, config, utilities, exceptions)
- **Integration**: 11 tests (API endpoints, system health, i18n, Docker integration)
- **E2E**: 10 tests (file upload, YouTube processing, OpenAI workflows, **6 new Online Video tests**)

### Frontend Tests  
- **Unit**: 0 tests (to be created)
- **Integration**: 1 test (localization)
- **E2E**: 2 tests (comprehensive workflows, watermark preferences)

## Test Markers & Tags

### Backend (pytest markers)
```python
@pytest.mark.unit          # Fast unit test
@pytest.mark.integration   # Integration test
@pytest.mark.e2e          # End-to-end test
@pytest.mark.slow         # Takes > 30 seconds
@pytest.mark.openai       # Requires OpenAI API key
```

### Frontend (Jest/Playwright)
```javascript
// Jest
describe.skip()     // Skip test group
test.only()        // Run only this test

// Playwright  
test.describe()    // Group tests
test.slow()       // Mark as slow test
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# Fast feedback loop
- name: Unit Tests
  run: python run_tests.py unit

# Thorough validation  
- name: Integration Tests
  run: python run_tests.py integration
  
# Full validation (on main branch)
- name: E2E Tests
  run: python run_tests.py e2e
  if: github.ref == 'refs/heads/main'
```

## Best Practices

### ✅ Do
- Keep unit tests under 1 second each
- Use descriptive test names
- Test one thing per test
- Mock external dependencies in unit tests
- Use real data in integration tests
- Test happy path + edge cases

### ❌ Don't
- Mix test types in same file
- Make tests dependent on each other
- Use production data in tests
- Skip cleanup in e2e tests
- Test implementation details

## Adding New Tests

### 1. Choose the Right Type
- **Unit**: Testing a pure function? → `backend/tests/unit/`
- **Integration**: Testing API endpoint? → `backend/tests/integration/`
- **E2E**: Testing user workflow? → `backend/tests/e2e/`

### 2. Use Proper Naming
```
test_[component]_[scenario]_[expected_outcome].py
test_translation_service_with_invalid_key_raises_error.py
test_api_upload_with_large_file_returns_413.py
```

### 3. Add Appropriate Markers
```python
@pytest.mark.unit
def test_config_parser_validates_yaml():
    pass

@pytest.mark.integration  
def test_api_health_endpoint_returns_200():
    pass

@pytest.mark.e2e
@pytest.mark.slow
def test_youtube_video_processing_end_to_end():
    pass
```

## Troubleshooting

### Common Issues
- **Import errors**: Check PYTHONPATH and `sys.path` setup
- **Slow tests**: Move to integration/e2e category
- **Flaky tests**: Add proper cleanup and isolation
- **Missing dependencies**: Check test requirements.txt

### Debug Commands
```bash
# Verbose output
pytest -v -s backend/tests/unit/

# Stop on first failure
pytest -x backend/tests/

# Run specific test
pytest backend/tests/unit/test_config.py::test_specific_function

# Debug with pdb
pytest --pdb backend/tests/unit/
```
