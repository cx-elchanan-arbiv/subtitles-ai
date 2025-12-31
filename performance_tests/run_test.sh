#!/bin/bash
# Performance Test Runner

TEST_NAME=$1
VIDEO_URL="https://www.youtube.com/watch?v=wpHvBrIIJnA"

if [ -z "$TEST_NAME" ]; then
    echo "Usage: $0 <test_name>"
    echo "Example: $0 test3_sync_1thread"
    exit 1
fi

LOG_FILE="performance_tests/${TEST_NAME}_logs.txt"
METRICS_FILE="performance_tests/${TEST_NAME}_metrics.txt"

echo "======================================"
echo "Performance Test: $TEST_NAME"
echo "Video: $VIDEO_URL"
echo "Started: $(date)"
echo "======================================"

# Clear Redis to ensure clean test
docker exec substranslator-redis-1 redis-cli FLUSHALL

# Start logging
docker-compose logs -f worker > "$LOG_FILE" 2>&1 &
LOG_PID=$!

echo "Logging to: $LOG_FILE"
echo "Process ID: $LOG_PID"
echo ""
echo "Now submit the video via the web interface:"
echo "$VIDEO_URL"
echo ""
echo "Press Ctrl+C when the task is complete..."

# Wait for user to stop
trap "kill $LOG_PID 2>/dev/null; echo 'Test completed!'" EXIT

wait $LOG_PID
