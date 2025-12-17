#!/bin/bash
set -euo pipefail

# Verify Gatekeeper Policies
# This script tests the deployed policies and generates a report

NAMESPACE="${NAMESPACE:-applyforus}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "Verifying Gatekeeper Policies"
echo "========================================="
echo "Testing namespace: $NAMESPACE"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl is not installed"
    exit 1
fi

# Check cluster connectivity
echo "Checking cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    echo "ERROR: Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "✅ Connected to cluster"
echo ""

# Check Gatekeeper health
echo "Checking Gatekeeper health..."
if ! kubectl get deployment -n gatekeeper-system gatekeeper-controller-manager &> /dev/null; then
    echo "ERROR: Gatekeeper is not installed"
    echo "Please run ./install-gatekeeper.sh first"
    exit 1
fi

READY=$(kubectl get deployment -n gatekeeper-system gatekeeper-controller-manager -o jsonpath='{.status.readyReplicas}')
if [ "$READY" -eq 0 ]; then
    echo "ERROR: Gatekeeper controller is not ready"
    exit 1
fi

echo "✅ Gatekeeper is healthy"
echo ""

# List all installed policies
echo "========================================="
echo "Installed Constraint Templates"
echo "========================================="
kubectl get constrainttemplates
echo ""

echo "========================================="
echo "Installed Constraints"
echo "========================================="
kubectl get constraints --all-namespaces
echo ""

# Test each policy
echo "========================================="
echo "Policy Enforcement Tests"
echo "========================================="
echo ""

TEST_RESULTS=()

# Test 1: ACR Allowlist
echo "Test 1: ACR Allowlist Policy"
echo "----------------------------"
cat > /tmp/test-invalid-registry.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-invalid-registry
  namespace: $NAMESPACE
spec:
  containers:
  - name: nginx
    image: docker.io/nginx:latest
EOF

echo "Testing: Pod with invalid registry (docker.io)..."
if kubectl apply -f /tmp/test-invalid-registry.yaml --dry-run=server 2>&1 | grep -q "denied\|violation"; then
    echo "✅ PASS: Invalid registry blocked"
    TEST_RESULTS+=("PASS: ACR Allowlist")
else
    echo "❌ FAIL: Invalid registry was allowed"
    TEST_RESULTS+=("FAIL: ACR Allowlist")
fi
echo ""

# Test 2: Latest Tag
echo "Test 2: Block Latest Tag Policy"
echo "--------------------------------"
cat > /tmp/test-latest-tag.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-latest-tag
  namespace: $NAMESPACE
spec:
  containers:
  - name: app
    image: applyforusacr.azurecr.io/myapp:latest
EOF

echo "Testing: Pod with 'latest' tag..."
if kubectl apply -f /tmp/test-latest-tag.yaml --dry-run=server 2>&1 | grep -q "denied\|violation"; then
    echo "✅ PASS: Latest tag blocked"
    TEST_RESULTS+=("PASS: Block Latest Tag")
else
    echo "❌ FAIL: Latest tag was allowed"
    TEST_RESULTS+=("FAIL: Block Latest Tag")
fi
echo ""

# Test 3: Privileged Container
echo "Test 3: No Privileged Containers Policy"
echo "---------------------------------------"
cat > /tmp/test-privileged.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-privileged
  namespace: $NAMESPACE
spec:
  containers:
  - name: app
    image: applyforusacr.azurecr.io/myapp:1.0.0
    securityContext:
      privileged: true
EOF

echo "Testing: Privileged container..."
if kubectl apply -f /tmp/test-privileged.yaml --dry-run=server 2>&1 | grep -q "denied\|violation"; then
    echo "✅ PASS: Privileged container blocked"
    TEST_RESULTS+=("PASS: No Privileged")
else
    echo "❌ FAIL: Privileged container was allowed"
    TEST_RESULTS+=("FAIL: No Privileged")
fi
echo ""

# Test 4: Run as Root
echo "Test 4: Require Non-Root Policy"
echo "--------------------------------"
cat > /tmp/test-run-as-root.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-run-as-root
  namespace: $NAMESPACE
spec:
  containers:
  - name: app
    image: applyforusacr.azurecr.io/myapp:1.0.0
    securityContext:
      runAsUser: 0
EOF

echo "Testing: Container running as root..."
if kubectl apply -f /tmp/test-run-as-root.yaml --dry-run=server 2>&1 | grep -q "denied\|violation"; then
    echo "✅ PASS: Root user blocked"
    TEST_RESULTS+=("PASS: Non-Root Required")
else
    echo "❌ FAIL: Root user was allowed"
    TEST_RESULTS+=("FAIL: Non-Root Required")
fi
echo ""

# Test 5: Missing Resources
echo "Test 5: Require Resource Limits Policy"
echo "--------------------------------------"
cat > /tmp/test-no-resources.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-no-resources
  namespace: $NAMESPACE
spec:
  containers:
  - name: app
    image: applyforusacr.azurecr.io/myapp:1.0.0
EOF

echo "Testing: Container without resource requests/limits..."
if kubectl apply -f /tmp/test-no-resources.yaml --dry-run=server 2>&1 | grep -q "denied\|violation"; then
    echo "✅ PASS: Missing resources blocked"
    TEST_RESULTS+=("PASS: Resources Required")
else
    echo "❌ FAIL: Missing resources were allowed"
    TEST_RESULTS+=("FAIL: Resources Required")
fi
echo ""

# Test 6: Valid Pod (should pass)
echo "Test 6: Valid Pod (should be allowed)"
echo "-------------------------------------"
cat > /tmp/test-valid-pod.yaml <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-valid-pod
  namespace: $NAMESPACE
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
  containers:
  - name: app
    image: applyforusacr.azurecr.io/myapp:1.0.0-abc123
    securityContext:
      allowPrivilegeEscalation: false
      runAsNonRoot: true
      runAsUser: 1000
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi
EOF

echo "Testing: Valid compliant pod..."
if kubectl apply -f /tmp/test-valid-pod.yaml --dry-run=server 2>&1 | grep -q "denied\|violation"; then
    echo "❌ FAIL: Valid pod was blocked (false positive)"
    TEST_RESULTS+=("FAIL: Valid Pod Allowed")
else
    echo "✅ PASS: Valid pod was allowed"
    TEST_RESULTS+=("PASS: Valid Pod Allowed")
fi
echo ""

# Cleanup test files
rm -f /tmp/test-*.yaml

# Generate summary
echo "========================================="
echo "Test Summary"
echo "========================================="
PASS_COUNT=0
FAIL_COUNT=0

for result in "${TEST_RESULTS[@]}"; do
    echo "$result"
    if [[ $result == PASS:* ]]; then
        ((PASS_COUNT++))
    else
        ((FAIL_COUNT++))
    fi
done

echo ""
echo "Total Tests: ${#TEST_RESULTS[@]}"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"
echo ""

# Check for constraint violations
echo "========================================="
echo "Recent Constraint Violations"
echo "========================================="
kubectl get constraints --all-namespaces -o json | \
    jq -r '.items[] | select(.status.totalViolations > 0) | "\(.kind)/\(.metadata.name): \(.status.totalViolations) violations"'
echo ""

# Exit with error if any tests failed
if [ $FAIL_COUNT -gt 0 ]; then
    echo "❌ Some policy tests failed"
    exit 1
else
    echo "✅ All policy tests passed"
fi

echo ""
echo "========================================="
echo "Policy Verification Complete"
echo "========================================="
