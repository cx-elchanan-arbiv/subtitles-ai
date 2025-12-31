#!/usr/bin/env python3
"""
CI Compatibility Checker for SubsTranslator Tests
Checks if our tests will work properly in GitHub Actions CI environment.
"""

import os
import sys
import subprocess
from pathlib import Path


class CICompatibilityChecker:
    """Check if tests are compatible with CI environment."""
    
    def __init__(self):
        self.issues = []
        self.warnings = []
        
    def check_test_structure(self):
        """Check if test structure matches CI expectations."""
        
        print("🔍 CHECKING TEST STRUCTURE...")
        
        # Check if required directories exist
        required_dirs = ['tests/unit', 'tests/integration', 'tests/e2e']
        for dir_path in required_dirs:
            if not os.path.exists(dir_path):
                self.issues.append(f"Missing directory: {dir_path}")
            else:
                print(f"  ✅ {dir_path} exists")
        
        # Check for __init__.py files
        for dir_path in required_dirs:
            if os.path.exists(dir_path):
                init_file = os.path.join(dir_path, '__init__.py')
                if not os.path.exists(init_file):
                    self.warnings.append(f"Missing __init__.py in {dir_path}")
                else:
                    print(f"  ✅ {init_file} exists")
    
    def check_test_markers(self):
        """Check if tests use proper pytest markers for CI filtering."""
        
        print("\n🏷️ CHECKING TEST MARKERS...")
        
        # CI runs: pytest tests/ -m "not integration and not e2e"
        # So we need unit tests to NOT have integration/e2e markers
        
        unit_tests_with_wrong_markers = []
        integration_tests_without_markers = []
        e2e_tests_without_markers = []
        
        for test_file in Path('tests').rglob('test_*.py'):
            if test_file.name == 'test_ci_compatibility.py':
                continue
                
            try:
                with open(test_file, 'r') as f:
                    content = f.read()
                
                # Check unit tests
                if 'tests/unit/' in str(test_file):
                    if '@pytest.mark.integration' in content or '@pytest.mark.e2e' in content:
                        unit_tests_with_wrong_markers.append(str(test_file))
                    elif '@pytest.mark.unit' not in content:
                        self.warnings.append(f"Unit test missing @pytest.mark.unit: {test_file}")
                
                # Check integration tests
                elif 'tests/integration/' in str(test_file):
                    if '@pytest.mark.integration' not in content:
                        integration_tests_without_markers.append(str(test_file))
                
                # Check E2E tests
                elif 'tests/e2e/' in str(test_file):
                    if '@pytest.mark.e2e' not in content:
                        e2e_tests_without_markers.append(str(test_file))
                        
            except Exception as e:
                self.warnings.append(f"Could not read {test_file}: {e}")
        
        if unit_tests_with_wrong_markers:
            for test in unit_tests_with_wrong_markers:
                self.issues.append(f"Unit test has integration/e2e marker: {test}")
        
        if integration_tests_without_markers:
            for test in integration_tests_without_markers:
                self.issues.append(f"Integration test missing @pytest.mark.integration: {test}")
        
        if e2e_tests_without_markers:
            for test in e2e_tests_without_markers:
                self.issues.append(f"E2E test missing @pytest.mark.e2e: {test}")
        
        print(f"  ✅ Checked markers in test files")
    
    def check_dependencies(self):
        """Check if all test dependencies are properly declared."""
        
        print("\n📦 CHECKING TEST DEPENDENCIES...")
        
        # Check requirements-test.txt exists
        if not os.path.exists('requirements-test.txt'):
            self.issues.append("Missing requirements-test.txt file")
            return
        
        # Check if critical dependencies are listed
        with open('requirements-test.txt', 'r') as f:
            requirements = f.read()
        
        critical_deps = [
            'pytest>=',
            'pytest-mock>=', 
            'pytest-cov>=',
            'pytest-timeout>=',
        ]
        
        for dep in critical_deps:
            if dep not in requirements:
                self.issues.append(f"Missing test dependency: {dep}")
            else:
                print(f"  ✅ {dep} found in requirements-test.txt")
        
        # Check for problematic dependencies that might not work in CI
        problematic_deps = [
            'selenium',  # Requires browser setup
            'playwright',  # Requires browser setup
        ]
        
        for dep in problematic_deps:
            if dep in requirements:
                self.warnings.append(f"Dependency {dep} requires special CI setup")
    
    def check_ci_environment_compatibility(self):
        """Check if tests are compatible with CI environment constraints."""
        
        print("\n🏗️ CHECKING CI ENVIRONMENT COMPATIBILITY...")
        
        # Check for tests that require external services
        external_service_indicators = [
            'requests.get(',
            'requests.post(',
            'youtube.com',
            'openai.com',
            'subprocess.run',
            'docker',
        ]
        
        tests_needing_services = []
        
        for test_file in Path('tests/unit').rglob('test_*.py'):
            try:
                with open(test_file, 'r') as f:
                    content = f.read()
                
                for indicator in external_service_indicators:
                    if indicator in content and 'mock' not in content.lower():
                        tests_needing_services.append((str(test_file), indicator))
                        
            except Exception:
                continue
        
        if tests_needing_services:
            for test_file, indicator in tests_needing_services:
                self.warnings.append(f"Unit test may need external service: {test_file} ({indicator})")
        
        print(f"  ✅ Checked {len(list(Path('tests/unit').rglob('test_*.py')))} unit tests")
    
    def check_import_paths(self):
        """Check if import paths work in CI environment."""
        
        print("\n🔗 CHECKING IMPORT PATHS...")
        
        # Check for relative imports that might break in CI
        problematic_patterns = [
            'from backend.',
            'import backend.',
            'sys.path.append',
            'sys.path.insert',
        ]
        
        import_issues = []
        
        for test_file in Path('tests').rglob('test_*.py'):
            if test_file.name == 'test_ci_compatibility.py':
                continue
                
            try:
                with open(test_file, 'r') as f:
                    content = f.read()
                
                for pattern in problematic_patterns:
                    if pattern in content:
                        import_issues.append((str(test_file), pattern))
                        
            except Exception:
                continue
        
        for test_file, pattern in import_issues:
            self.warnings.append(f"Potentially problematic import: {test_file} ({pattern})")
        
        print(f"  ✅ Checked import patterns in test files")
    
    def check_github_actions_config(self):
        """Check if GitHub Actions is properly configured for our tests."""
        
        print("\n⚙️ CHECKING GITHUB ACTIONS CONFIG...")
        
        ci_file = '.github/workflows/ci.yml'
        if not os.path.exists(ci_file):
            self.issues.append("Missing .github/workflows/ci.yml")
            return
        
        with open(ci_file, 'r') as f:
            ci_config = f.read()
        
        # Check if CI runs the right pytest command
        expected_pytest_cmd = 'pytest tests/ -m "not integration and not e2e"'
        if expected_pytest_cmd not in ci_config:
            self.warnings.append("CI might not be filtering tests correctly")
        
        # Check if OPENAI_API_KEY is configured
        if 'OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}' not in ci_config:
            self.warnings.append("OPENAI_API_KEY secret not configured in CI")
        
        # Check if test environment variables are set
        test_env_vars = ['FLASK_TESTING', 'TESTING', 'DISABLE_RATE_LIMIT']
        for env_var in test_env_vars:
            if env_var not in ci_config:
                self.warnings.append(f"Test environment variable {env_var} not set in CI")
        
        print(f"  ✅ GitHub Actions config checked")
    
    def generate_fixes(self):
        """Generate fixes for identified issues."""
        
        fixes = []
        
        if self.issues:
            fixes.append("## 🚨 CRITICAL FIXES NEEDED:")
            for issue in self.issues:
                fixes.append(f"- {issue}")
        
        if self.warnings:
            fixes.append("\n## ⚠️ WARNINGS TO ADDRESS:")
            for warning in self.warnings:
                fixes.append(f"- {warning}")
        
        # Add specific fix suggestions
        fixes.extend([
            "\n## 🔧 SUGGESTED FIXES:",
            "",
            "### For Unit Tests:",
            "- Add @pytest.mark.unit to all unit tests",
            "- Remove @pytest.mark.integration and @pytest.mark.e2e from unit tests",
            "- Mock external services instead of calling them directly",
            "",
            "### For Import Issues:",
            "- Use 'pip install -e backend/' in CI to make backend importable",
            "- Or use PYTHONPATH environment variable",
            "",
            "### For CI Configuration:",
            "- Ensure OPENAI_API_KEY is set in GitHub repository secrets",
            "- Set test environment variables in CI workflow",
            "- Install system dependencies (ffmpeg) in CI",
        ])
        
        return "\n".join(fixes)
    
    def run_full_check(self):
        """Run complete CI compatibility check."""
        
        print("🚀 CI COMPATIBILITY CHECK FOR SUBSTRANSLATOR")
        print("=" * 60)
        
        self.check_test_structure()
        self.check_test_markers() 
        self.check_dependencies()
        self.check_ci_environment_compatibility()
        self.check_import_paths()
        self.check_github_actions_config()
        
        print("\n" + "=" * 60)
        print("📊 RESULTS:")
        print(f"Issues: {len(self.issues)}")
        print(f"Warnings: {len(self.warnings)}")
        
        if not self.issues and not self.warnings:
            print("\n🎉 ALL CHECKS PASSED!")
            print("Your tests should work perfectly in GitHub Actions CI!")
            return True
        else:
            print(f"\n{self.generate_fixes()}")
            return len(self.issues) == 0  # Return True if only warnings


def main():
    """Run CI compatibility check."""
    checker = CICompatibilityChecker()
    success = checker.run_full_check()
    
    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
