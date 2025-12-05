@echo off
REM AI Service Test Runner Script for Windows
REM This script provides convenient commands for running tests

setlocal EnableDelayedExpansion

set VERBOSE=
set COVERAGE=
set MARKERS=
set PATTERN=
set TEST_PATH=tests/

:parse_args
if "%~1"=="" goto run_tests
if /I "%~1"=="-h" goto show_help
if /I "%~1"=="--help" goto show_help
if /I "%~1"=="-v" (
    set VERBOSE=-vv
    shift
    goto parse_args
)
if /I "%~1"=="--verbose" (
    set VERBOSE=-vv
    shift
    goto parse_args
)
if /I "%~1"=="-c" (
    set COVERAGE=--cov=src --cov-report=html --cov-report=term-missing
    shift
    goto parse_args
)
if /I "%~1"=="--coverage" (
    set COVERAGE=--cov=src --cov-report=html --cov-report=term-missing
    shift
    goto parse_args
)
if /I "%~1"=="-m" (
    set MARKERS=-m %~2
    shift
    shift
    goto parse_args
)
if /I "%~1"=="--markers" (
    set MARKERS=-m %~2
    shift
    shift
    goto parse_args
)
if /I "%~1"=="-k" (
    set PATTERN=-k %~2
    shift
    shift
    goto parse_args
)
if /I "%~1"=="--keyword" (
    set PATTERN=-k %~2
    shift
    shift
    goto parse_args
)
if /I "%~1"=="-f" (
    set TEST_PATH=%~2
    shift
    shift
    goto parse_args
)
if /I "%~1"=="--file" (
    set TEST_PATH=%~2
    shift
    shift
    goto parse_args
)
if /I "%~1"=="--api" (
    set MARKERS=-m api
    shift
    goto parse_args
)
if /I "%~1"=="--llm" (
    set MARKERS=-m llm
    shift
    goto parse_args
)
if /I "%~1"=="--matching" (
    set MARKERS=-m matching
    shift
    goto parse_args
)
if /I "%~1"=="--unit" (
    set MARKERS=-m unit
    shift
    goto parse_args
)
if /I "%~1"=="--integration" (
    set MARKERS=-m integration
    shift
    goto parse_args
)
if /I "%~1"=="--fast" (
    set MARKERS=-m "not slow"
    shift
    goto parse_args
)

echo Unknown option: %~1
goto show_help

:show_help
echo AI Service Test Runner
echo.
echo Usage: run_tests.bat [OPTIONS]
echo.
echo Options:
echo   -h, --help           Show this help message
echo   -v, --verbose        Run tests with verbose output
echo   -c, --coverage       Run tests with coverage report
echo   -m, --markers MARK   Run tests with specific marker
echo   -k, --keyword EXPR   Run tests matching keyword expression
echo   -f, --file FILE      Run specific test file
echo   --api                Run only API endpoint tests
echo   --llm                Run only LLM service tests
echo   --matching           Run only matching service tests
echo   --unit               Run only unit tests
echo   --integration        Run only integration tests
echo   --fast               Skip slow tests
echo.
echo Examples:
echo   run_tests.bat                          # Run all tests
echo   run_tests.bat -v                       # Run with verbose output
echo   run_tests.bat -c                       # Run with coverage
echo   run_tests.bat --api                    # Run only API tests
echo   run_tests.bat -k test_openai           # Run tests matching 'test_openai'
goto :eof

:run_tests
REM Check if pytest is installed
where pytest >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: pytest is not installed
    echo Install with: pip install -r tests/requirements-test.txt
    exit /b 1
)

echo Running AI Service Tests
echo Test Path: %TEST_PATH%
if defined VERBOSE echo Verbose: Yes
if defined COVERAGE echo Coverage: Yes
if defined MARKERS echo Markers: %MARKERS%
if defined PATTERN echo Pattern: %PATTERN%
echo.

REM Run tests
pytest %TEST_PATH% %VERBOSE% %COVERAGE% %MARKERS% %PATTERN%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo All tests passed!
    if defined COVERAGE (
        echo Coverage report generated at: htmlcov\index.html
    )
) else (
    echo.
    echo Some tests failed!
)

exit /b %ERRORLEVEL%
