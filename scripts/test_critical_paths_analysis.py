#!/usr/bin/env python3
"""
Critical Path Analysis for SubsTranslator
Identifies gaps in test coverage for critical business logic
"""

import os
import sys
import ast
import inspect
from pathlib import Path

# Add backend to path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend'))
sys.path.insert(0, backend_dir)


class CriticalPathAnalyzer:
    """Analyze critical code paths that need comprehensive testing."""
    
    def __init__(self):
        self.critical_functions = []
        self.untested_paths = []
        
    def identify_critical_paths(self):
        """Identify critical code paths in the application."""
        
        # 1. Data Processing Paths (high risk of data loss)
        critical_data_paths = [
            "process_video_task",           # Main video processing
            "create_srt_file",             # Subtitle generation
            "embed_subtitles_in_video",    # Video modification
            "download_youtube_video",      # External data retrieval
            "translate_batch",             # Translation logic
        ]
        
        # 2. Configuration/Security Paths (high risk of security issues)
        critical_security_paths = [
            "_is_valid_openai_key",        # API key validation
            "get_translation_services",    # Service availability
            "secure_filename",             # File security
            "validate_file_extension",     # Upload security
            "generate_download_token",     # Access control
        ]
        
        # 3. State Management Paths (high risk of inconsistency)
        critical_state_paths = [
            "set_step_progress",           # Task progress
            "fail_task",                   # Error handling
            "complete_task",               # Task completion
            "_update_celery_state",        # State synchronization
        ]
        
        # 4. External Integration Paths (high risk of failures)
        critical_integration_paths = [
            "OpenAITranslator.translate_batch",  # OpenAI API calls
            "SmartWhisperManager.transcribe",   # Whisper integration
            "FFmpeg subprocess calls",          # Video processing
            "Redis state storage",              # Cache operations
        ]
        
        return {
            "data_processing": critical_data_paths,
            "security": critical_security_paths, 
            "state_management": critical_state_paths,
            "external_integration": critical_integration_paths
        }
    
    def analyze_test_coverage_gaps(self):
        """Analyze what critical paths are missing proper tests."""
        
        gaps = {
            "missing_edge_cases": [
                "OpenAI API returns malformed response",
                "FFmpeg process killed mid-execution", 
                "Redis connection lost during task",
                "Disk full during file write",
                "Invalid UTF-8 in subtitle content",
                "Concurrent access to same file",
                "Task timeout during critical section"
            ],
            
            "missing_error_scenarios": [
                "OpenAI quota exceeded",
                "YouTube video becomes unavailable mid-download",
                "Whisper model loading fails",
                "Subtitle file corruption",
                "Invalid video format after processing",
                "Memory exhaustion during processing"
            ],
            
            "missing_integration_tests": [
                "End-to-end with real OpenAI API failure recovery",
                "File cleanup after partial failures", 
                "State recovery after worker restart",
                "Concurrent task processing with shared resources",
                "Database/Redis consistency under load"
            ],
            
            "missing_security_tests": [
                "Path traversal in file operations",
                "API key leakage in logs",
                "Unauthorized access to download tokens",
                "File upload size limit bypass",
                "XSS in error messages"
            ]
        }
        
        return gaps
    
    def create_mutation_test_suggestions(self):
        """Suggest mutation tests to verify test quality."""
        
        mutations = [
            {
                "target": "_is_valid_openai_key",
                "mutations": [
                    "Change 'sk-' check to 'sk_'",
                    "Change length check from < 20 to < 10", 
                    "Remove placeholder check",
                    "Always return True"
                ],
                "expected": "Tests should catch all these mutations"
            },
            
            {
                "target": "translate_batch", 
                "mutations": [
                    "Return empty list instead of translations",
                    "Return original text instead of translations",
                    "Swap source and target languages",
                    "Skip error handling"
                ],
                "expected": "Tests should detect translation failures"
            },
            
            {
                "target": "set_step_progress",
                "mutations": [
                    "Don't update Celery state",
                    "Allow progress > 100",
                    "Skip thread locking",
                    "Don't validate step_index"
                ],
                "expected": "Tests should catch state inconsistencies"
            }
        ]
        
        return mutations
    
    def generate_test_recommendations(self):
        """Generate specific test recommendations."""
        
        recommendations = [
            {
                "category": "Critical Path Coverage",
                "tests_needed": [
                    "test_video_processing_with_disk_full",
                    "test_openai_api_failure_recovery", 
                    "test_concurrent_task_state_management",
                    "test_partial_failure_cleanup",
                    "test_worker_restart_state_recovery"
                ]
            },
            
            {
                "category": "Security Testing",
                "tests_needed": [
                    "test_path_traversal_prevention",
                    "test_api_key_not_logged",
                    "test_file_upload_size_limits",
                    "test_download_token_expiration",
                    "test_error_message_sanitization"
                ]
            },
            
            {
                "category": "Data Integrity",
                "tests_needed": [
                    "test_subtitle_encoding_preservation",
                    "test_video_metadata_consistency",
                    "test_file_atomic_operations",
                    "test_task_result_serialization",
                    "test_progress_state_accuracy"
                ]
            },
            
            {
                "category": "Performance & Reliability", 
                "tests_needed": [
                    "test_memory_usage_under_load",
                    "test_task_timeout_handling",
                    "test_resource_cleanup_on_error",
                    "test_rate_limiting_effectiveness",
                    "test_concurrent_request_handling"
                ]
            }
        ]
        
        return recommendations


def main():
    """Run critical path analysis."""
    analyzer = CriticalPathAnalyzer()
    
    print("🔍 CRITICAL PATH ANALYSIS FOR SUBSTRANSLATOR")
    print("=" * 60)
    
    # 1. Identify critical paths
    critical_paths = analyzer.identify_critical_paths()
    print("\n📋 CRITICAL CODE PATHS:")
    for category, paths in critical_paths.items():
        print(f"\n{category.upper()}:")
        for path in paths:
            print(f"  - {path}")
    
    # 2. Analyze coverage gaps
    gaps = analyzer.analyze_test_coverage_gaps()
    print("\n🚨 TEST COVERAGE GAPS:")
    for category, items in gaps.items():
        print(f"\n{category.upper().replace('_', ' ')}:")
        for item in items:
            print(f"  - {item}")
    
    # 3. Mutation test suggestions
    mutations = analyzer.create_mutation_test_suggestions()
    print("\n🧬 MUTATION TEST SUGGESTIONS:")
    for mutation in mutations:
        print(f"\nTarget: {mutation['target']}")
        print("Mutations to test:")
        for mut in mutation['mutations']:
            print(f"  - {mut}")
        print(f"Expected: {mutation['expected']}")
    
    # 4. Test recommendations
    recommendations = analyzer.generate_test_recommendations()
    print("\n💡 TEST RECOMMENDATIONS:")
    for rec in recommendations:
        print(f"\n{rec['category'].upper()}:")
        for test in rec['tests_needed']:
            print(f"  - {test}")
    
    print("\n" + "=" * 60)
    print("📊 SUMMARY:")
    total_gaps = sum(len(items) for items in gaps.values())
    total_recommendations = sum(len(rec['tests_needed']) for rec in recommendations)
    print(f"- {total_gaps} coverage gaps identified")
    print(f"- {total_recommendations} new tests recommended")
    print(f"- {len(mutations)} mutation test targets")
    print("\n🎯 PRIORITY: Focus on data processing and security paths first!")


if __name__ == "__main__":
    main()
