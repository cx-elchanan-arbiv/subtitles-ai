#!/usr/bin/env python3
"""
Test runner for SubsTranslator with organized test categories
"""
import subprocess
import sys
import argparse
import time


def run_command(cmd, description):
    """Run a command and return success status"""
    print(f"\n🔍 {description}")
    print(f"Running: {' '.join(cmd)}")
    
    start_time = time.time()
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        duration = time.time() - start_time
        
        if result.returncode == 0:
            print(f"✅ {description} - Passed ({duration:.1f}s)")
            if result.stdout:
                print("Output:", result.stdout[:500])  # First 500 chars
            return True
        else:
            print(f"❌ {description} - Failed ({duration:.1f}s)")
            if result.stderr:
                print("Error:", result.stderr[:500])
            return False
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - Timed out after 5 minutes")
        return False
    except Exception as e:
        print(f"💥 {description} - Exception: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Run SubsTranslator tests")
    parser.add_argument("--category", choices=["unit", "integration", "e2e", "all"], 
                       default="unit", help="Test category to run")
    parser.add_argument("--include-slow", action="store_true", 
                       help="Include slow tests (downloads from internet)")
    parser.add_argument("--backend-required", action="store_true",
                       help="Include tests that require running backend")
    parser.add_argument("--verbose", "-v", action="store_true",
                       help="Verbose output")
    
    args = parser.parse_args()
    
    print("🚀 SubsTranslator Test Suite")
    print("=" * 50)
    
    # Build pytest command
    cmd = ["python", "-m", "pytest"]
    
    if args.verbose:
        cmd.append("-v")
    
    # Add test directory based on category
    if args.category == "unit":
        cmd.append("tests/unit/")
        print("📋 Running UNIT tests (fast, isolated)")
        # Unit tests don't need special markers
    elif args.category == "integration":
        cmd.append("tests/integration/")
        print("🔗 Running INTEGRATION tests (component interactions)")
        if not args.backend_required:
            cmd.extend(["-m", "not requires_backend"])
            print("📌 Excluding tests that require backend")
    elif args.category == "e2e":
        cmd.append("tests/e2e/")
        print("🎭 Running E2E tests (complete application flow)")
        if not args.include_slow:
            cmd.extend(["-m", "not slow"])
            print("📌 Excluding slow tests")
    else:  # all
        cmd.append("tests/")
        print("🎯 Running ALL tests")
        
        # Add markers for all tests
        markers = []
        if not args.include_slow:
            markers.append("not slow")
        if not args.backend_required:
            markers.append("not requires_backend")
        
        if markers:
            cmd.extend(["-m", " and ".join(markers)])
            print(f"📌 Markers: {' and '.join(markers)}")
    
    # Run tests
    success = run_command(cmd, f"{args.category.upper()} Tests")
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Tests completed successfully!")
    else:
        print("❌ Some tests failed. Check output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()