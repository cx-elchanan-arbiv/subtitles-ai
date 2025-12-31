#!/usr/bin/env python3
"""
P1 Performance Comparison Test Suite
=====================================
Runs 4 different configurations and compares performance.

Test Video: https://www.youtube.com/watch?v=wpHvBrIIJnA

Configurations:
1. Baseline (before P1): Sequential processing
2. P1 with asyncio.run + 4 threads
3. P1 sync + 1 thread (current)
4. P1 sync + 4 threads (optimal)
"""

import subprocess
import time
import json
import re
import sys
from pathlib import Path
from typing import Dict, Any, List
import shutil


class PerformanceTest:
    """Automated performance testing for P1 optimization."""

    TEST_VIDEO_URL = "https://www.youtube.com/watch?v=wpHvBrIIJnA"
    BACKEND_DIR = Path(__file__).parent.parent / "backend"
    DOCKER_COMPOSE_FILE = Path(__file__).parent.parent / "docker-compose.yml"
    RESULTS_DIR = Path(__file__).parent / "results"

    def __init__(self):
        self.RESULTS_DIR.mkdir(exist_ok=True)
        self.original_docker_compose = self.DOCKER_COMPOSE_FILE.read_text()
        self.original_translation_services = (self.BACKEND_DIR / "translation_services.py").read_text()
        self.original_tasks = (self.BACKEND_DIR / "tasks.py").read_text()

    def backup_files(self):
        """Backup original files."""
        print("📦 Creating backups...")
        shutil.copy(self.DOCKER_COMPOSE_FILE, self.RESULTS_DIR / "docker-compose.yml.backup")
        shutil.copy(self.BACKEND_DIR / "translation_services.py", self.RESULTS_DIR / "translation_services.py.backup")
        shutil.copy(self.BACKEND_DIR / "tasks.py", self.RESULTS_DIR / "tasks.py.backup")

    def restore_files(self):
        """Restore original files."""
        print("📦 Restoring original files...")
        self.DOCKER_COMPOSE_FILE.write_text(self.original_docker_compose)
        (self.BACKEND_DIR / "translation_services.py").write_text(self.original_translation_services)
        (self.BACKEND_DIR / "tasks.py").write_text(self.original_tasks)

    def update_docker_compose(self, parallelism: int, max_concurrent: int):
        """Update docker-compose.yml with new parallelism settings."""
        print(f"⚙️ Updating docker-compose.yml: PARALLELISM={parallelism}, MAX_CONCURRENT={max_concurrent}")

        content = self.original_docker_compose

        # Update TRANSLATION_PARALLELISM
        content = re.sub(
            r'TRANSLATION_PARALLELISM=\d+',
            f'TRANSLATION_PARALLELISM={parallelism}',
            content
        )

        # Update or add MAX_CONCURRENT_OPENAI_REQUESTS
        if 'MAX_CONCURRENT_OPENAI_REQUESTS' in content:
            content = re.sub(
                r'MAX_CONCURRENT_OPENAI_REQUESTS=\d+',
                f'MAX_CONCURRENT_OPENAI_REQUESTS={max_concurrent}',
                content
            )
        else:
            # Add it after TRANSLATION_BATCH_SIZE
            content = re.sub(
                r'(TRANSLATION_BATCH_SIZE=\d+.*?\n)',
                f'\\1      - MAX_CONCURRENT_OPENAI_REQUESTS={max_concurrent}\n',
                content
            )

        self.DOCKER_COMPOSE_FILE.write_text(content)

    def enable_asyncio(self):
        """Re-add asyncio.run() to translation_services.py."""
        print("🔄 Enabling asyncio.run()...")

        content = (self.BACKEND_DIR / "translation_services.py").read_text()

        # Add asyncio import if missing
        if "import asyncio" not in content:
            content = content.replace(
                "import logging",
                "import asyncio\nimport logging"
            )

        # Change sync calls back to asyncio.run()
        content = content.replace(
            "translations = self._translate_batch_with_retry_and_resplit(",
            "translations = asyncio.run(self._translate_batch_with_retry_and_resplit("
        )
        content = content.replace(
            "    ) -> list[str]:",
            "    ) -> list[str]):"
        )

        # Change function definitions back to async
        content = content.replace(
            "    def _translate_batch_with_retry_and_resplit(",
            "    async def _translate_batch_with_retry_and_resplit("
        )
        content = content.replace(
            "    def _attempt_batch_translation(",
            "    async def _attempt_batch_translation("
        )
        content = content.replace(
            "    def _make_openai_request_with_retries(",
            "    async def _make_openai_request_with_retries("
        )

        # Change function calls back to await
        content = content.replace(
            "return self._attempt_batch_translation(",
            "return await self._attempt_batch_translation("
        )
        content = content.replace(
            "mini_result = self._attempt_batch_translation(",
            "mini_result = await self._attempt_batch_translation("
        )
        content = content.replace(
            "return self._make_openai_request_with_retries(",
            "return await self._make_openai_request_with_retries("
        )

        # Change sleep back to asyncio.sleep
        content = content.replace(
            "time.sleep(wait_seconds)",
            "await asyncio.sleep(wait_seconds)"
        )
        content = content.replace(
            "time.sleep(wait_time)",
            "await asyncio.sleep(wait_time)"
        )

        (self.BACKEND_DIR / "translation_services.py").write_text(content)

    def disable_pipeline_overlap(self):
        """Disable pipeline overlap in tasks.py (use sequential processing)."""
        print("🔄 Disabling pipeline overlap...")

        content = (self.BACKEND_DIR / "tasks.py").read_text()

        # Find the condition that enables P1 and change it to always use sequential
        content = re.sub(
            r'if target_lang and target_lang != "auto":.*?# === P1 Pipeline Overlap ===',
            'if False:  # Disable P1 for baseline test\n        # === P1 Pipeline Overlap ===',
            content,
            flags=re.DOTALL
        )

        (self.BACKEND_DIR / "tasks.py").write_text(content)

    def restart_docker(self):
        """Restart Docker containers."""
        print("🐳 Restarting Docker containers...")
        subprocess.run(["docker-compose", "down"], check=True, cwd=self.DOCKER_COMPOSE_FILE.parent)
        time.sleep(2)
        subprocess.run(["docker-compose", "build", "backend", "worker"], check=True, cwd=self.DOCKER_COMPOSE_FILE.parent)
        subprocess.run(["docker-compose", "up", "-d"], check=True, cwd=self.DOCKER_COMPOSE_FILE.parent)

        # Wait for services to be ready
        print("⏳ Waiting for services to be ready...")
        time.sleep(30)

        # Verify backend is actually ready
        max_retries = 10
        for i in range(max_retries):
            try:
                result = subprocess.run(
                    ["curl", "-s", "http://localhost:8081/health"],
                    capture_output=True,
                    timeout=5
                )
                if result.returncode == 0:
                    print("✅ Backend is ready!")
                    break
            except:
                pass

            if i < max_retries - 1:
                print(f"⏳ Waiting for backend... ({i+1}/{max_retries})")
                time.sleep(5)
            else:
                print("⚠️ Backend might not be ready, proceeding anyway...")

        time.sleep(5)  # Extra buffer

    def run_test(self, test_name: str) -> Dict[str, Any]:
        """Run a single performance test."""
        print(f"\n{'='*60}")
        print(f"🧪 Running: {test_name}")
        print(f"{'='*60}\n")

        # Clear Redis
        print("🧹 Clearing Redis...")
        subprocess.run(["docker", "exec", "substranslator-redis-1", "redis-cli", "FLUSHALL"], check=True)

        # Start logging
        log_file = self.RESULTS_DIR / f"{test_name}_logs.txt"
        print(f"📝 Logging to: {log_file}")

        # Run pytest test
        start_time = time.time()

        cmd = [
            "python", "-m", "pytest",
            "backend/tests/e2e/test_online_video_workflows.py",
            "-k", "large and openai",
            "-v", "-s",
            "--tb=short"
        ]

        print(f"🚀 Running command: {' '.join(cmd)}")

        # Run test and capture output
        with open(log_file, "w") as f:
            result = subprocess.run(
                cmd,
                cwd=self.DOCKER_COMPOSE_FILE.parent,
                stdout=f,
                stderr=subprocess.STDOUT,
                text=True
            )

        elapsed_time = time.time() - start_time

        # Extract metrics from Docker logs
        metrics = self.extract_metrics(test_name)
        metrics["test_duration"] = elapsed_time
        metrics["test_passed"] = result.returncode == 0

        print(f"\n✅ Test completed in {elapsed_time:.1f}s")
        print(f"   Test passed: {metrics['test_passed']}")

        return metrics

    def extract_metrics(self, test_name: str) -> Dict[str, Any]:
        """Extract performance metrics from Docker logs."""
        print("📊 Extracting metrics from Docker logs...")

        # Get worker logs
        result = subprocess.run(
            ["docker-compose", "logs", "--tail=500", "worker"],
            cwd=self.DOCKER_COMPOSE_FILE.parent,
            capture_output=True,
            text=True
        )

        logs = result.stdout

        # Save full logs
        (self.RESULTS_DIR / f"{test_name}_docker_logs.txt").write_text(logs)

        metrics = {
            "test_name": test_name,
            "batch_times": [],
            "total_time": None,
            "transcription_time": None,
            "translation_time": None,
            "threads_used": set(),
            "batches_concurrent": 0
        }

        # Extract timing information
        total_time_match = re.search(r'Pipeline complete! Total time: ([\d.]+)s', logs)
        if total_time_match:
            metrics["total_time"] = float(total_time_match.group(1))

        # Extract batch processing times
        batch_matches = re.finditer(r'Batch operation completed.*duration_s=([\d.]+)', logs)
        for match in batch_matches:
            metrics["batch_times"].append(float(match.group(1)))

        # Extract thread IDs
        thread_matches = re.finditer(r'Thread-(\d+)', logs)
        for match in thread_matches:
            metrics["threads_used"].add(match.group(1))

        # Count max concurrent batches
        inflight_values = [int(m.group(1)) for m in re.finditer(r'inflight=(\d+)', logs)]
        if inflight_values:
            metrics["batches_concurrent"] = max(inflight_values)

        return metrics

    def save_report(self, all_results: List[Dict[str, Any]]):
        """Save comprehensive comparison report."""
        report_file = self.RESULTS_DIR / "performance_comparison_report.md"

        with open(report_file, "w") as f:
            f.write("# P1 Performance Comparison Report\n\n")
            f.write(f"**Test Video:** {self.TEST_VIDEO_URL}\n\n")
            f.write(f"**Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("---\n\n")

            # Summary table
            f.write("## Summary\n\n")
            f.write("| Test | Total Time | Batch Times | Threads | Concurrent Batches | Passed |\n")
            f.write("|------|-----------|-------------|---------|-------------------|--------|\n")

            for result in all_results:
                name = result["test_name"]
                total = result.get("total_time", "N/A")
                batch_avg = sum(result["batch_times"]) / len(result["batch_times"]) if result["batch_times"] else "N/A"
                threads = len(result["threads_used"])
                concurrent = result["batches_concurrent"]
                passed = "✅" if result["test_passed"] else "❌"

                f.write(f"| {name} | {total}s | {batch_avg:.1f}s avg | {threads} | {concurrent} | {passed} |\n")

            f.write("\n---\n\n")

            # Detailed results
            f.write("## Detailed Results\n\n")
            for result in all_results:
                f.write(f"### {result['test_name']}\n\n")
                f.write(f"- **Total Time:** {result.get('total_time', 'N/A')}s\n")
                f.write(f"- **Batch Times:** {result['batch_times']}\n")
                f.write(f"- **Threads Used:** {len(result['threads_used'])}\n")
                f.write(f"- **Max Concurrent Batches:** {result['batches_concurrent']}\n")
                f.write(f"- **Test Passed:** {result['test_passed']}\n")
                f.write(f"- **Log File:** `{result['test_name']}_logs.txt`\n")
                f.write(f"- **Docker Logs:** `{result['test_name']}_docker_logs.txt`\n\n")

        print(f"\n📄 Report saved to: {report_file}")

    def run_all_tests(self):
        """Run all 4 performance tests."""
        all_results = []

        try:
            self.backup_files()

            # Test 1: Baseline (Sequential, with asyncio)
            print("\n" + "="*60)
            print("TEST 1: Baseline (Sequential Processing)")
            print("="*60)
            self.disable_pipeline_overlap()
            self.enable_asyncio()
            self.update_docker_compose(parallelism=1, max_concurrent=1)
            self.restart_docker()
            result1 = self.run_test("test1_baseline_sequential")
            all_results.append(result1)

            # Restore files for next test
            self.restore_files()

            # Test 2: P1 with asyncio.run + 4 threads
            print("\n" + "="*60)
            print("TEST 2: P1 with asyncio.run + 4 threads")
            print("="*60)
            self.enable_asyncio()
            self.update_docker_compose(parallelism=4, max_concurrent=4)
            self.restart_docker()
            result2 = self.run_test("test2_p1_asyncio_4threads")
            all_results.append(result2)

            # Restore files for next test
            self.restore_files()

            # Test 3: P1 sync + 1 thread (Current)
            print("\n" + "="*60)
            print("TEST 3: P1 sync + 1 thread")
            print("="*60)
            self.update_docker_compose(parallelism=1, max_concurrent=1)
            self.restart_docker()
            result3 = self.run_test("test3_p1_sync_1thread")
            all_results.append(result3)

            # Test 4: P1 sync + 4 threads (Optimal)
            print("\n" + "="*60)
            print("TEST 4: P1 sync + 4 threads")
            print("="*60)
            self.update_docker_compose(parallelism=4, max_concurrent=4)
            self.restart_docker()
            result4 = self.run_test("test4_p1_sync_4threads")
            all_results.append(result4)

            # Generate report
            self.save_report(all_results)

            print("\n" + "="*60)
            print("✅ All tests completed!")
            print("="*60)

        finally:
            # Restore original configuration
            print("\n🔄 Restoring original configuration...")
            self.restore_files()
            self.restart_docker()
            print("✅ Restoration complete!")


if __name__ == "__main__":
    tester = PerformanceTest()
    tester.run_all_tests()
