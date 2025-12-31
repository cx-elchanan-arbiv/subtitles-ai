# E2E Tests for SubsTranslator

End-to-end testing suite using Playwright for the SubsTranslator application.

## 📁 Directory Structure

```
e2e/
├── tests/
│   ├── smoke/           # Fast critical path checks (2-5 min)
│   ├── critical/        # Main user journeys (5-15 min)
│   ├── extended/        # Advanced features (10-30 min)
│   └── regression/      # Error handling & edge cases
├── fixtures/
│   ├── videos/          # Test video files
│   ├── youtube-urls/    # Test YouTube URLs
│   └── mock-responses/  # Mock API responses
├── helpers/
│   ├── auth.helper.ts   # Firebase authentication mocking
│   └── polling.helper.ts # Async operation polling
├── page-objects/        # Page Object Model (coming soon)
└── utils/
    └── environment.ts   # Environment configuration
```

## 🚀 Quick Start

### Run All Smoke Tests (Fast)
```bash
npx playwright test --project=smoke
```

### Run Specific Test File
```bash
npx playwright test e2e/tests/smoke/health-check.spec.ts
```

### Run Against Different Environments
```bash
# Local development
BASE_URL=http://localhost:3000 API_BASE_URL=http://localhost:8081 npx playwright test

# Staging
BASE_URL=https://staging.subs.sayai.io API_BASE_URL=https://api-staging.subs.sayai.io npx playwright test

# Production (smoke tests only!)
BASE_URL=https://subs.sayai.io API_BASE_URL=https://api.subs.sayai.io npx playwright test --project=smoke
```

### Run with Different Test Tiers
```bash
# Mock mode (fastest, no real APIs)
TEST_TIER=mock npx playwright test

# Integration mode (real APIs, free services)
TEST_TIER=integration npx playwright test

# Production mode (real APIs, including paid services)
TEST_TIER=production npx playwright test
```

## 🧪 Test Categories

### Smoke Tests (~2-5 minutes)
- Application loads
- Health checks
- Authentication flow
- Basic navigation

**When to run:** Every PR, every commit

### Critical Tests (~5-15 minutes)
- File upload journey
- YouTube processing
- Download results
- Translation workflow

**When to run:** Before merge to main, nightly

### Extended Tests (~10-30 minutes)
- Video cutter
- Embed subtitles
- Video merger
- Watermark feature

**When to run:** Nightly, before releases

### Regression Tests (~5 minutes)
- Error handling
- Edge cases
- Network failures
- Rate limiting

**When to run:** Weekly, before releases

## 🔧 Environment Variables

Required for running tests:

```bash
# Application URLs
BASE_URL=https://subs.sayai.io
API_BASE_URL=https://api.subs.sayai.io

# Test Configuration
TEST_TIER=mock              # mock | integration | production
TEST_OPENAI=false           # Use OpenAI or Google Translate

# Firebase (for real auth tests)
REACT_APP_FIREBASE_API_KEY=your-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-domain

# Test Account (for integration tests)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpass123

# CI/CD
CI=true                     # Enables CI-specific behavior
```

## 💡 Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { createAuthHelper } from '../helpers/auth.helper';
import { createPollingHelper } from '../helpers/polling.helper';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    const authHelper = createAuthHelper(page);
    await authHelper.mockGoogleAuth();
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Your test code here
  });
});
```

### Using Auth Helper

```typescript
// Mock Google authentication
const authHelper = createAuthHelper(page);
await authHelper.mockGoogleAuth({
  email: 'custom@example.com',
  displayName: 'Custom User'
});

// Mock Apple authentication
await authHelper.mockAppleAuth();

// Logout
await authHelper.logout();
```

### Using Polling Helper

```typescript
// Wait for Celery task completion
const pollingHelper = createPollingHelper(page);
await pollingHelper.waitForTaskCompletion(taskId, 5 * 60 * 1000);

// Wait for progress bar
await pollingHelper.waitForProgressComplete();

// Wait for results
await pollingHelper.waitForResults();
```

## 📊 Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## 🐛 Debugging Tests

### Run in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run in Debug Mode (Step Through)
```bash
npx playwright test --debug
```

### Run Specific Test in Debug Mode
```bash
npx playwright test e2e/tests/smoke/health-check.spec.ts --debug
```

### View Traces (After Failure)
```bash
npx playwright show-trace trace.zip
```

## 💰 Cost Management

### Free Testing (Recommended)
- Use `TEST_TIER=mock` for smoke tests
- Use Google Translate instead of OpenAI
- Use `tiny` Whisper model
- **Cost:** $0/month

### Integration Testing
- Use `TEST_TIER=integration`
- Use Google Translate (free)
- Use `base` Whisper model
- Run 3x per day
- **Cost:** $0/month

### Full Testing
- Use `TEST_TIER=production`
- Include OpenAI tests (optional)
- Use `medium` Whisper model
- Run 1x per day (nightly)
- **Estimated cost:** ~$15/month

## 🚨 Best Practices

1. **Always mock Firebase auth in tests** - Don't rely on real OAuth flows
2. **Use test-specific selectors** - Add `data-testid` attributes
3. **Keep smoke tests fast** - Under 5 minutes total
4. **Don't test against production** - Use staging or local
5. **Clean up test data** - Remove uploaded files after tests
6. **Use retry logic** - Network can be flaky
7. **Log progress** - Console.log helps debug CI failures

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Architecture Plan](../docs/e2e-testing-strategy.md)
- [Firebase Auth Mocking Guide](https://firebase.google.com/docs/emulator-suite)

## 🤝 Contributing

When adding new tests:

1. Choose the right category (smoke/critical/extended/regression)
2. Add appropriate timeouts
3. Use helpers (auth, polling) for common operations
4. Add `data-testid` to new UI elements
5. Document expected behavior in test description
6. Test locally before pushing

## ❓ Troubleshooting

### Tests timing out
- Increase timeout in test or config
- Check if service is running
- Verify network connectivity

### Authentication not working
- Check Firebase config
- Verify auth helper is called
- Check browser console for errors

### Tasks not completing
- Check Celery worker is running
- Verify Redis connection
- Check backend logs

### Videos not uploading
- Check file size limits
- Verify MIME types
- Check CORS configuration

---

**Happy Testing! 🎉**
