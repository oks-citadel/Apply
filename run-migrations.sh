#!/bin/bash

# Database configuration
export DB_HOST=localhost
export DB_PORT=5434
export DB_USERNAME=postgres
export DB_PASSWORD=postgres
export DB_DATABASE=jobpilot
export NODE_ENV=development

echo "========================================"
echo "Running TypeORM Migrations"
echo "========================================"
echo "Database: $DB_DATABASE"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Function to run migrations for a service
run_migrations() {
  local service_name=$1
  local service_path=$2
  local data_source=$3

  echo ""
  echo "========================================"
  echo "Service: $service_name"
  echo "========================================"

  cd "$service_path" || {
    echo "❌ Failed to navigate to $service_path"
    return 1
  }

  # Check if data source exists
  if [ ! -f "$data_source" ]; then
    echo "❌ Data source not found: $data_source"
    return 1
  fi

  # Run migrations
  echo "Running migrations..."
  npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d "$data_source"

  if [ $? -eq 0 ]; then
    echo "✅ Migrations completed for $service_name"
  else
    echo "❌ Migrations failed for $service_name"
    return 1
  fi

  cd - > /dev/null
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Run migrations for each service
run_migrations "auth-service" "$PROJECT_ROOT/services/auth-service" "src/config/data-source.ts"
run_migrations "job-service" "$PROJECT_ROOT/services/job-service" "src/config/data-source.ts"
run_migrations "resume-service" "$PROJECT_ROOT/services/resume-service" "src/config/database.config.ts"
run_migrations "user-service" "$PROJECT_ROOT/services/user-service" "src/config/data-source.ts"
run_migrations "notification-service" "$PROJECT_ROOT/services/notification-service" "src/config/data-source.ts"
run_migrations "auto-apply-service" "$PROJECT_ROOT/services/auto-apply-service" "src/config/data-source.ts"
run_migrations "analytics-service" "$PROJECT_ROOT/services/analytics-service" "src/config/data-source.ts"

echo ""
echo "========================================"
echo "Migration process completed"
echo "========================================"
