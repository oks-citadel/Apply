#!/bin/bash
# ============================================================================
# Setup Script for Secret Management Infrastructure
# ============================================================================
# This script sets up the complete secret management infrastructure for
# the ApplyForUs platform using Azure Key Vault and Kubernetes CSI Driver
#
# Prerequisites:
# - Azure CLI installed and authenticated
# - kubectl configured for AKS cluster
# - Helm 3 installed
# - Terraform installed
#
# Usage:
#   ./scripts/setup-secret-management.sh [environment]
#
# Example:
#   ./scripts/setup-secret-management.sh production
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TERRAFORM_DIR="$PROJECT_ROOT/infrastructure/terraform"
K8S_DIR="$PROJECT_ROOT/infrastructure/kubernetes"
NAMESPACE="applyforus"

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi

    # Check Helm
    if ! command -v helm &> /dev/null; then
        log_error "Helm not found. Please install: https://helm.sh/docs/intro/install/"
        exit 1
    fi

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform not found. Please install: https://www.terraform.io/downloads"
        exit 1
    fi

    # Check Azure login
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Please run: az login"
        exit 1
    fi

    log_success "All prerequisites met"
}

# ============================================================================
# Step 1: Deploy Azure Key Vault via Terraform
# ============================================================================

deploy_keyvault() {
    log_info "Step 1: Deploying Azure Key Vault via Terraform..."

    cd "$TERRAFORM_DIR"

    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init

    # Validate configuration
    log_info "Validating Terraform configuration..."
    terraform validate

    # Plan deployment
    log_info "Planning Terraform deployment..."
    terraform plan -var="environment=$ENVIRONMENT" -out=tfplan

    # Apply deployment
    log_info "Applying Terraform deployment..."
    read -p "Do you want to apply the Terraform plan? (yes/no): " confirm
    if [[ $confirm == "yes" ]]; then
        terraform apply tfplan
        log_success "Key Vault deployed successfully"
    else
        log_warning "Terraform deployment skipped"
        return 1
    fi

    # Get outputs
    log_info "Retrieving Terraform outputs..."
    VAULT_NAME=$(terraform output -raw key_vault_name)
    WORKLOAD_IDENTITY_CLIENT_ID=$(terraform output -raw workload_identity_client_id)
    TENANT_ID=$(terraform output -raw azure_tenant_id)

    log_success "Key Vault Name: $VAULT_NAME"
    log_success "Workload Identity Client ID: $WORKLOAD_IDENTITY_CLIENT_ID"
    log_success "Azure Tenant ID: $TENANT_ID"

    # Save to file for later use
    cat > "$PROJECT_ROOT/.terraform-outputs" <<EOF
VAULT_NAME=$VAULT_NAME
WORKLOAD_IDENTITY_CLIENT_ID=$WORKLOAD_IDENTITY_CLIENT_ID
TENANT_ID=$TENANT_ID
EOF

    cd "$PROJECT_ROOT"
}

# ============================================================================
# Step 2: Install Azure Key Vault CSI Driver
# ============================================================================

install_csi_driver() {
    log_info "Step 2: Installing Azure Key Vault CSI Driver..."

    # Add Helm repository
    log_info "Adding Helm repository..."
    helm repo add csi-secrets-store-provider-azure https://azure.github.io/secrets-store-csi-driver-provider-azure/charts
    helm repo update

    # Check if already installed
    if helm list -n kube-system | grep -q csi-secrets-store; then
        log_warning "CSI Driver already installed, upgrading..."
        helm upgrade csi-secrets-store-provider-azure csi-secrets-store-provider-azure/csi-secrets-store-provider-azure \
            --namespace kube-system \
            --set secrets-store-csi-driver.syncSecret.enabled=true \
            --set secrets-store-csi-driver.enableSecretRotation=true \
            --set secrets-store-csi-driver.rotationPollInterval=2m
    else
        log_info "Installing CSI Driver..."
        helm install csi-secrets-store-provider-azure csi-secrets-store-provider-azure/csi-secrets-store-provider-azure \
            --namespace kube-system \
            --set secrets-store-csi-driver.syncSecret.enabled=true \
            --set secrets-store-csi-driver.enableSecretRotation=true \
            --set secrets-store-csi-driver.rotationPollInterval=2m
    fi

    # Wait for pods to be ready
    log_info "Waiting for CSI Driver pods to be ready..."
    kubectl wait --for=condition=ready pod \
        -l app=secrets-store-csi-driver \
        -n kube-system \
        --timeout=300s

    log_success "CSI Driver installed and ready"
}

# ============================================================================
# Step 3: Update and Deploy SecretProviderClass
# ============================================================================

deploy_secret_provider_class() {
    log_info "Step 3: Deploying SecretProviderClass..."

    # Load Terraform outputs
    if [ -f "$PROJECT_ROOT/.terraform-outputs" ]; then
        source "$PROJECT_ROOT/.terraform-outputs"
    else
        log_error "Terraform outputs not found. Please run deploy_keyvault first."
        exit 1
    fi

    # Create namespace if it doesn't exist
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        log_info "Creating namespace $NAMESPACE..."
        kubectl create namespace $NAMESPACE
    fi

    # Update SecretProviderClass with actual values
    log_info "Updating SecretProviderClass configuration..."
    cat "$K8S_DIR/base/secrets.yaml" | \
        sed "s/\${WORKLOAD_IDENTITY_CLIENT_ID}/$WORKLOAD_IDENTITY_CLIENT_ID/g" | \
        sed "s/\${KEY_VAULT_NAME}/$VAULT_NAME/g" | \
        sed "s/\${AZURE_TENANT_ID}/$TENANT_ID/g" | \
        kubectl apply -f -

    log_success "SecretProviderClass deployed"

    # Verify deployment
    log_info "Verifying SecretProviderClass..."
    if kubectl get secretproviderclass applyforus-azure-keyvault -n $NAMESPACE &> /dev/null; then
        log_success "SecretProviderClass verified"
    else
        log_error "SecretProviderClass verification failed"
        exit 1
    fi
}

# ============================================================================
# Step 4: Deploy ConfigMaps
# ============================================================================

deploy_configmaps() {
    log_info "Step 4: Deploying ConfigMaps for $ENVIRONMENT environment..."

    case $ENVIRONMENT in
        dev|development)
            CONFIG_FILE="$K8S_DIR/base/configmap-dev.yaml"
            ;;
        staging)
            CONFIG_FILE="$K8S_DIR/base/configmap-staging.yaml"
            ;;
        prod|production)
            CONFIG_FILE="$K8S_DIR/base/configmap-production.yaml"
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            log_error "Valid options: dev, staging, production"
            exit 1
            ;;
    esac

    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "ConfigMap file not found: $CONFIG_FILE"
        exit 1
    fi

    log_info "Applying ConfigMap from $CONFIG_FILE..."
    kubectl apply -f "$CONFIG_FILE"

    log_success "ConfigMap deployed for $ENVIRONMENT environment"

    # Verify ConfigMap
    log_info "Verifying ConfigMap..."
    if kubectl get configmap applyforus-config -n $NAMESPACE &> /dev/null; then
        log_success "ConfigMap verified"
    else
        log_error "ConfigMap verification failed"
        exit 1
    fi
}

# ============================================================================
# Step 5: Deploy Service Account with Workload Identity
# ============================================================================

deploy_service_account() {
    log_info "Step 5: Deploying Service Account with Workload Identity..."

    # Load Terraform outputs
    if [ -f "$PROJECT_ROOT/.terraform-outputs" ]; then
        source "$PROJECT_ROOT/.terraform-outputs"
    else
        log_error "Terraform outputs not found."
        exit 1
    fi

    # Create Service Account
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: applyforus-workload-identity
  namespace: $NAMESPACE
  labels:
    app: applyforus-platform
  annotations:
    azure.workload.identity/client-id: "$WORKLOAD_IDENTITY_CLIENT_ID"
    azure.workload.identity/tenant-id: "$TENANT_ID"
EOF

    log_success "Service Account deployed"
}

# ============================================================================
# Step 6: Verify Setup
# ============================================================================

verify_setup() {
    log_info "Step 6: Verifying complete setup..."

    local errors=0

    # Check namespace
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        log_success "Namespace exists: $NAMESPACE"
    else
        log_error "Namespace not found: $NAMESPACE"
        ((errors++))
    fi

    # Check CSI Driver
    if kubectl get pods -n kube-system -l app=secrets-store-csi-driver | grep -q Running; then
        log_success "CSI Driver is running"
    else
        log_error "CSI Driver is not running"
        ((errors++))
    fi

    # Check SecretProviderClass
    if kubectl get secretproviderclass applyforus-azure-keyvault -n $NAMESPACE &> /dev/null; then
        log_success "SecretProviderClass exists"
    else
        log_error "SecretProviderClass not found"
        ((errors++))
    fi

    # Check ConfigMap
    if kubectl get configmap applyforus-config -n $NAMESPACE &> /dev/null; then
        log_success "ConfigMap exists"
    else
        log_error "ConfigMap not found"
        ((errors++))
    fi

    # Check Service Account
    if kubectl get serviceaccount applyforus-workload-identity -n $NAMESPACE &> /dev/null; then
        log_success "Service Account exists"
    else
        log_error "Service Account not found"
        ((errors++))
    fi

    # Check Key Vault
    if [ -f "$PROJECT_ROOT/.terraform-outputs" ]; then
        source "$PROJECT_ROOT/.terraform-outputs"
        if az keyvault show --name "$VAULT_NAME" &> /dev/null; then
            log_success "Key Vault exists: $VAULT_NAME"
        else
            log_error "Key Vault not found: $VAULT_NAME"
            ((errors++))
        fi
    fi

    if [ $errors -eq 0 ]; then
        log_success "All components verified successfully!"
        return 0
    else
        log_error "Verification failed with $errors error(s)"
        return 1
    fi
}

# ============================================================================
# Step 7: Display Next Steps
# ============================================================================

display_next_steps() {
    log_info "Setup complete! Next steps:"
    echo ""
    echo "1. Update your service deployments to use the SecretProviderClass:"
    echo "   See: infrastructure/kubernetes/base/deployment-example.yaml"
    echo ""
    echo "2. Test secret synchronization with a test deployment:"
    echo "   kubectl apply -f infrastructure/kubernetes/base/deployment-example.yaml"
    echo ""
    echo "3. Verify secrets are mounted in pods:"
    echo "   kubectl exec -it <pod-name> -n $NAMESPACE -- ls /mnt/secrets-store"
    echo ""
    echo "4. Read the documentation:"
    echo "   - docs/SECRET_MANAGEMENT.md"
    echo "   - docs/SECRET_ROTATION_GUIDE.md"
    echo "   - SECRET_EXTERNALIZATION_COMPLETE.md"
    echo ""
    echo "5. Set up secret rotation schedule (recommended: every 90 days)"
    echo ""

    if [ -f "$PROJECT_ROOT/.terraform-outputs" ]; then
        source "$PROJECT_ROOT/.terraform-outputs"
        echo "Configuration Values:"
        echo "  Key Vault Name: $VAULT_NAME"
        echo "  Workload Identity Client ID: $WORKLOAD_IDENTITY_CLIENT_ID"
        echo "  Azure Tenant ID: $TENANT_ID"
        echo "  Namespace: $NAMESPACE"
        echo ""
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    log_info "Starting secret management setup for environment: $ENVIRONMENT"
    echo ""

    # Check prerequisites
    check_prerequisites
    echo ""

    # Step 1: Deploy Key Vault
    deploy_keyvault
    echo ""

    # Step 2: Install CSI Driver
    install_csi_driver
    echo ""

    # Step 3: Deploy SecretProviderClass
    deploy_secret_provider_class
    echo ""

    # Step 4: Deploy ConfigMaps
    deploy_configmaps
    echo ""

    # Step 5: Deploy Service Account
    deploy_service_account
    echo ""

    # Step 6: Verify setup
    if verify_setup; then
        echo ""
        display_next_steps
    else
        log_error "Setup verification failed. Please review the errors above."
        exit 1
    fi
}

# Run main function
main
