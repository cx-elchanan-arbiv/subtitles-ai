#!/usr/bin/env python3
"""
Pre-Push Check Script for SubsTranslator
Runs comprehensive tests locally before pushing to catch bugs early.
"""

import subprocess
import sys
import time
import os
from pathlib import Path


class PrePushChecker:
    """Run comprehensive checks before pushing code."""
    
    def __init__(self):
        self.failed_checks = []
        self.warnings = []
        self.start_time = time.time()
    
    def run_command(self, cmd, description, critical=True):
        """Run a command and track results."""
        print(f"\n🔍 {description}...")
        print(f"   Command: {' '.join(cmd)}")
        
        start = time.time()
        try:
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=300
            )
            duration = time.time() - start
            
            if result.returncode == 0:
                print(f"   ✅ PASSED ({duration:.1f}s)")
                if result.stdout.strip():
                    # Show summary for some commands
                    if "pytest" in cmd[0]:
                        lines = result.stdout.split('\n')
                        summary_lines = [line for line in lines if 'passed' in line or 'failed' in line or 'error' in line]
                        if summary_lines:
                            print(f"   📊 {summary_lines[-1]}")
                return True
            else:
                print(f"   ❌ FAILED ({duration:.1f}s)")
                if result.stderr:
                    print(f"   Error: {result.stderr[:200]}...")
                if result.stdout:
                    print(f"   Output: {result.stdout[:200]}...")
                
                if critical:
                    self.failed_checks.append(description)
                else:
                    self.warnings.append(description)
                return False
                
        except subprocess.TimeoutExpired:
            print(f"   ⏰ TIMEOUT (>5min)")
            if critical:
                self.failed_checks.append(f"{description} (timeout)")
            return False
        except Exception as e:
            print(f"   💥 ERROR: {e}")
            if critical:
                self.failed_checks.append(f"{description} (error)")
            return False
    
    def check_git_status(self):
        """Check git status for uncommitted changes."""
        print("🔍 Checking Git Status...")
        
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True)
        
        if result.stdout.strip():
            print("   ⚠️  You have uncommitted changes:")
            print(f"   {result.stdout}")
            self.warnings.append("Uncommitted changes detected")
        else:
            print("   ✅ Working directory clean")
        
        # Check current branch
        result = subprocess.run(['git', 'branch', '--show-current'], 
                              capture_output=True, text=True)
        current_branch = result.stdout.strip()
        
        if current_branch == 'main':
            print("   ⚠️  You're on main branch!")
            self.warnings.append("Pushing directly to main")
        else:
            print(f"   ✅ On feature branch: {current_branch}")
    
    def run_fast_checks(self):
        """Run fast checks that should always pass."""
        print("\n" + "="*60)
        print("🏃‍♂️ FAST CHECKS (must pass)")
        print("="*60)
        
        # 1. Unit tests (same as CI)
        success = self.run_command([
            'python3', '-m', 'pytest', 
            'tests/', '-m', 'not integration and not e2e',
            '-v', '--tb=short', '-x'  # Stop on first failure
        ], "Unit Tests (CI equivalent)", critical=True)
        
        if not success:
            print("   🚨 CRITICAL: Unit tests failed - these will fail in CI!")
            return False
        
        # 2. Code formatting check
        self.run_command([
            'python3', '-c', 
            "import black; black.main(['--check', 'backend/'])"
        ], "Code Formatting (Black)", critical=False)
        
        # 3. Import sorting check
        self.run_command([
            'python3', '-c',
            "import isort; isort.main(['--check-only', 'backend/'])"
        ], "Import Sorting (isort)", critical=False)
        
        return True
    
    def run_integration_checks(self):
        """Run integration checks if Docker is available."""
        print("\n" + "="*60)
        print("🔗 INTEGRATION CHECKS (if Docker running)")
        print("="*60)
        
        # Check if Docker is running
        docker_check = subprocess.run(['docker', 'ps'], 
                                    capture_output=True, text=True)
        
        if docker_check.returncode != 0:
            print("   ⚠️  Docker not running - skipping integration tests")
            self.warnings.append("Docker not available for integration tests")
            return True
        
        # Check if our services are running
        compose_check = subprocess.run(['docker', 'compose', 'ps'], 
                                     capture_output=True, text=True)
        
        if 'backend' not in compose_check.stdout:
            print("   ⚠️  Backend service not running - skipping integration tests")
            print("   💡 Run: docker compose up -d")
            self.warnings.append("Backend service not running")
            return True
        
        # Run integration tests
        return self.run_command([
            'python3', '-m', 'pytest',
            'tests/integration/', '-v', '--tb=short',
            '-x'  # Stop on first failure
        ], "Integration Tests", critical=False)
    
    def run_security_checks(self):
        """Run security and quality checks."""
        print("\n" + "="*60)
        print("🔒 SECURITY & QUALITY CHECKS")
        print("="*60)
        
        # 1. Check for hardcoded secrets
        self.run_command([
            'python3', '-c',
            """
import re, os
patterns = [r'sk-[a-zA-Z0-9]{48,}', r'password.*=.*[\'"][^\'\"]+[\'"]']
for root, dirs, files in os.walk('backend'):
    for file in files:
        if file.endswith('.py'):
            with open(os.path.join(root, file)) as f:
                content = f.read()
                for pattern in patterns:
                    if re.search(pattern, content, re.IGNORECASE):
                        print(f'Potential secret in {file}')
                        exit(1)
print('No hardcoded secrets found')
            """
        ], "Hardcoded Secrets Check", critical=True)
        
        # 2. Run mutation testing on critical functions
        mutation_files = [
            ('backend/app.py', 'tests/unit/test_translation_services_unit.py'),
        ]
        
        for target, test in mutation_files:
            if os.path.exists(target) and os.path.exists(test):
                self.run_command([
                    'python3', 'scripts/run_mutation_tests.py',
                    target, test
                ], f"Mutation Testing ({os.path.basename(target)})", critical=False)
    
    def run_critical_path_analysis(self):
        """Run critical path analysis."""
        print("\n" + "="*60)
        print("🎯 CRITICAL PATH ANALYSIS")
        print("="*60)
        
        self.run_command([
            'python3', 'tests/test_critical_paths_analysis.py'
        ], "Critical Path Coverage Analysis", critical=False)
    
    def generate_report(self):
        """Generate final report."""
        duration = time.time() - self.start_time
        
        print("\n" + "="*60)
        print("📊 PRE-PUSH CHECK REPORT")
        print("="*60)
        
        print(f"⏱️  Total time: {duration:.1f} seconds")
        print(f"❌ Failed checks: {len(self.failed_checks)}")
        print(f"⚠️  Warnings: {len(self.warnings)}")
        
        if self.failed_checks:
            print(f"\n🚨 CRITICAL FAILURES:")
            for failure in self.failed_checks:
                print(f"   - {failure}")
        
        if self.warnings:
            print(f"\n⚠️  WARNINGS:")
            for warning in self.warnings:
                print(f"   - {warning}")
        
        if not self.failed_checks and not self.warnings:
            print("\n🎉 ALL CHECKS PASSED!")
            print("✅ Your code is ready to push!")
            return True
        elif not self.failed_checks:
            print("\n👍 NO CRITICAL FAILURES!")
            print("⚠️  Some warnings - consider addressing them")
            print("✅ Safe to push")
            return True
        else:
            print("\n🛑 PUSH BLOCKED!")
            print("❌ Fix critical failures before pushing")
            return False


def main():
    """Run pre-push checks."""
    print("🚀 PRE-PUSH CHECKS FOR SUBSTRANSLATOR")
    print("This will catch bugs before they reach CI/CD")
    print("="*60)
    
    checker = PrePushChecker()
    
    # Check git status
    checker.check_git_status()
    
    # Run fast checks (must pass)
    if not checker.run_fast_checks():
        print("\n🚨 FAST CHECKS FAILED - STOPPING")
        checker.generate_report()
        sys.exit(1)
    
    # Run integration checks (if possible)
    checker.run_integration_checks()
    
    # Run security checks
    checker.run_security_checks()
    
    # Run critical path analysis
    checker.run_critical_path_analysis()
    
    # Generate final report
    success = checker.generate_report()
    
    if not success:
        print("\n💡 NEXT STEPS:")
        print("1. Fix the critical failures listed above")
        print("2. Run this script again")
        print("3. Push when all checks pass")
        sys.exit(1)
    else:
        print("\n🚀 READY TO PUSH!")
        print("Your code passed all checks and should work in CI")


if __name__ == "__main__":
    main()
