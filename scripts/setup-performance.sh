#!/bin/bash

# Performance Optimization Setup Script
# Prepares the environment for performance testing

set -e

echo "========================================="
echo "Performance Optimization Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running on Windows (Git Bash)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo -e "${YELLOW}Detected Windows environment${NC}"
    IS_WINDOWS=true
else
    IS_WINDOWS=false
fi

echo -e "${YELLOW}Step 1: Making scripts executable...${NC}"

# Make benchmark scripts executable
if [ "$IS_WINDOWS" = false ]; then
    chmod +x scripts/performance/benchmark.sh
    chmod +x scripts/performance/load-test.sh
    echo -e "${GREEN}✓ Scripts made executable${NC}"
else
    echo -e "${YELLOW}⚠ On Windows, scripts should be run with: bash script.sh${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2: Checking dependencies...${NC}"

# Check for required tools
MISSING_TOOLS=()

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    MISSING_TOOLS+=("nodejs")
fi

# npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓ npm ${NPM_VERSION}${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    MISSING_TOOLS+=("npm")
fi

# Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓ ${DOCKER_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ Docker not found (optional)${NC}"
fi

# psql
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✓ ${PSQL_VERSION}${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL client not found (optional)${NC}"
fi

# Apache Bench
if command -v ab &> /dev/null; then
    echo -e "${GREEN}✓ Apache Bench installed${NC}"
else
    echo -e "${YELLOW}⚠ Apache Bench not found (optional for load testing)${NC}"
    echo "  Install: apt-get install apache2-utils (Linux) or brew install ab (Mac)"
fi

# wrk
if command -v wrk &> /dev/null; then
    echo -e "${GREEN}✓ wrk installed${NC}"
else
    echo -e "${YELLOW}⚠ wrk not found (optional for load testing)${NC}"
    echo "  Install from: https://github.com/wg/wrk"
fi

# Lighthouse
if command -v lighthouse &> /dev/null; then
    echo -e "${GREEN}✓ Lighthouse installed${NC}"
else
    echo -e "${YELLOW}⚠ Lighthouse not found (optional for Web Vitals)${NC}"
    echo "  Install: npm install -g lighthouse"
fi

# Playwright
if [ -d "apps/web/node_modules/@playwright" ]; then
    echo -e "${GREEN}✓ Playwright installed${NC}"
else
    echo -e "${YELLOW}⚠ Playwright not found${NC}"
    echo "  Install: cd apps/web && npm install @playwright/test"
fi

echo ""
echo -e "${YELLOW}Step 3: Creating directories...${NC}"

# Create necessary directories
mkdir -p performance-results
mkdir -p load-test-results
mkdir -p apps/web/performance-results

echo -e "${GREEN}✓ Directories created${NC}"

echo ""
echo -e "${YELLOW}Step 4: Checking configuration files...${NC}"

# Check for key optimization files
FILES=(
    "apps/web/next.config.js"
    "services/shared/database/optimized-database.config.ts"
    "services/shared/interceptors/cache.interceptor.ts"
    "services/shared/middleware/compression.middleware.ts"
    "services/job-service/src/migrations/1733500000000-AddPerformanceIndexes.ts"
    "services/ai-service/src/services/model_cache.py"
    "services/ai-service/src/services/vector_search_optimized.py"
)

ALL_PRESENT=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file not found${NC}"
        ALL_PRESENT=false
    fi
done

echo ""
echo -e "${YELLOW}Step 5: Checking test files...${NC}"

TEST_FILES=(
    "tests/performance/web-vitals.test.ts"
    "tests/performance/api-performance.test.ts"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file not found${NC}"
        ALL_PRESENT=false
    fi
done

echo ""
echo "========================================="
echo "Setup Summary"
echo "========================================="
echo ""

if [ ${#MISSING_TOOLS[@]} -eq 0 ] && [ "$ALL_PRESENT" = true ]; then
    echo -e "${GREEN}✓ All required components are present!${NC}"
    echo ""
    echo "You can now run:"
    echo "  - Performance tests: cd apps/web && npx playwright test tests/performance/"
    echo "  - Benchmarks: ./scripts/performance/benchmark.sh"
    echo "  - Load tests: ./scripts/performance/load-test.sh"
else
    if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
        echo -e "${YELLOW}Missing required tools:${NC}"
        for tool in "${MISSING_TOOLS[@]}"; do
            echo "  - $tool"
        done
        echo ""
    fi

    if [ "$ALL_PRESENT" = false ]; then
        echo -e "${YELLOW}Some optimization files are missing.${NC}"
        echo "Please ensure all performance optimizations are properly installed."
        echo ""
    fi
fi

echo ""
echo -e "${YELLOW}Optional Tools for Advanced Testing:${NC}"
echo "  - Apache Bench (ab): HTTP load testing"
echo "  - wrk: Advanced HTTP benchmarking"
echo "  - Lighthouse: Web performance auditing"
echo "  - Artillery: Load testing with scenarios"
echo "  - pgbench: PostgreSQL benchmarking"
echo ""

echo "========================================="
echo "Quick Start Commands"
echo "========================================="
echo ""
echo "# Run all performance tests"
echo "cd apps/web && npx playwright test tests/performance/"
echo ""
echo "# Run benchmark suite"
if [ "$IS_WINDOWS" = true ]; then
    echo "bash scripts/performance/benchmark.sh"
else
    echo "./scripts/performance/benchmark.sh"
fi
echo ""
echo "# Run load tests"
if [ "$IS_WINDOWS" = true ]; then
    echo "bash scripts/performance/load-test.sh"
else
    echo "./scripts/performance/load-test.sh"
fi
echo ""
echo "# Apply database optimizations"
echo "cd services/job-service && npm run migration:run"
echo ""
echo "# Build optimized Docker images"
echo "docker build -f apps/web/Dockerfile -t jobpilot-web:optimized ."
echo "docker build -f services/ai-service/Dockerfile -t jobpilot-ai:optimized ."
echo ""

echo "For detailed documentation, see:"
echo "  - PERFORMANCE_OPTIMIZATION_GUIDE.md"
echo "  - PERFORMANCE_SUMMARY.md"
echo "  - performance/README.md"
echo ""

echo -e "${GREEN}Setup complete!${NC}"
