#!/bin/bash
# Validation Script for Monitoring and Dashboards Modules
# JobPilot AI Platform

set -e

echo "=========================================="
echo "Terraform Modules Validation Script"
echo "JobPilot AI Platform - Monitoring & Dashboards"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to print error message
print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "Step 1: Checking prerequisites..."
echo ""

if command_exists terraform; then
    TERRAFORM_VERSION=$(terraform version | head -n1)
    print_success "Terraform is installed: $TERRAFORM_VERSION"
else
    print_error "Terraform is not installed"
    exit 1
fi

echo ""

# Validate monitoring module
echo "Step 2: Validating Monitoring Module..."
echo ""

cd "$(dirname "$0")/monitoring"

# Format check
echo "  - Checking Terraform formatting..."
if terraform fmt -check -recursive > /dev/null 2>&1; then
    print_success "All files are properly formatted"
else
    print_warning "Some files need formatting (running terraform fmt...)"
    terraform fmt -recursive
    print_success "Files have been formatted"
fi

# Initialize
echo "  - Initializing Terraform..."
if terraform init -backend=false > /dev/null 2>&1; then
    print_success "Terraform initialized successfully"
else
    print_error "Terraform initialization failed"
    exit 1
fi

# Validate
echo "  - Validating configuration..."
if terraform validate > /dev/null 2>&1; then
    print_success "Monitoring module validation passed"
else
    print_error "Monitoring module validation failed"
    terraform validate
    exit 1
fi

echo ""

# Validate dashboards module
echo "Step 3: Validating Dashboards Module..."
echo ""

cd "../dashboards"

# Format check
echo "  - Checking Terraform formatting..."
if terraform fmt -check -recursive > /dev/null 2>&1; then
    print_success "All files are properly formatted"
else
    print_warning "Some files need formatting (running terraform fmt...)"
    terraform fmt -recursive
    print_success "Files have been formatted"
fi

# Initialize
echo "  - Initializing Terraform..."
if terraform init -backend=false > /dev/null 2>&1; then
    print_success "Terraform initialized successfully"
else
    print_error "Terraform initialization failed"
    exit 1
fi

# Validate
echo "  - Validating configuration..."
if terraform validate > /dev/null 2>&1; then
    print_success "Dashboards module validation passed"
else
    print_error "Dashboards module validation failed"
    terraform validate
    exit 1
fi

echo ""

# File structure check
echo "Step 4: Verifying file structure..."
echo ""

cd "$(dirname "$0")"

# Check monitoring module files
MONITORING_FILES=("monitoring/main.tf" "monitoring/variables.tf" "monitoring/outputs.tf" "monitoring/README.md" "monitoring/examples/main.tf")
for file in "${MONITORING_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found: $file"
    else
        print_error "Missing: $file"
        exit 1
    fi
done

echo ""

# Check dashboards module files
DASHBOARD_FILES=("dashboards/main.tf" "dashboards/variables.tf" "dashboards/outputs.tf" "dashboards/README.md" "dashboards/examples/main.tf")
for file in "${DASHBOARD_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found: $file"
    else
        print_error "Missing: $file"
        exit 1
    fi
done

echo ""

# Summary statistics
echo "Step 5: Module Statistics..."
echo ""

# Count lines of code
MONITORING_LINES=$(find monitoring -name "*.tf" -exec wc -l {} + | tail -1 | awk '{print $1}')
DASHBOARD_LINES=$(find dashboards -name "*.tf" -exec wc -l {} + | tail -1 | awk '{print $1}')
TOTAL_LINES=$((MONITORING_LINES + DASHBOARD_LINES))

echo "  Monitoring Module:"
echo "    - Terraform files: $(find monitoring -name "*.tf" | wc -l)"
echo "    - Total lines: $MONITORING_LINES"
echo "    - Size: $(du -sh monitoring | cut -f1)"
echo ""

echo "  Dashboards Module:"
echo "    - Terraform files: $(find dashboards -name "*.tf" | wc -l)"
echo "    - Total lines: $DASHBOARD_LINES"
echo "    - Size: $(du -sh dashboards | cut -f1)"
echo ""

echo "  Combined Statistics:"
echo "    - Total Terraform files: $(find monitoring dashboards -name "*.tf" | wc -l)"
echo "    - Total lines of code: $TOTAL_LINES"
echo "    - Total size: $(($(du -sk monitoring | cut -f1) + $(du -sk dashboards | cut -f1)))K"
echo ""

# Final success message
echo "=========================================="
print_success "All validations passed successfully!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "  1. Review module documentation (README.md files)"
echo "  2. Check example configurations (examples/main.tf)"
echo "  3. Customize variables for your environment"
echo "  4. Deploy to development environment first"
echo "  5. Test alerts and dashboard functionality"
echo ""
echo "Deployment command:"
echo "  terraform init"
echo "  terraform plan -var-file=dev.tfvars"
echo "  terraform apply -var-file=dev.tfvars"
echo ""

exit 0
