#!/bin/bash

# AI Service Test Runner Script
# This script provides convenient commands for running tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
VERBOSE=""
COVERAGE=""
MARKERS=""
PATTERN=""

# Help message
show_help() {
    echo "AI Service Test Runner"
    echo ""
    echo "Usage: ./run_tests.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help           Show this help message"
    echo "  -v, --verbose        Run tests with verbose output"
    echo "  -c, --coverage       Run tests with coverage report"
    echo "  -m, --markers MARK   Run tests with specific marker (e.g., 'asyncio', 'integration')"
    echo "  -k, --keyword EXPR   Run tests matching keyword expression"
    echo "  -f, --file FILE      Run specific test file"
    echo "  --api                Run only API endpoint tests"
    echo "  --llm                Run only LLM service tests"
    echo "  --matching           Run only matching service tests"
    echo "  --unit               Run only unit tests"
    echo "  --integration        Run only integration tests"
    echo "  --fast               Skip slow tests"
    echo ""
    echo "Examples:"
    echo "  ./run_tests.sh                          # Run all tests"
    echo "  ./run_tests.sh -v                       # Run with verbose output"
    echo "  ./run_tests.sh -c                       # Run with coverage"
    echo "  ./run_tests.sh --api                    # Run only API tests"
    echo "  ./run_tests.sh -k test_openai           # Run tests matching 'test_openai'"
    echo "  ./run_tests.sh -f tests/test_api_endpoints.py  # Run specific file"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--verbose)
            VERBOSE="-vv"
            shift
            ;;
        -c|--coverage)
            COVERAGE="--cov=src --cov-report=html --cov-report=term-missing"
            shift
            ;;
        -m|--markers)
            MARKERS="-m $2"
            shift 2
            ;;
        -k|--keyword)
            PATTERN="-k $2"
            shift 2
            ;;
        -f|--file)
            TEST_FILE="$2"
            shift 2
            ;;
        --api)
            MARKERS="-m api"
            shift
            ;;
        --llm)
            MARKERS="-m llm"
            shift
            ;;
        --matching)
            MARKERS="-m matching"
            shift
            ;;
        --unit)
            MARKERS="-m unit"
            shift
            ;;
        --integration)
            MARKERS="-m integration"
            shift
            ;;
        --fast)
            MARKERS="-m 'not slow'"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}Error: pytest is not installed${NC}"
    echo "Install with: pip install -r tests/requirements-test.txt"
    exit 1
fi

# Set test path
TEST_PATH="${TEST_FILE:-tests/}"

# Print configuration
echo -e "${GREEN}Running AI Service Tests${NC}"
echo "Test Path: $TEST_PATH"
[ -n "$VERBOSE" ] && echo "Verbose: Yes"
[ -n "$COVERAGE" ] && echo "Coverage: Yes"
[ -n "$MARKERS" ] && echo "Markers: $MARKERS"
[ -n "$PATTERN" ] && echo "Pattern: $PATTERN"
echo ""

# Run tests
pytest $TEST_PATH $VERBOSE $COVERAGE $MARKERS $PATTERN

# Check exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"

    # If coverage was run, show where report is
    if [ -n "$COVERAGE" ]; then
        echo -e "${YELLOW}Coverage report generated at: htmlcov/index.html${NC}"
    fi
else
    echo -e "\n${RED}Some tests failed!${NC}"
fi

exit $EXIT_CODE
