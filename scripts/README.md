# 🚀 SubsTranslator Scripts Guide

## 🎯 Quick Start Commands


### 🔧 Development Mode - UI Only (Fast)
```bash
./scripts/dev.sh
```
- ✅ Frontend: http://localhost:3000 (Hot reload)
- ✅ Backend: http://localhost:8081 (API only)
- ❌ Video processing won't work (no Celery)
- 🎯 Perfect for UI/Frontend development

### 🔧 Development Mode - Full Stack (Complete)
```bash
./scripts/dev-full.sh
```
- ✅ Frontend: http://localhost:3000 (Hot reload)
- ✅ Backend: http://localhost:8081 (Full API)
- ✅ Celery Worker (Video processing works!)
- ✅ Redis (Background tasks)
- 🎯 Perfect for full feature development

### 🚀 Production Mode (Docker)
```bash
./scripts/prod.sh
```
- ✅ Application: http://localhost (Production build)
- ✅ Full stack with Redis + Celery workers
- ✅ Isolated Docker environment
- 🎯 Perfect for final testing and deployment

### 🛑 Stop Everything
```bash
./scripts/stop.sh
```
- Stops all development and Docker services
- Safe cleanup of all processes

---

## 📋 All Available Scripts

### 🚀 Main Scripts (Daily Use)
| Script | Purpose | Video Processing | When to Use |
|--------|---------|------------------|-------------|
| `dev.sh` | Development (UI focus) | ❌ No | UI/Frontend work |
| `dev-full.sh` | Development (Full) | ✅ Yes | Complete development |
| `prod.sh` | Production Docker | ✅ Yes | Final testing |
| `stop.sh` | Stop all services | - | Cleanup |

### 🧹 Utility Scripts (Maintenance)
| Script | Purpose | When to Use |
|--------|---------|-------------|
| `clean_docker_data.sh` | Clean Docker data | Storage cleanup |
| `clean_safe_data.sh` | Clean temp files | Safe cleanup |
| `check_docker_data.sh` | Check Docker usage | Before cleanup |
| `verify_substranslator.sh` | Health check | Troubleshooting |
| `run_tests.py` | Run test suite | Testing |

---

---

## 🚀 Getting Started

### First Time Setup
```bash
./scripts/setup
```
This will automatically:
- Check all requirements (Python, Node.js, Docker, Redis)
- Install all dependencies
- Set up the environment
- Guide you through the process

### Daily Usage
```bash
./scripts/start
```
Interactive menu to choose the right mode for your needs.

---

## 🔧 Manual Commands (Advanced)

### Direct Script Execution
```bash
./scripts/dev.sh        # Development - UI only
./scripts/dev-full.sh   # Development - Full stack
./scripts/prod.sh       # Production - Docker
./scripts/stop.sh       # Stop everything
```

### Troubleshooting & Maintenance
```bash
./scripts/check_docker_data.sh    # Check Docker usage
./scripts/clean_safe_data.sh      # Clean temp files
./scripts/clean_docker_data.sh    # Clean Docker data
./scripts/verify_substranslator.sh # Health check
./scripts/run_tests.py            # Run tests
```

---

## 🆘 Quick Troubleshooting

### Port Already in Use
```bash
./scripts/stop.sh  # Stop everything first
./scripts/start    # Then restart with menu
```

### Docker Issues
```bash
./scripts/clean_docker_data.sh  # Clean Docker data
./scripts/prod.sh               # Fresh start
```

### Development Issues
```bash
./scripts/stop.sh               # Stop everything
./scripts/setup                 # Re-setup environment
./scripts/start                 # Start fresh
```

### Redis Issues
```bash
# macOS with Homebrew
brew services restart redis

# Check if Redis is working
redis-cli ping  # Should return PONG
```
