#!/bin/bash

# Load Testing Script
# Tests application under various load conditions

set -e

echo "========================================="
echo "Load Testing Suite"
echo "========================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3001/api}"
WEB_URL="${WEB_URL:-http://localhost:3000}"
CONCURRENT_USERS="${CONCURRENT_USERS:-50}"
DURATION="${DURATION:-60}"
RESULTS_DIR="./load-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "Configuration:"
echo "  API URL: $API_URL"
echo "  Web URL: $WEB_URL"
echo "  Concurrent Users: $CONCURRENT_USERS"
echo "  Duration: ${DURATION}s"
echo ""

# 1. HTTP Load Test using Apache Bench
echo "1. Running HTTP load test..."
if command -v ab &> /dev/null; then
    echo "  Testing health endpoint..."
    ab -n 1000 -c 50 "$API_URL/health" > "$RESULTS_DIR/ab_health_${TIMESTAMP}.txt" 2>&1

    echo "  Testing jobs endpoint..."
    ab -n 500 -c 25 "$API_URL/jobs?page=1&limit=20" > "$RESULTS_DIR/ab_jobs_${TIMESTAMP}.txt" 2>&1

    echo "  ✓ Apache Bench tests complete"
else
    echo "  ✗ Apache Bench not available"
fi

# 2. Load Test using wrk (if available)
echo ""
echo "2. Running wrk load test..."
if command -v wrk &> /dev/null; then
    echo "  Testing with $CONCURRENT_USERS connections for ${DURATION}s..."
    wrk -t 4 -c $CONCURRENT_USERS -d ${DURATION}s "$API_URL/jobs?page=1&limit=20" > "$RESULTS_DIR/wrk_${TIMESTAMP}.txt" 2>&1

    echo "  ✓ wrk tests complete"
else
    echo "  ✗ wrk not available (install from: https://github.com/wg/wrk)"
fi

# 3. Load Test using Artillery (if available)
echo ""
echo "3. Running Artillery load test..."
if command -v artillery &> /dev/null; then
    # Create Artillery config
    cat > "$RESULTS_DIR/artillery_config_${TIMESTAMP}.yml" <<EOF
config:
  target: "$API_URL"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  plugins:
    expect: {}
scenarios:
  - name: "Job Search Flow"
    flow:
      - get:
          url: "/jobs"
          qs:
            page: 1
            limit: 20
      - get:
          url: "/jobs/{{ \$randomString() }}"
      - post:
          url: "/jobs/search"
          json:
            q: "software engineer"
            location: "Remote"
EOF

    artillery run "$RESULTS_DIR/artillery_config_${TIMESTAMP}.yml" \
        --output "$RESULTS_DIR/artillery_${TIMESTAMP}.json" \
        > "$RESULTS_DIR/artillery_${TIMESTAMP}.txt" 2>&1

    # Generate HTML report
    artillery report "$RESULTS_DIR/artillery_${TIMESTAMP}.json" \
        --output "$RESULTS_DIR/artillery_report_${TIMESTAMP}.html" 2>&1

    echo "  ✓ Artillery tests complete"
else
    echo "  ✗ Artillery not available (install with: npm install -g artillery)"
fi

# 4. Database Load Test
echo ""
echo "4. Running database load test..."
if command -v pgbench &> /dev/null; then
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-jobpilot}"
    DB_USER="${DB_USER:-postgres}"

    echo "  Testing database performance..."
    pgbench -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -c 10 -j 2 -t 1000 \
        > "$RESULTS_DIR/pgbench_${TIMESTAMP}.txt" 2>&1 || echo "  ✗ Database test failed"

    echo "  ✓ Database load test complete"
else
    echo "  ✗ pgbench not available"
fi

# 5. Stress Test - Gradually increase load
echo ""
echo "5. Running stress test..."
if command -v ab &> /dev/null; then
    STRESS_LEVELS=(10 25 50 100 200)

    for level in "${STRESS_LEVELS[@]}"; do
        echo "  Testing with $level concurrent users..."
        ab -n $((level * 20)) -c $level "$API_URL/jobs?page=1&limit=20" \
            > "$RESULTS_DIR/stress_${level}_${TIMESTAMP}.txt" 2>&1

        # Check error rate
        error_rate=$(grep "Failed requests:" "$RESULTS_DIR/stress_${level}_${TIMESTAMP}.txt" | awk '{print $3}')
        echo "    Error rate: $error_rate"

        sleep 2
    done

    echo "  ✓ Stress test complete"
fi

# Generate Summary Report
echo ""
echo "Generating summary report..."

REPORT_FILE="$RESULTS_DIR/load_test_report_${TIMESTAMP}.md"

cat > "$REPORT_FILE" <<EOF
# Load Test Report
**Generated:** $(date)

## Configuration
- API URL: $API_URL
- Web URL: $WEB_URL
- Concurrent Users: $CONCURRENT_USERS
- Duration: ${DURATION}s

## Results Summary

EOF

# Apache Bench Results
if [ -f "$RESULTS_DIR/ab_jobs_${TIMESTAMP}.txt" ]; then
    echo "### Apache Bench - Jobs Endpoint" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    grep -A 10 "Requests per second" "$RESULTS_DIR/ab_jobs_${TIMESTAMP}.txt" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# wrk Results
if [ -f "$RESULTS_DIR/wrk_${TIMESTAMP}.txt" ]; then
    echo "### wrk Load Test" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    cat "$RESULTS_DIR/wrk_${TIMESTAMP}.txt" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Stress Test Results
echo "### Stress Test Results" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Concurrent Users | Failed Requests | Avg Response Time |" >> "$REPORT_FILE"
echo "|-----------------|----------------|-------------------|" >> "$REPORT_FILE"

for level in "${STRESS_LEVELS[@]}"; do
    if [ -f "$RESULTS_DIR/stress_${level}_${TIMESTAMP}.txt" ]; then
        failed=$(grep "Failed requests:" "$RESULTS_DIR/stress_${level}_${TIMESTAMP}.txt" | awk '{print $3}')
        avg_time=$(grep "Time per request:" "$RESULTS_DIR/stress_${level}_${TIMESTAMP}.txt" | head -1 | awk '{print $4}')
        echo "| $level | $failed | ${avg_time}ms |" >> "$REPORT_FILE"
    fi
done

echo "" >> "$REPORT_FILE"

# Recommendations
cat >> "$REPORT_FILE" <<EOF

## Recommendations

1. **Target RPS**: Aim for > 1000 requests/second
2. **Error Rate**: Should be < 1% under normal load
3. **Response Time**: 95th percentile should be < 500ms
4. **Concurrent Users**: Should handle > 100 concurrent users
5. **Database**: Query time should be < 50ms for indexed queries

## Next Steps

- Review failed requests and optimize slow endpoints
- Consider implementing rate limiting if error rate is high
- Add caching for frequently accessed resources
- Scale horizontally if response times degrade under load

EOF

echo ""
echo "========================================="
echo "Load Testing Complete!"
echo "========================================="
echo ""
echo "Results saved to: $RESULTS_DIR/"
echo "Summary report: $REPORT_FILE"
echo ""

# Display summary
cat "$REPORT_FILE"
