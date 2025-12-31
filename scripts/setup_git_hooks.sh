#!/bin/bash
"""
Setup Git Hooks for SubsTranslator
Automatically runs checks before commits and pushes.
"""

echo "🔧 Setting up Git Hooks for SubsTranslator..."

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook (fast checks)
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Check if we have Python files to check
python_files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.py$')

if [ -n "$python_files" ]; then
    echo "🐍 Checking Python files..."
    
    # Run unit tests (fast)
    echo "🧪 Running unit tests..."
    python3 -m pytest tests/ -m "not integration and not e2e" -q --tb=no
    if [ $? -ne 0 ]; then
        echo "❌ Unit tests failed! Commit blocked."
        exit 1
    fi
    
    # Check code formatting (optional - can auto-fix)
    echo "🎨 Checking code formatting..."
    python3 -c "import black; black.main(['--check', '--quiet'] + '$python_files'.split())" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "⚠️  Code formatting issues detected"
        echo "💡 Run: python3 -m black backend/ to fix"
        echo "   (Not blocking commit - but recommended)"
    fi
fi

echo "✅ Pre-commit checks passed!"
EOF

# Create pre-push hook (comprehensive checks)
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
echo "🚀 Running pre-push checks..."

# Run the comprehensive pre-push check script
python3 scripts/pre_push_check.py

if [ $? -ne 0 ]; then
    echo ""
    echo "🛑 PUSH BLOCKED!"
    echo "Fix the issues above and try again."
    echo ""
    echo "💡 To bypass this check (not recommended):"
    echo "   git push --no-verify"
    exit 1
fi

echo "✅ All checks passed - proceeding with push"
EOF

# Make hooks executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "📋 What was installed:"
echo "   • pre-commit: Fast unit tests + formatting check"
echo "   • pre-push: Comprehensive checks (same as CI + more)"
echo ""
echo "🎯 Now when you:"
echo "   • git commit → Fast checks run automatically"
echo "   • git push → Comprehensive checks run automatically"
echo ""
echo "💡 To run checks manually:"
echo "   python3 scripts/pre_push_check.py"
