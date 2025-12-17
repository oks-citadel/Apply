#!/usr/bin/env python3
"""
Fix Docker build issues across all services by:
1. Creating telemetry stubs
2. Fixing parseInt TypeScript issues
3. Commenting out dotenv imports
"""

import os
import re

def fix_analytics_service():
    base_path = "services/analytics-service/src"

    # Create stub telemetry file
    stub_content = """// Temporary stub for @jobpilot/telemetry until monorepo linking is configured
export async function initTelemetry(config: any): Promise<void> {
  console.log('Telemetry disabled in Docker build');
  return Promise.resolve();
}
"""
    with open(f"{base_path}/stub-telemetry.ts", "w") as f:
        f.write(stub_content)

    # Fix main.ts telemetry import
    with open(f"{base_path}/main.ts", "r") as f:
        content = f.read()
    content = content.replace(
        "import { initTelemetry } from '@jobpilot/telemetry';",
        "import { initTelemetry } from './stub-telemetry';"
    )
    with open(f"{base_path}/main.ts", "w") as f:
        f.write(content)

    # Fix configuration.ts parseInt issues
    with open(f"{base_path}/config/configuration.ts", "r") as f:
        content = f.read()

    # Replace all parseInt(process.env.X, 10) with parseInt(process.env.X || 'default', 10)
    replacements = [
        (r"parseInt\(process\.env\.PORT, 10\)", "parseInt(process.env.PORT || '8006', 10)"),
        (r"parseInt\(process\.env\.DB_PORT, 10\)", "parseInt(process.env.DB_PORT || '5432', 10)"),
        (r"parseInt\(process\.env\.ANALYTICS_RETENTION_DAYS, 10\)", "parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90', 10)"),
        (r"parseInt\(process\.env\.ANALYTICS_AGGREGATION_INTERVAL, 10\)", "parseInt(process.env.ANALYTICS_AGGREGATION_INTERVAL || '3600000', 10)"),
        (r"parseInt\(process\.env\.ANALYTICS_MAX_EVENTS_BATCH, 10\)", "parseInt(process.env.ANALYTICS_MAX_EVENTS_BATCH || '1000', 10)"),
        (r"parseInt\(process\.env\.EXPORT_MAX_RECORDS, 10\)", "parseInt(process.env.EXPORT_MAX_RECORDS || '50000', 10)"),
        (r"parseInt\(process\.env\.EXPORT_CHUNK_SIZE, 10\)", "parseInt(process.env.EXPORT_CHUNK_SIZE || '5000', 10)"),
        (r"parseInt\(process\.env\.THROTTLE_TTL, 10\)", "parseInt(process.env.THROTTLE_TTL || '60000', 10)"),
        (r"parseInt\(process\.env\.THROTTLE_LIMIT, 10\)", "parseInt(process.env.THROTTLE_LIMIT || '100', 10)"),
        (r"parseInt\(process\.env\.CACHE_TTL, 10\)", "parseInt(process.env.CACHE_TTL || '300', 10)"),
        (r"parseInt\(process\.env\.CACHE_MAX, 10\)", "parseInt(process.env.CACHE_MAX || '1000', 10)"),
    ]

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    with open(f"{base_path}/config/configuration.ts", "w") as f:
        f.write(content)

    # Fix data-source.ts dotenv import
    data_source_path = f"{base_path}/config/data-source.ts"
    if os.path.exists(data_source_path):
        with open(data_source_path, "r") as f:
            content = f.read()
        content = content.replace(
            "import { config } from 'dotenv';",
            "// import { config } from 'dotenv';"
        )
        content = re.sub(r"^config\(\);$", "// config();", content, flags=re.MULTILINE)
        with open(data_source_path, "w") as f:
            f.write(content)

    print("✓ Fixed analytics-service")

def fix_service(service_name, port='3000'):
    """Fix a generic service"""
    base_path = f"services/{service_name}/src"

    if not os.path.exists(base_path):
        print(f"⚠ Skipping {service_name} - path not found")
        return

    # Create stub telemetry file
    stub_content = """// Temporary stub for @jobpilot/telemetry until monorepo linking is configured
export async function initTelemetry(config: any): Promise<void> {
  console.log('Telemetry disabled in Docker build');
  return Promise.resolve();
}
"""
    with open(f"{base_path}/stub-telemetry.ts", "w") as f:
        f.write(stub_content)

    # Fix main.ts telemetry import if it exists
    main_ts_path = f"{base_path}/main.ts"
    if os.path.exists(main_ts_path):
        with open(main_ts_path, "r") as f:
            content = f.read()
        if "@jobpilot/telemetry" in content:
            content = content.replace(
                "import { initTelemetry } from '@jobpilot/telemetry';",
                "import { initTelemetry } from './stub-telemetry';"
            )
            with open(main_ts_path, "w") as f:
                f.write(content)

    print(f"✓ Fixed {service_name}")

if __name__ == "__main__":
    os.chdir("/c/Users/kogun/OneDrive/Documents/Job-Apply-Platform")

    print("Fixing services for Docker builds...")

    fix_analytics_service()
    fix_service("auth-service", "3001")
    fix_service("job-service", "3002")
    fix_service("resume-service", "3003")
    fix_service("user-service", "3004")
    fix_service("notification-service", "3005")
    fix_service("auto-apply-service", "3008")

    print("\nAll services fixed! Ready to build.")
