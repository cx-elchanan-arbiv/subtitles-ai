# Contributing to SubsTranslator

## Quick Developer Setup

### Prerequisites
```bash
# Required tools
Docker Desktop 4.0+ with Compose V2
Python 3.12+ with pip
Node.js 20+ with npm 10+
Git 2.30+

# Install development dependencies
pip install pre-commit black isort ruff pytest
npm install -g prettier eslint
```

### First-time Setup
```bash
# 1. Clone and setup
git clone <repo-url>
cd SubsTranslator
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# 2. Install pre-commit hooks
pre-commit install

# 3. Start development environment
./scripts/start.sh

# 4. Verify setup
curl http://localhost:8081/health
curl http://localhost/
```

## Code Standards

### Python (Backend)

**Formatting & Linting**:
```bash
# Auto-format code
black backend/
isort backend/

# Lint check
ruff check backend/
flake8 backend/ --max-line-length=100

# Run before commit
pre-commit run --all-files
```

**Code Style**:
- **Type hints**: Required for all functions
- **Docstrings**: Required for public methods
- **Error handling**: Use structured exceptions from `core/exceptions.py`
- **Logging**: Use structured logging with context

```python
# ✅ Good example
def process_video(file_path: str, target_lang: str) -> TaskResult:
    """Process video file with transcription and translation.
    
    Args:
        file_path: Absolute path to video file
        target_lang: Target language code (e.g., 'he', 'en')
        
    Returns:
        TaskResult with processing metadata
        
    Raises:
        FileNotFoundError: If video file doesn't exist
        VideoProcessingError: If processing fails
    """
    logger.info("Starting video processing", file_path=file_path, target_lang=target_lang)
    # Implementation...
```

### TypeScript (Frontend)

**Formatting & Linting**:
```bash
cd frontend
npm run lint                    # ESLint check
npm run lint -- --fix         # Auto-fix issues
npm run build                  # TypeScript compilation check
```

**Code Style**:
- **Strict TypeScript**: No `any` types
- **Functional components**: Hooks over class components
- **Error boundaries**: Wrap async operations
- **i18n**: All user-facing text via `t()` function

```typescript
// ✅ Good example
interface ProcessingProps {
  taskId: string;
  onComplete: (result: TaskResult) => void;
}

const ProcessingComponent: React.FC<ProcessingProps> = ({ taskId, onComplete }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TaskStatus>('pending');
  
  // Implementation with proper error handling...
};
```

## Testing Strategy

### Running Tests

```bash
# Backend tests (Python)
python -m pytest tests/ -m "unit" -v                    # Fast unit tests
python -m pytest tests/ -m "integration" -v             # Integration tests  
python -m pytest tests/ -m "e2e" -v                     # End-to-end tests
python -m pytest tests/ --cov=backend --cov-report=html # Coverage report

# Frontend tests (JavaScript/TypeScript)
cd frontend
npm test                              # Jest unit tests
npm run test:e2e                     # Playwright E2E tests
npm run test:localization            # i18n validation
```

### Test Categories & Markers

```python
# Use pytest markers to categorize tests
@pytest.mark.unit
def test_clean_filename():
    """Fast, isolated unit test."""
    pass

@pytest.mark.integration  
def test_task_processing():
    """Test component interactions."""
    pass

@pytest.mark.e2e
@pytest.mark.slow
def test_full_youtube_flow():
    """Complete user flow test."""
    pass
```

### Writing Tests

**Backend Test Patterns**:
```python
# File: tests/test_feature.py
import pytest
from backend.tasks import process_video_task

class TestVideoProcessing:
    def test_valid_input(self):
        """Test normal case."""
        result = process_video_task(valid_input)
        assert result.status == 'SUCCESS'
    
    def test_invalid_input(self):
        """Test error handling."""
        with pytest.raises(VideoProcessingError):
            process_video_task(invalid_input)
```

**Frontend Test Patterns**:
```typescript
// File: src/components/__tests__/Component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Component from '../Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component {...props} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interaction', async () => {
    render(<Component {...props} />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findByText('Result Text');
  });
});
```

## Git Workflow

### Branch Strategy
```bash
# Feature development
git checkout main
git pull origin main
git checkout -b feature/add-rate-limiting

# Work on feature...
git add .
git commit -m "feat: add rate limiting to API endpoints"
git push -u origin feature/add-rate-limiting

# Create PR via GitHub UI or CLI
gh pr create --title "Add rate limiting" --body "Implements Flask-Limiter..."
```

### Commit Message Format

**Use Conventional Commits**:
```bash
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting change
refactor: code refactoring
test: add or update tests
chore: maintenance tasks

# Examples:
git commit -m "feat: add JWT authentication for API endpoints"
git commit -m "fix: resolve Whisper model loading timeout issue"  
git commit -m "docs: update API documentation with new endpoints"
```

### Pre-commit Checklist

**Automated** (via pre-commit hooks):
- [ ] Python code formatted (black, isort)
- [ ] Python linting passed (ruff)
- [ ] TypeScript compilation successful
- [ ] No secrets in diff (`sk-`, API keys)
- [ ] i18n keys validated

**Manual**:
- [ ] Tests pass: `python -m pytest tests/ -m "unit"`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Documentation updated if API/behavior changed
- [ ] CHANGELOG entry added (for releases)

## Pull Request Guidelines

### PR Template Checklist

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Documentation
- [ ] Code comments added where needed
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG updated (if applicable)

## Security
- [ ] No secrets committed
- [ ] Input validation added (if applicable)
- [ ] Security implications considered
```

### Review Process

**Code Review Focus**:
- **Security**: Input validation, secret management, SSRF protection
- **Performance**: Resource usage, timeout handling, caching
- **Reliability**: Error handling, retry logic, graceful degradation
- **Maintainability**: Code organization, documentation, test coverage

**Required Checks** (GitHub branch protection):
- [ ] All CI tests pass
- [ ] Security scan clean
- [ ] Code coverage maintained
- [ ] At least 1 approving review

## Development Workflows

### Backend Development

```bash
# Local development with hot reload
cd backend
export FLASK_ENV=development
python app.py

# Test single endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/test"}' \
  http://localhost:8081/youtube

# Debug Celery tasks
celery -A celery_worker.celery_app worker -l debug -Q processing
```

### Frontend Development

```bash
# Development server with proxy
cd frontend
npm start  # Starts on port 3000, proxies API to :8081

# Build optimization check
npm run build
npx serve -s build -l 3001  # Test production build

# i18n development
npm run i18n:check          # Validate translation keys
```

### Adding New Features

**Backend API Endpoint**:
1. Add route to `app.py` with input validation
2. Implement business logic in `services/`
3. Add Celery task if async processing needed
4. Write unit tests with mocks
5. Add integration test with real flow
6. Update API documentation

**Frontend Component**:
1. Create component in `src/components/`
2. Add TypeScript interfaces in `src/types/`
3. Implement with proper error handling
4. Add i18n keys to translation files
5. Write component tests
6. Add to Storybook (if available)

## Release Process

### Version Management
```bash
# Current: No formal versioning (manual releases)
# TODO: Implement semantic versioning

# Recommended process:
git tag v1.2.3
echo "1.2.3" > VERSION
git add VERSION && git commit -m "bump: version 1.2.3"
```

### Release Checklist
- [ ] All tests pass in CI
- [ ] Security scan clean
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Migration scripts ready (if needed)
- [ ] Rollback plan prepared

## Security Guidelines

### Secret Management
```bash
# ✅ DO: Use environment variables
OPENAI_API_KEY=${OPENAI_API_KEY}

# ❌ DON'T: Hardcode in source
api_key = "sk-proj-real-key-here"  # NEVER DO THIS

# Pre-commit secret detection
grep -r "sk-[a-zA-Z0-9]" . --exclude-dir=.git
```

### Input Validation
```python
# Always validate user inputs
from werkzeug.utils import secure_filename

def validate_upload(file):
    # Check file extension
    if not allowed_file(file.filename):
        raise ValidationError("Invalid file type")
    
    # Check file size  
    if file.content_length > MAX_FILE_SIZE:
        raise ValidationError("File too large")
        
    # Sanitize filename
    filename = secure_filename(file.filename)
```

## Common Issues & Solutions

### Development Issues

**"Worker not picking up tasks"**:
```bash
# Check Redis connection
docker compose exec redis redis-cli ping

# Restart worker with debug logging
docker compose restart worker
docker compose logs -f worker
```

**"Frontend can't reach backend"**:
```bash
# Check proxy configuration
cat frontend/package.json | grep proxy
# Should be: "proxy": "http://localhost:8081"

# Check CORS settings
grep -n "CORS" backend/app.py
```

**"Tests failing in CI but passing locally"**:
```bash
# Reproduce CI environment
export FLASK_ENV=testing
export USE_FAKE_YTDLP=true
python -m pytest tests/ -m "not integration"
```

### Production Issues

**"High memory usage"**:
- Check Whisper model size: use `tiny` for production if needed
- Monitor worker memory: `docker stats worker`
- Increase memory limits in docker-compose.yml

**"Processing timeouts"**:
- Increase `TASK_SOFT_TIME_LIMIT` for large files
- Check network connectivity for YouTube downloads
- Monitor disk space during processing

## Resources

### Documentation Links
- [Architecture Overview](ARCHITECTURE.md) - System design and components
- [Operations Guide](OPERATIONS.md) - Day-to-day operations and troubleshooting
- [Project Overview](PROJECT_OVERVIEW.md) - Business context and features

### External Documentation
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [React Documentation](https://react.dev/)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)

### Community & Support
- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: Architecture questions and development help
- Code Review: All changes require peer review before merge

---

*Last Updated: 2025-08-31*  
*Document Version: 1.0*  
*For: Development Team*