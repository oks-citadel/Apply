#!/usr/bin/env python3
"""
Verification script for AI Service test suite.
Checks that all test files are in place and can be imported.
"""

import sys
import os
from pathlib import Path

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_colored(text, color):
    """Print colored text."""
    print(f"{color}{text}{RESET}")

def check_file_exists(filepath):
    """Check if a file exists."""
    path = Path(filepath)
    if path.exists():
        size = path.stat().st_size
        return True, size
    return False, 0

def main():
    """Main verification function."""
    print_colored("=" * 70, BLUE)
    print_colored("AI SERVICE TEST SUITE VERIFICATION", BLUE)
    print_colored("=" * 70, BLUE)
    print()

    # Define expected files
    test_files = [
        "tests/__init__.py",
        "tests/conftest.py",
        "tests/test_api_endpoints.py",
        "tests/test_llm_service.py",
        "tests/test_matching_service.py",
        "tests/test_integration.py",
    ]

    config_files = [
        "pytest.ini",
        "tests/requirements-test.txt",
    ]

    doc_files = [
        "tests/README.md",
        "tests/TEST_SUMMARY.md",
    ]

    runner_files = [
        "run_tests.sh",
        "run_tests.bat",
    ]

    all_files = {
        "Test Files": test_files,
        "Configuration Files": config_files,
        "Documentation": doc_files,
        "Test Runners": runner_files,
    }

    total_files = 0
    total_size = 0
    missing_files = []

    # Check each category
    for category, files in all_files.items():
        print_colored(f"\n{category}:", YELLOW)
        print("-" * 50)

        for filepath in files:
            exists, size = check_file_exists(filepath)
            total_files += 1

            if exists:
                size_kb = size / 1024
                print_colored(f"  ✓ {filepath:<40} ({size_kb:.1f} KB)", GREEN)
                total_size += size
            else:
                print_colored(f"  ✗ {filepath:<40} (MISSING)", RED)
                missing_files.append(filepath)

    # Summary
    print_colored("\n" + "=" * 70, BLUE)
    print_colored("SUMMARY", BLUE)
    print_colored("=" * 70, BLUE)

    if missing_files:
        print_colored(f"\n❌ Verification Failed!", RED)
        print_colored(f"Missing files: {len(missing_files)}/{total_files}", RED)
        print_colored("\nMissing files:", RED)
        for filepath in missing_files:
            print_colored(f"  - {filepath}", RED)
        return 1
    else:
        print_colored(f"\n✅ All files present!", GREEN)
        print_colored(f"Total files: {total_files}", GREEN)
        print_colored(f"Total size: {total_size / 1024:.1f} KB", GREEN)

    # Count tests
    print_colored("\nCounting tests...", YELLOW)
    try:
        import subprocess
        result = subprocess.run(
            ["pytest", "--collect-only", "-q"],
            capture_output=True,
            text=True,
            timeout=10
        )
        output = result.stdout + result.stderr

        # Extract test count
        for line in output.split('\n'):
            if 'test' in line.lower():
                print(f"  {line}")
    except Exception as e:
        print_colored(f"  Could not count tests: {e}", YELLOW)
        print_colored("  Run 'pytest --collect-only' manually", YELLOW)

    # Test imports
    print_colored("\nVerifying imports...", YELLOW)
    sys.path.insert(0, str(Path.cwd()))

    try:
        import tests.conftest
        print_colored("  ✓ conftest.py imports successfully", GREEN)
    except Exception as e:
        print_colored(f"  ✗ conftest.py import failed: {e}", RED)
        return 1

    try:
        import tests.test_api_endpoints
        print_colored("  ✓ test_api_endpoints.py imports successfully", GREEN)
    except Exception as e:
        print_colored(f"  ✗ test_api_endpoints.py import failed: {e}", RED)

    try:
        import tests.test_llm_service
        print_colored("  ✓ test_llm_service.py imports successfully", GREEN)
    except Exception as e:
        print_colored(f"  ✗ test_llm_service.py import failed: {e}", RED)

    try:
        import tests.test_matching_service
        print_colored("  ✓ test_matching_service.py imports successfully", GREEN)
    except Exception as e:
        print_colored(f"  ✗ test_matching_service.py import failed: {e}", RED)

    try:
        import tests.test_integration
        print_colored("  ✓ test_integration.py imports successfully", GREEN)
    except Exception as e:
        print_colored(f"  ✗ test_integration.py import failed: {e}", RED)

    # Next steps
    print_colored("\n" + "=" * 70, BLUE)
    print_colored("NEXT STEPS", BLUE)
    print_colored("=" * 70, BLUE)
    print("""
1. Install test dependencies:
   pip install -r tests/requirements-test.txt

2. Set environment variables:
   export JWT_SECRET=test_secret_key_for_testing
   export OPENAI_API_KEY=test_openai_key
   export ANTHROPIC_API_KEY=test_anthropic_key
   export PINECONE_API_KEY=test_pinecone_key

3. Run tests:
   pytest tests/ -v

4. Run with coverage:
   pytest tests/ --cov=src --cov-report=html

5. Use test runner scripts:
   ./run_tests.sh --coverage --verbose    # Linux/Mac
   run_tests.bat --coverage --verbose     # Windows

For more information, see tests/README.md
""")

    print_colored("=" * 70, BLUE)
    print_colored("✅ Verification Complete!", GREEN)
    print_colored("=" * 70, BLUE)
    print()

    return 0

if __name__ == "__main__":
    sys.exit(main())
