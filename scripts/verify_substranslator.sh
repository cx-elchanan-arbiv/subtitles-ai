#!/usr/bin/env bash
# Verify SubsTranslator integration for translation_service + sanity checks
# Usage: bash verify_substranslator.sh
# Optional flags: --skip-frontend  (skip npm build/typecheck)

set -euo pipefail

RED="$(printf '\033[31m')"
GRN="$(printf '\033[32m')"
YLW="$(printf '\033[33m')"
BLU="$(printf '\033[34m')"
RST="$(printf '\033[0m')"

warn()  { echo -e "${YLW}⚠ $*${RST}"; }
pass()  { echo -e "${GRN}✔ $*${RST}"; }
fail()  { echo -e "${RED}✖ $*${RST}"; }
info()  { echo -e "${BLU}➜ $*${RST}"; }

SKIP_FRONTEND=0
for arg in "$@"; do
  case "$arg" in
    --skip-frontend) SKIP_FRONTEND=1 ;;
  esac
done

section() {
  echo ""
  echo "============================================================"
  echo "$*"
  echo "============================================================"
}

# 1) config.py checks
section "1) backend/config.py checks"

if grep -n "OPENAI_API_KEY" backend/config.py; then
  COUNT=$(grep -n "OPENAI_API_KEY" backend/config.py | wc -l)
  if [ "$COUNT" -eq 1 ]; then
    pass "OPENAI_API_KEY appears exactly once"
  else
    warn "OPENAI_API_KEY appears $COUNT times (expected 1)"
  fi
else
  fail "OPENAI_API_KEY not found in config.py"
fi

# 2) tasks.py checks
section "2) backend/tasks.py checks"

if grep -q "def process_video_task" backend/tasks.py; then
  if grep -q "translation_service" backend/tasks.py; then
    pass "process_video_task includes translation_service"
  else
    warn "process_video_task missing translation_service parameter"
  fi
else
  fail "process_video_task not found in tasks.py"
fi

if grep -q "def download_and_process_youtube_task" backend/tasks.py; then
  if grep -q "translation_service" backend/tasks.py; then
    pass "download_and_process_youtube_task includes translation_service"
  else
    warn "download_and_process_youtube_task missing translation_service"
  fi
else
  fail "download_and_process_youtube_task not found"
fi

# 3) app.py checks
section "3) backend/app.py checks"

if grep -q "translation_service" backend/app.py; then
  pass "app.py handles translation_service parameter"
else
  warn "app.py does not read translation_service"
fi

# 4) Frontend build & typecheck
section "4) Frontend build & typecheck"
if [ "$SKIP_FRONTEND" -eq 1 ]; then
  warn "Skipping frontend checks"
else
  if [ -d "frontend" ]; then
    pushd frontend >/dev/null
    if [ -f "package.json" ]; then
      info "Running npm build"
      if npm run -s build; then
        pass "Frontend build succeeded"
      else
        fail "Frontend build failed"
      fi
      if npm run -s typecheck >/dev/null 2>&1; then
        pass "Frontend typecheck passed"
      else
        warn "Frontend typecheck script missing or failed"
      fi
    else
      warn "No package.json found in frontend/"
    fi
    popd >/dev/null
  else
    warn "No frontend/ directory found"
  fi
fi

# 5) Backend syntax check
section "5) Backend syntax check"
python3 -m py_compile backend/config.py backend/tasks.py backend/app.py backend/translation_services.py && \
  pass "Backend py_compile passed" || fail "Backend py_compile found errors"

# 6) Cross-project sanity
section "6) Cross-project grep for translation_service"
info "Backend occurrences:"
grep -n "translation_service" -R backend || true
echo ""
info "Frontend occurrences:"
grep -n "translation_service" -R frontend/src || true

echo ""
pass "Verification completed. Review warnings above if any."

