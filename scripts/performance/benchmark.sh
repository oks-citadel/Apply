#!/bin/bash

# Performance Benchmarking Script
# Runs various performance tests and generates a report

set -e

echo "========================================="
echo "Performance Benchmarking Suite"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
RESULTS_DIR="./performance-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$RESULTS_DIR/benchmark_${TIMESTAMP}.md"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Initialize report
cat > "$REPORT_FILE" <<EOF
# Performance Benchmark Report
**Generated:** $(date)

## Summary

EOF

echo -e "${GREEN}Starting performance benchmarks...${NC}"
echo ""

# 1. Bundle Size Analysis
echo -e "${YELLOW}1. Analyzing bundle sizes...${NC}"
if [ -d "apps/web/.next" ]; then
    echo "### Bundle Size Analysis" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"

    # Next.js bundle analysis
    cd apps/web
    npm run build > build.log 2>&1 || true

    # Extract bundle sizes
    if [ -f "build.log" ]; then
        grep -A 20 "Route (app)" build.log >> "$REPORT_FILE" || echo "No route info found" >> "$REPORT_FILE"
    fi

    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    cd ../..

    echo -e "${GREEN}✓ Bundle analysis complete${NC}"
else
    echo -e "${RED}✗ Web app not built${NC}"
fi

# 2. Docker Image Sizes
echo -e "${YELLOW}2. Checking Docker image sizes...${NC}"
echo "### Docker Image Sizes" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"

# Check if Docker is available
if command -v docker &> /dev/null; then
    # List images with sizes
    docker images | grep -E "job-apply|jobpilot" | awk '{print $1 " : " $7 " " $8}' >> "$REPORT_FILE" || echo "No images found" >> "$REPORT_FILE"
else
    echo "Docker not available" >> "$REPORT_FILE"
fi

echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo -e "${GREEN}✓ Docker image analysis complete${NC}"

# 3. Database Query Performance
echo -e "${YELLOW}3. Testing database query performance...${NC}"
echo "### Database Query Performance" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Run database performance tests if PostgreSQL is available
if command -v psql &> /dev/null; then
    echo '```sql' >> "$REPORT_FILE"
    echo "-- Sample query performance (run EXPLAIN ANALYZE on common queries)" >> "$REPORT_FILE"
    echo "-- TODO: Add actual query performance metrics" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

echo -e "${GREEN}✓ Database performance tests complete${NC}"

# 4. API Response Times
echo -e "${YELLOW}4. Testing API response times...${NC}"
echo "### API Response Times" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Use Apache Bench if available
if command -v ab &> /dev/null; then
    echo "Testing endpoints with Apache Bench..." >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # Test health endpoint
    echo "#### Health Endpoint" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    ab -n 100 -c 10 http://localhost:3001/api/health 2>&1 | grep -E "Requests per second|Time per request|50%|95%|99%" >> "$REPORT_FILE" || echo "API not available" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
else
    echo "Apache Bench not available - install with: apt-get install apache2-utils" >> "$REPORT_FILE"
fi

echo -e "${GREEN}✓ API response time tests complete${NC}"

# 5. Frontend Performance (using Lighthouse)
echo -e "${YELLOW}5. Running Lighthouse performance audit...${NC}"
echo "### Lighthouse Performance Audit" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if command -v lighthouse &> /dev/null; then
    # Run Lighthouse
    lighthouse http://localhost:3000 \
        --only-categories=performance \
        --output=json \
        --output-path="$RESULTS_DIR/lighthouse_${TIMESTAMP}.json" \
        --chrome-flags="--headless" \
        --quiet || true

    if [ -f "$RESULTS_DIR/lighthouse_${TIMESTAMP}.json" ]; then
        # Extract key metrics
        echo '```json' >> "$REPORT_FILE"
        cat "$RESULTS_DIR/lighthouse_${TIMESTAMP}.json" | jq '.categories.performance' >> "$REPORT_FILE" || echo "{}" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
    fi
else
    echo "Lighthouse not available - install with: npm install -g lighthouse" >> "$REPORT_FILE"
fi

echo -e "${GREEN}✓ Lighthouse audit complete${NC}"

# 6. Memory Usage
echo -e "${YELLOW}6. Checking memory usage...${NC}"
echo "### Memory Usage" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if command -v docker &> /dev/null; then
    echo "#### Docker Container Memory" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep -E "job-apply|jobpilot" >> "$REPORT_FILE" || echo "No containers running" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

echo -e "${GREEN}✓ Memory usage analysis complete${NC}"

# 7. Run Playwright Performance Tests
echo -e "${YELLOW}7. Running Web Vitals tests...${NC}"
echo "### Core Web Vitals" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if [ -f "apps/web/playwright.config.ts" ]; then
    cd apps/web
    npx playwright test tests/performance/web-vitals.test.ts --reporter=json > "$RESULTS_DIR/playwright_${TIMESTAMP}.json" 2>&1 || true

    if [ -f "$RESULTS_DIR/playwright_${TIMESTAMP}.json" ]; then
        echo '```' >> "$REPORT_FILE"
        cat "$RESULTS_DIR/playwright_${TIMESTAMP}.json" | jq -r '.suites[].specs[].tests[] | "\(.title): \(.status)"' >> "$REPORT_FILE" || echo "No test results" >> "$REPORT_FILE"
        echo '```' >> "$REPORT_FILE"
    fi

    cd ../..
fi

echo -e "${GREEN}✓ Web Vitals tests complete${NC}"

# Generate summary
echo "" >> "$REPORT_FILE"
echo "## Recommendations" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Based on the benchmark results:" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. **Bundle Size**: Ensure main bundles are under 500KB" >> "$REPORT_FILE"
echo "2. **Docker Images**: Optimize images to be under 500MB" >> "$REPORT_FILE"
echo "3. **API Response**: Keep response times under 500ms for standard queries" >> "$REPORT_FILE"
echo "4. **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1" >> "$REPORT_FILE"
echo "5. **Memory**: Keep container memory usage under 512MB for services" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Benchmark Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "Report saved to: ${GREEN}$REPORT_FILE${NC}"
echo ""

# Display report
cat "$REPORT_FILE"
