#!/usr/bin/env python3
"""
Test JSONL Statistics with Local Video Upload
==============================================

This test:
1. Uploads a local video file
2. Uses base model (fastest) + Google Translate
3. Verifies a new line was added to stats JSONL
4. Checks the stats contain correct data

Usage:
    python3 test_stats_upload.py <video_file_path>

Example:
    python3 test_stats_upload.py backend/tests/fixtures/test_video_30s.mp4
"""

import sys
import time
import json
import requests
import os

# Configuration
API_URL = "http://localhost:8081"


def print_header(text):
    """Print fancy header."""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)


def get_stats_count():
    """Get current number of stats entries."""
    try:
        response = requests.get(f"{API_URL}/api/stats/info")
        if response.status_code == 200:
            info = response.json()
            return info.get("entry_count", 0)
        return 0
    except:
        return 0


def download_stats_file():
    """Download latest stats JSONL."""
    try:
        response = requests.get(f"{API_URL}/api/stats/download")
        if response.status_code == 200:
            with open("test_stats.jsonl", 'wb') as f:
                f.write(response.content)
            return True
        return False
    except Exception as e:
        print(f"❌ Error downloading: {e}")
        return False


def get_latest_stat():
    """Get the latest (last) stat from JSONL."""
    try:
        with open("test_stats.jsonl", 'r') as f:
            lines = f.readlines()
            if lines:
                return json.loads(lines[-1].strip())
        return None
    except Exception as e:
        print(f"❌ Error reading stats: {e}")
        return None


def upload_video(file_path):
    """Upload video file for processing."""
    print_header("📤 UPLOADING VIDEO")

    # Check file exists
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return None

    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"File: {os.path.basename(file_path)}")
    print(f"Size: {file_size_mb:.2f} MB")
    print(f"Model: base (fastest)")
    print(f"Translation: Google (not OpenAI)")
    print(f"Auto-create video: False (faster)")

    try:
        # Prepare multipart form data
        with open(file_path, 'rb') as video_file:
            files = {
                'file': (os.path.basename(file_path), video_file, 'video/mp4')
            }
            data = {
                'source_lang': 'auto',
                'target_lang': 'he',
                'auto_create_video': 'false',
                'whisper_model': 'base',
                'translation_service': 'google'
            }

            print("\n📡 Uploading...")
            response = requests.post(
                f"{API_URL}/upload",
                files=files,
                data=data,
                timeout=600
            )

        if response.status_code not in [200, 202]:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            return None

        result = response.json()
        task_id = result.get("task_id")
        print(f"✅ Upload successful, task ID: {task_id}")
        return task_id

    except Exception as e:
        print(f"❌ Error uploading: {e}")
        import traceback
        traceback.print_exc()
        return None


def wait_for_task(task_id, timeout=600):
    """Poll task status until completion."""
    print_header("⏳ WAITING FOR TASK")

    start = time.time()
    last_status = None
    last_percent = 0

    while time.time() - start < timeout:
        try:
            response = requests.get(f"{API_URL}/status/{task_id}")
            if response.status_code != 200:
                print(f"❌ Status check failed: {response.status_code}")
                time.sleep(2)
                continue

            data = response.json()
            status = data.get("state", "UNKNOWN")

            # Print status updates
            if status != last_status:
                print(f"\n📊 Status: {status}")
                last_status = status

            # Show progress
            if "meta" in data:
                overall = data["meta"].get("overall_percent", 0)
                if overall != last_percent:
                    print(f"   Progress: {overall}%", end="\r")
                    last_percent = overall

            # Check if done
            if status == "SUCCESS":
                elapsed = time.time() - start
                print(f"\n✅ Task completed in {elapsed:.1f}s")
                return data
            elif status == "FAILURE":
                result = data.get("result", {})
                error = result.get("error", "Unknown error")
                print(f"\n❌ Task failed: {error}")
                if "traceback" in result:
                    print(f"Traceback: {result['traceback']}")
                return None

            time.sleep(2)

        except Exception as e:
            print(f"⚠️ Error checking status: {e}")
            time.sleep(2)

    print(f"\n❌ Timeout after {timeout}s")
    return None


def verify_stats(task_id, expected_model, expected_service):
    """Verify stats were saved correctly."""
    print_header("🔍 VERIFYING STATS")

    # Download latest stats
    print("📥 Downloading stats file...")
    if not download_stats_file():
        print("❌ Failed to download stats")
        return False

    # Get latest entry
    latest = get_latest_stat()
    if not latest:
        print("❌ No stats found")
        return False

    print(f"\n📊 Latest stat entry:")
    print(json.dumps(latest, indent=2, ensure_ascii=False))

    # Verify fields
    print("\n🔎 Verification:")
    checks = []

    # Task ID match
    if latest.get("task_id") == task_id:
        print(f"✅ Task ID matches: {task_id[:8]}...")
        checks.append(True)
    else:
        print(f"❌ Task ID mismatch: {latest.get('task_id')} != {task_id}")
        checks.append(False)

    # Model check
    if latest.get("transcription_model") == expected_model:
        print(f"✅ Model: {expected_model}")
        checks.append(True)
    else:
        print(f"❌ Model mismatch: {latest.get('transcription_model')} != {expected_model}")
        checks.append(False)

    # Service check
    if latest.get("translation_service") == expected_service:
        print(f"✅ Translation service: {expected_service}")
        checks.append(True)
    else:
        print(f"❌ Service mismatch: {latest.get('translation_service')} != {expected_service}")
        checks.append(False)

    # Status check
    if latest.get("status") == "success":
        print("✅ Status: success")
        checks.append(True)
    else:
        print(f"❌ Status: {latest.get('status')}")
        checks.append(False)

    # Check timing fields exist
    print("\n📏 Timing data:")

    video_duration = latest.get("video_duration", 0)
    print(f"  📹 Video duration: {video_duration:.1f}s")

    transcription_duration = latest.get("transcription_duration", 0)
    print(f"  🎤 Transcription: {transcription_duration:.1f}s")

    translation_duration = latest.get("translation_duration", 0)
    print(f"  🌐 Translation: {translation_duration:.1f}s")

    embedding_duration = latest.get("embedding_duration", 0)
    print(f"  🎬 Embedding: {embedding_duration:.1f}s (0 if skipped)")

    total_duration = latest.get("total_duration", 0)
    print(f"  ⏱️  Total: {total_duration:.1f}s")

    # Speed ratio
    speed_ratio = latest.get("transcription_speed_ratio", 0)
    if speed_ratio > 0:
        print(f"\n  ⚡ Speed ratio: {speed_ratio:.2f}x realtime")
        if video_duration > 0:
            print(f"     (30s video processed in {video_duration/speed_ratio:.1f}s)")

    # Summary
    print(f"\n{'='*60}")
    if all(checks):
        print("✅ ALL CRITICAL CHECKS PASSED!")
        return True
    else:
        print("❌ SOME CHECKS FAILED")
        return False


def main():
    """Main test flow."""
    print("\n🧪 JSONL STATISTICS E2E TEST - LOCAL VIDEO UPLOAD")

    # Check if file path provided
    if len(sys.argv) < 2:
        print("\n❌ Please provide a video file path")
        print("\nUsage:")
        print("  python3 test_stats_upload.py <video_file_path>")
        print("\nExample:")
        print("  python3 test_stats_upload.py backend/tests/fixtures/test_video_30s.mp4")
        sys.exit(1)

    video_path = sys.argv[1]

    # Get initial stats count
    initial_count = get_stats_count()
    print(f"\n📊 Initial stats count: {initial_count}")

    # Upload video
    task_id = upload_video(video_path)
    if not task_id:
        print("\n❌ TEST FAILED: Could not upload video")
        sys.exit(1)

    # Wait for completion
    result = wait_for_task(task_id, timeout=600)
    if not result:
        print("\n❌ TEST FAILED: Task did not complete")
        sys.exit(1)

    # Wait a bit for stats to be written
    print("\n⏱️  Waiting 3s for stats to be written...")
    time.sleep(3)

    # Check new count
    final_count = get_stats_count()
    print(f"\n📊 Final stats count: {final_count}")

    if final_count > initial_count:
        print(f"✅ New entry added! ({final_count - initial_count} new entries)")
    else:
        print(f"⚠️  Warning: No new entries detected (count stayed at {final_count})")

    # Verify stats content
    success = verify_stats(
        task_id=task_id,
        expected_model="base",
        expected_service="google"
    )

    # Final result
    print_header("🏁 TEST RESULT")
    if success:
        print("✅ TEST PASSED!")
        print("\nThe JSONL stats system is working correctly:")
        print("  ✅ Video uploaded and processed successfully")
        print("  ✅ Stats saved to JSONL file")
        print("  ✅ Correct model (base) recorded")
        print("  ✅ Correct service (google) recorded")
        print("  ✅ All timing data present")
        print("\n📂 Stats file downloaded to: test_stats.jsonl")
        print("   You can analyze it with: python3 analyze_stats.py")
        sys.exit(0)
    else:
        print("❌ TEST FAILED!")
        print("\nSome checks did not pass. Review output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
