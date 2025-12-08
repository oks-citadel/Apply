#!/bin/bash

# Integration Tests Runner Script
# This script helps manage the integration test environment and execution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_FILE="../../docker-compose.test.yml"
MAX_WAIT_TIME=120
HEALTH_CHECK_INTERVAL=5

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    print_info "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    print_info "All dependencies are installed"
}

start_services() {
    print_info "Starting test services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d

    print_info "Waiting for services to be healthy..."
    wait_for_services
}

wait_for_services() {
    local elapsed=0
    local services=(
        "http://localhost:5433"
        "http://localhost:6380"
        "http://localhost:3001/api/v1/health"
        "http://localhost:8002/api/v1/health"
        "http://localhost:3003/api/v1/health"
        "http://localhost:3004/api/v1/health"
        "http://localhost:8000/health"
        "http://localhost:3006/api/v1/health"
        "http://localhost:3007/api/v1/health"
    )

    while [ $elapsed -lt $MAX_WAIT_TIME ]; do
        all_healthy=true

        for service in "${services[@]}"; do
            if ! curl -sf "$service" > /dev/null 2>&1; then
                all_healthy=false
                break
            fi
        done

        if [ "$all_healthy" = true ]; then
            print_info "All services are healthy!"
            return 0
        fi

        sleep $HEALTH_CHECK_INTERVAL
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        echo -n "."
    done

    echo ""
    print_error "Services did not become healthy within $MAX_WAIT_TIME seconds"
    return 1
}

stop_services() {
    print_info "Stopping test services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down
}

cleanup_services() {
    print_info "Cleaning up test services and volumes..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down -v
}

show_logs() {
    print_info "Showing service logs..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f
}

run_tests() {
    local test_suite=$1

    print_info "Running integration tests..."

    if [ -z "$test_suite" ]; then
        npm test
    else
        npm run "test:$test_suite"
    fi
}

show_status() {
    print_info "Service Status:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
}

show_help() {
    cat << EOF
Integration Tests Runner

Usage: ./run-tests.sh [command] [options]

Commands:
    start           Start test services
    stop            Stop test services
    clean           Stop services and remove volumes
    test [suite]    Run tests (optionally specify suite)
    logs            Show service logs
    status          Show service status
    help            Show this help message

Test Suites:
    auth-user       Auth-User integration tests
    job-ai          Job-AI integration tests
    resume-ai       Resume-AI integration tests
    auto-apply      Auto-Apply-Job integration tests
    notification    Notification integration tests

Examples:
    ./run-tests.sh start                  # Start services
    ./run-tests.sh test                   # Run all tests
    ./run-tests.sh test auth-user         # Run specific suite
    ./run-tests.sh logs                   # View logs
    ./run-tests.sh clean                  # Cleanup everything

EOF
}

# Main script logic
main() {
    local command=${1:-help}

    case $command in
        start)
            check_dependencies
            start_services
            ;;
        stop)
            stop_services
            ;;
        clean)
            cleanup_services
            ;;
        test)
            shift
            run_tests "$1"
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
