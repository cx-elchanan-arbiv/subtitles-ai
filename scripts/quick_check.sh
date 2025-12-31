#!/bin/bash
"""
Quick Development Check for SubsTranslator
Fast checks you can run during development.
"""

echo "⚡ QUICK DEVELOPMENT CHECK"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "backend/app.py" ]; then
    echo "❌ Please run from SubsTranslator root directory"
    exit 1
fi

# 1. Fast unit tests (same as CI)
echo "🧪 Running unit tests (CI equivalent)..."
python3 -m pytest tests/ -m "not integration and not e2e" -q --tb=short -x

if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed!"
    echo "💡 These will fail in CI - fix before pushing"
    exit 1
fi

# 2. Check for obvious issues
echo "🔍 Checking for common issues..."

# Check for print statements (should use logging)
print_statements=$(grep -r "print(" backend/ --include="*.py" | grep -v "__pycache__" | wc -l)
if [ $print_statements -gt 0 ]; then
    echo "⚠️  Found $print_statements print() statements in backend/"
    echo "💡 Consider using logger instead of print()"
fi

# Check for TODO comments
todos=$(grep -r "TODO\|FIXME\|XXX" backend/ --include="*.py" | wc -l)
if [ $todos -gt 0 ]; then
    echo "📝 Found $todos TODO/FIXME comments"
fi

# Check for hardcoded localhost
localhost_refs=$(grep -r "localhost\|127.0.0.1" backend/ --include="*.py" | grep -v test | wc -l)
if [ $localhost_refs -gt 0 ]; then
    echo "⚠️  Found $localhost_refs hardcoded localhost references"
fi

echo "✅ Quick check completed!"
echo ""
echo "🎯 Next steps:"
echo "   • For full check: python3 scripts/pre_push_check.py"
echo "   • For integration tests: docker compose up -d && pytest tests/integration/"
echo "   • For E2E tests: pytest tests/e2e/ (requires setup)"
