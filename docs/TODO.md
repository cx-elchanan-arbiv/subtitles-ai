# SubsTranslator - TODO List 📋

---

## 🔥 משימות דחופות - Open Source Readiness (ינואר 2026)

### ✅ הושלם לאחרונה:
- [x] פיצול `video_routes.py` ל-6 קבצים קטנים (`api/v1/`)
- [x] הוספת API versioning (`/api/v1/...`)
- [x] תיקון באג ב-download-only (`state_manager` import)
- [x] יצירת טסטים ל-download API (14 טסטים)
- [x] תיעוד תכנית Swagger (`docs/SWAGGER_IMPLEMENTATION_PLAN.md`)

### 🐛 באגים בקוד לתקן:

#### 1. RTL Ellipsis Bug (עדיפות גבוהה)
**קובץ:** `backend/utils/rtl_utils.py`
**בעיה:** ה-ellipsis fix (`...`) לא עובד כי ה-RLE wrap קורה לפני
**פתרון:** לקרוא ל-`fix_rtl_punctuation` לפני העטיפה ב-RLE
```python
# שורות 44-48 - סדר הפעולות שגוי
text = f"{RLE}{text}{PDF}"  # ← קורה ראשון
text = fix_rtl_punctuation(text)  # ← regex לא מוצא כי יש RLE בהתחלה
```

#### 2. Python 3.9 Compatibility (עדיפות גבוהה)
**קובץ:** `backend/state_manager.py` (שורה 51)
**בעיה:** סינטקס `dict[str, Any] | None` לא נתמך ב-Python 3.9
**פתרון:** לשנות ל-`Optional[Dict[str, Any]]`

### 🧪 טסטים לתקן:

#### 3. test_cleanup_task.py (7 טסטים)
**בעיה:** Patch path שגוי - `tasks.UPLOAD_FOLDER` לא קיים
**פתרון:** לשנות ל-`tasks.cleanup_tasks.UPLOAD_FOLDER`

#### 4. test_failure_scenarios.py (7 טסטים)
**בעיות:**
- `create_srt_file` - חתימה השתנתה (עכשיו method של class)
- `whisper_smart` - מודול לא קיים
- OpenAI quota - הטסט מצפה ל-fallback אבל הקוד זורק exception

#### 5. test_api_smoke.py (1 טסט)
**בעיה:** מצפה ל-CORS `*` אבל מוגדר origins ספציפיים
**פתרון:** לעדכן את הטסט או להחליט על CORS policy

### 📝 משימות ממתינות:

- [ ] הטמעת Swagger (~4 שעות) - לפי `docs/SWAGGER_IMPLEMENTATION_PLAN.md`
- [ ] עדכון Frontend להשתמש ב-`/api/v1/` routes
- [ ] החלטה: האם צריך fallback ב-OpenAI translation או exception?
- [ ] החלטה: מה גרסת Python המינימלית? (3.9 או 3.10+)

### 📊 סטטוס טסטים נוכחי:
- ✅ 313 passed
- ❌ 20 failed
- ⏭️ 3 skipped

---

*עודכן לאחרונה: 2026-01-11*

---

## 🎯 Priority 1 - Core Improvements


### 1. TypeScript Support Enhancement
- [ ] Add strict TypeScript configuration to backend API types
- [ ] Create comprehensive interface definitions for all API responses
- [ ] Add type definitions for Celery task results
- [ ] Implement proper error type definitions
- [ ] Add validation schemas using libraries like Joi or Zod

### 2. Error Handling & Resilience
- [ ] Implement global error boundary in React frontend
- [ ] Add retry mechanism for failed API calls
- [ ] Create centralized error logging system
- [ ] Add graceful degradation for offline scenarios
- [ ] Implement proper error messages in Hebrew and English
- [ ] Add validation for file uploads (size, format, etc.)

### 3. Docker & Performance Optimization
- [ ] Optimize Docker images with multi-stage builds
- [ ] Reduce image sizes by removing unnecessary packages
- [ ] Add Docker health checks for all services
- [ ] Implement proper volume management for persistent data
- [ ] Add container resource limits and monitoring

## 🚀 Priority 2 - Advanced Features

### 4. Caching & Performance
- [ ] Implement Redis caching for Whisper model loading
- [ ] Add file-based caching for processed results
- [ ] Cache translation results to avoid re-processing
- [ ] Implement smart model selection caching
- [ ] Add progress caching for interrupted tasks

### 5. UI/UX Enhancements
- [ ] Add real-time progress indicators with percentage
- [ ] Implement drag-and-drop file upload interface
- [ ] Add preview functionality for subtitle files
- [ ] Create better mobile responsiveness
- [ ] Add dark/light theme toggle
- [ ] Implement keyboard shortcuts for power users

### 6. Monitoring & Logging
- [ ] Add structured logging with correlation IDs
- [ ] Implement application metrics (Prometheus/Grafana)
- [ ] Add health check endpoints for all services
- [ ] Create alerting system for failed tasks
- [ ] Add performance monitoring for video processing times
- [ ] Implement audit logging for security compliance

## 🔧 Priority 3 - Code Quality & Testing

### 7. Testing Infrastructure
- [ ] Add comprehensive unit tests for Python backend
- [ ] Create integration tests for API endpoints
- [ ] Add component tests for React components
- [ ] Implement end-to-end test automation
- [ ] Add load testing for concurrent processing
- [ ] Create test data fixtures and mocks

### 8. Security & Validation
- [ ] Implement rate limiting per user/IP
- [ ] Add CSRF protection for all forms
- [ ] Validate and sanitize all user inputs
- [ ] Add file type validation with magic bytes
- [ ] Implement proper session management
- [ ] Add security headers (HSTS, CSP, etc.)

### 9. Code Organization
- [ ] Refactor large functions into smaller, testable units
- [ ] Add proper dependency injection
- [ ] Implement design patterns (Factory, Strategy) where appropriate
- [ ] Add code documentation and docstrings
- [ ] Create API documentation with OpenAPI/Swagger

## 🌟 Priority 4 - Advanced Capabilities

### 10. Language & Translation Features
- [ ] Add support for more translation services (Azure, AWS)
- [ ] Implement translation confidence scoring
- [ ] Add custom terminology/glossary support
- [ ] Create translation quality assessment
- [ ] Add support for subtitle timing adjustment

### 11. Video Processing Enhancements
- [ ] Add support for more video formats
- [ ] Implement video quality optimization
- [ ] Add batch processing for multiple files
- [ ] Create video preview with subtitle overlay
- [ ] Add support for multiple subtitle tracks

### 12. User Experience Features
- [ ] Implement user accounts and processing history
- [ ] Add project management for multiple videos
- [ ] Create template system for subtitle styling
- [ ] Add export options (multiple formats)
- [ ] Implement sharing and collaboration features

## 🔄 Priority 5 - DevOps & Deployment

### 13. CI/CD Pipeline
- [ ] Set up automated testing on pull requests
- [ ] Add code quality checks (linting, formatting)
- [ ] Implement automatic deployment to staging
- [ ] Create production deployment pipeline
- [ ] Add rollback capabilities

### 14. Infrastructure
- [ ] Add horizontal scaling capabilities
- [ ] Implement load balancing for multiple workers
- [ ] Add database for persistent storage (PostgreSQL)
- [ ] Create backup and recovery procedures
- [ ] Add monitoring and alerting infrastructure

### 15. Documentation & Maintenance
- [ ] Create comprehensive API documentation
- [ ] Add architecture decision records (ADRs)
- [ ] Create troubleshooting guides
- [ ] Add contribution guidelines
- [ ] Create release notes and versioning strategy

## 🐛 Known Issues & Bug Fixes

### 16. Current Issues
- [ ] Fix any memory leaks in long-running tasks
- [ ] Resolve Docker permission issues on different systems
- [ ] Fix subtitle timing synchronization issues
- [ ] Address any race conditions in concurrent processing
- [ ] Fix mobile browser compatibility issues

---

## 🎯 Next Sprint Focus

**Starting with Priority 1 - Item 1: TypeScript Support Enhancement**

This TODO list serves as our master plan for improving SubsTranslator. We'll work through these systematically, starting from the highest priority items.

---

*Last updated: 2025-09-26*
*Branch: claude-development-review*