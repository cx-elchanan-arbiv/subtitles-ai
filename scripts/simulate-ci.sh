#!/bin/bash
# Simulate CI locally

echo "🚀 Simulating CI Pipeline Locally..."
echo ""

# Backend Tests
echo "🔧 Backend Unit Tests..."
cd /Users/elchananarbiv/Projects/SubsTranslator
python3 -m pytest tests/ -m "not integration and not e2e" -x --tb=short -q
BACKEND_EXIT=$?

if [ $BACKEND_EXIT -ne 0 ]; then
    echo "❌ Backend tests failed!"
    exit 1
fi

echo "✅ Backend tests passed!"
echo ""

# Frontend Tests  
echo "🎨 Frontend Tests..."
cd frontend
npm test -- --watchAll=false --silent --passWithNoTests
FRONTEND_EXIT=$?

if [ $FRONTEND_EXIT -ne 0 ]; then
    echo "❌ Frontend tests failed!"
    exit 1
fi

echo "✅ Frontend tests passed!"
echo ""

echo "🎉 All CI checks passed locally!"
