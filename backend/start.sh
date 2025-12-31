#!/bin/bash
set -e

echo "🚀 Starting SubsTranslator Backend + Worker..."
echo "👤 Running as user: $(whoami) (uid=$(id -u))"

# Start Gunicorn in background
echo "📡 Starting Gunicorn..."
gunicorn --bind 0.0.0.0:${PORT:-10000} --workers 2 --timeout 900 app:app &
GUNICORN_PID=$!

# Start Celery Worker in background
echo "⚙️  Starting Celery Worker..."
celery -A celery_worker.celery_app worker --loglevel=INFO --concurrency=1 --max-tasks-per-child=50 &
CELERY_PID=$!

echo "✅ Both processes started!"
echo "   - Gunicorn PID: $GUNICORN_PID"
echo "   - Celery PID: $CELERY_PID"

# Wait for both processes
wait
