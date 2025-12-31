#!/usr/bin/env python3
"""
Mutation Testing Script for SubsTranslator
Tests the quality of our tests by introducing bugs and seeing if tests catch them.
"""

import os
import sys
import ast
import subprocess
import tempfile
import shutil
from pathlib import Path


class MutationTester:
    """Simple mutation testing implementation."""
    
    def __init__(self, target_file, test_file):
        self.target_file = Path(target_file)
        self.test_file = Path(test_file)
        self.mutations = []
        self.results = []
    
    def create_mutations(self):
        """Create mutations of the target file."""
        
        with open(self.target_file, 'r') as f:
            original_code = f.read()
        
        tree = ast.parse(original_code)
        
        # Define mutations
        mutations = [
            # Boolean mutations
            {'from': 'True', 'to': 'False', 'type': 'boolean'},
            {'from': 'False', 'to': 'True', 'type': 'boolean'},
            
            # Comparison mutations
            {'from': '==', 'to': '!=', 'type': 'comparison'},
            {'from': '!=', 'to': '==', 'type': 'comparison'},
            {'from': '<', 'to': '>=', 'type': 'comparison'},
            {'from': '>', 'to': '<=', 'type': 'comparison'},
            {'from': '<=', 'to': '>', 'type': 'comparison'},
            {'from': '>=', 'to': '<', 'type': 'comparison'},
            
            # Arithmetic mutations
            {'from': '+', 'to': '-', 'type': 'arithmetic'},
            {'from': '-', 'to': '+', 'type': 'arithmetic'},
            {'from': '*', 'to': '/', 'type': 'arithmetic'},
            {'from': '/', 'to': '*', 'type': 'arithmetic'},
            
            # Logical mutations
            {'from': 'and', 'to': 'or', 'type': 'logical'},
            {'from': 'or', 'to': 'and', 'type': 'logical'},
            
            # Return value mutations
            {'from': 'return True', 'to': 'return False', 'type': 'return'},
            {'from': 'return False', 'to': 'return True', 'type': 'return'},
            
            # Specific to our code
            {'from': "'sk-'", 'to': "'sk_'", 'type': 'string'},
            {'from': '< 20', 'to': '< 10', 'type': 'number'},
            {'from': 'startswith', 'to': 'endswith', 'type': 'method'},
        ]
        
        created_mutations = []
        
        for mutation in mutations:
            if mutation['from'] in original_code:
                mutated_code = original_code.replace(
                    mutation['from'], 
                    mutation['to'], 
                    1  # Only replace first occurrence
                )
                
                if mutated_code != original_code:
                    created_mutations.append({
                        'mutation': mutation,
                        'code': mutated_code,
                        'description': f"Changed '{mutation['from']}' to '{mutation['to']}'"
                    })
        
        return created_mutations
    
    def run_tests_on_mutation(self, mutated_code, mutation_desc):
        """Run tests on a mutated version of the code."""
        
        # Create temporary file with mutation
        with tempfile.NamedTemporaryFile(
            mode='w', 
            suffix='.py', 
            delete=False,
            dir=self.target_file.parent
        ) as temp_file:
            temp_file.write(mutated_code)
            temp_path = Path(temp_file.name)
        
        try:
            # Backup original file
            backup_path = self.target_file.with_suffix('.bak')
            shutil.copy2(self.target_file, backup_path)
            
            # Replace original with mutation
            shutil.copy2(temp_path, self.target_file)
            
            # Run tests
            result = subprocess.run([
                sys.executable, '-m', 'pytest', 
                str(self.test_file), 
                '-v', '--tb=no', '-q'
            ], capture_output=True, text=True, cwd=self.target_file.parent.parent)
            
            # Analyze result
            test_passed = result.returncode == 0
            
            return {
                'mutation': mutation_desc,
                'test_passed': test_passed,
                'killed': not test_passed,  # Mutation is "killed" if tests fail
                'output': result.stdout + result.stderr
            }
            
        finally:
            # Restore original file
            if backup_path.exists():
                shutil.copy2(backup_path, self.target_file)
                backup_path.unlink()
            
            # Clean up temp file
            if temp_path.exists():
                temp_path.unlink()
    
    def run_mutation_testing(self):
        """Run complete mutation testing."""
        
        print(f"🧬 MUTATION TESTING: {self.target_file.name}")
        print("=" * 60)
        
        # Create mutations
        mutations = self.create_mutations()
        print(f"📊 Created {len(mutations)} mutations")
        
        if not mutations:
            print("❌ No mutations could be created")
            return
        
        # Test original code first
        print("\n🧪 Testing original code...")
        original_result = subprocess.run([
            sys.executable, '-m', 'pytest', 
            str(self.test_file), 
            '-v', '--tb=no', '-q'
        ], capture_output=True, text=True, cwd=self.target_file.parent.parent)
        
        if original_result.returncode != 0:
            print("❌ Original tests are failing! Fix tests first.")
            print(original_result.stdout + original_result.stderr)
            return
        
        print("✅ Original tests pass")
        
        # Run mutations
        killed_mutations = 0
        survived_mutations = 0
        
        print(f"\n🔬 Testing {len(mutations)} mutations...")
        
        for i, mutation in enumerate(mutations, 1):
            print(f"\n[{i}/{len(mutations)}] {mutation['description']}")
            
            result = self.run_tests_on_mutation(
                mutation['code'], 
                mutation['description']
            )
            
            if result['killed']:
                print("  ✅ KILLED - Tests caught the mutation")
                killed_mutations += 1
            else:
                print("  ❌ SURVIVED - Tests did not catch the mutation")
                print(f"     This indicates a potential gap in test coverage")
                survived_mutations += 1
            
            self.results.append(result)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 MUTATION TESTING RESULTS:")
        print(f"Total mutations: {len(mutations)}")
        print(f"Killed: {killed_mutations}")
        print(f"Survived: {survived_mutations}")
        
        mutation_score = (killed_mutations / len(mutations)) * 100 if mutations else 0
        print(f"Mutation Score: {mutation_score:.1f}%")
        
        if mutation_score >= 80:
            print("🎉 EXCELLENT - High quality tests!")
        elif mutation_score >= 60:
            print("👍 GOOD - Tests are decent, some improvements possible")
        elif mutation_score >= 40:
            print("⚠️  FAIR - Tests need improvement")
        else:
            print("🚨 POOR - Tests have significant gaps")
        
        # Show survived mutations (these indicate test gaps)
        if survived_mutations > 0:
            print(f"\n🚨 SURVIVED MUTATIONS (test gaps):")
            for result in self.results:
                if not result['killed']:
                    print(f"  - {result['mutation']}")
        
        return mutation_score


def main():
    """Run mutation testing on critical functions."""
    
    if len(sys.argv) != 3:
        print("Usage: python run_mutation_tests.py <target_file> <test_file>")
        print("Example: python run_mutation_tests.py backend/app.py tests/unit/test_translation_services_unit.py")
        return
    
    target_file = sys.argv[1]
    test_file = sys.argv[2]
    
    if not os.path.exists(target_file):
        print(f"❌ Target file not found: {target_file}")
        return
    
    if not os.path.exists(test_file):
        print(f"❌ Test file not found: {test_file}")
        return
    
    tester = MutationTester(target_file, test_file)
    score = tester.run_mutation_testing()
    
    # Exit with non-zero if mutation score is too low
    if score < 60:
        sys.exit(1)


if __name__ == "__main__":
    main()
