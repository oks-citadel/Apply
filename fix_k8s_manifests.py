#!/usr/bin/env python3
"""
Script to fix Kubernetes manifests:
1. Replace ':latest' image tags with versioned tags
2. Change imagePullPolicy from 'Always' to 'IfNotPresent'
3. Add Pod Security Standards annotations
"""

import re
import os
from pathlib import Path

# Directory containing service manifests
SERVICES_DIR = Path("/c/Users/kogun/OneDrive/Documents/Job-Apply-Platform/infrastructure/kubernetes/services")

def fix_manifest(file_path):
    """Fix a single manifest file"""
    print(f"Processing {file_path.name}...")

    with open(file_path, 'r') as f:
        content = f.read()

    original_content = content

    # Fix 1: Add Pod Security Standards labels to Deployment metadata
    # Find the Deployment metadata section and add labels
    deployment_pattern = r'(kind: Deployment\nmetadata:\n  name: [\w-]+\n  namespace: jobpilot\n  labels:\n    app: [\w-]+\n    tier: \w+\n    component: \w+)'

    def add_pod_security_labels(match):
        existing = match.group(1)
        if 'pod-security.kubernetes.io/enforce' not in existing:
            return existing + '\n    pod-security.kubernetes.io/enforce: restricted\n    pod-security.kubernetes.io/audit: restricted\n    pod-security.kubernetes.io/warn: restricted'
        return existing

    content = re.sub(deployment_pattern, add_pod_security_labels, content)

    # Fix 2: Add Pod Security Standards annotation to pod template
    # Find annotations section in pod template and add security annotation
    annotations_pattern = r'(      annotations:\n        prometheus\.io/scrape: "true"\n        prometheus\.io/port: "\d+"\n        prometheus\.io/path: "/metrics")'

    def add_pod_security_annotation(match):
        existing = match.group(1)
        if 'seccomp.security.alpha.kubernetes.io/pod' not in existing:
            return existing + '\n        # Pod Security Standards - Restricted profile\n        seccomp.security.alpha.kubernetes.io/pod: runtime/default'
        return existing

    content = re.sub(annotations_pattern, add_pod_security_annotation, content)

    # Fix 3: Move azure.workload.identity/use from spec.labels to metadata.labels
    # First, check if it exists in the wrong place
    if '      labels:\n        azure.workload.identity/use: "true"' in content:
        # Remove from spec.labels
        content = re.sub(
            r'      labels:\n        azure\.workload\.identity/use: "true"  # Enable Azure Workload Identity for this pod\n',
            '',
            content
        )
        # Add to template metadata labels
        content = re.sub(
            r'(    metadata:\n      labels:\n        app: auth-service\n        tier: backend\n        component: authentication)',
            r'\1\n        azure.workload.identity/use: "true"  # Enable Azure Workload Identity for this pod',
            content
        )

    # Fix 4: Replace :latest with versioned tags and fix imagePullPolicy
    # Pattern for ACR images
    acr_pattern = r'image: (\$\{ACR_LOGIN_SERVER\}|jobpilotacr\.azurecr\.io)/([\w-]+):latest\n        imagePullPolicy: Always'
    acr_replacement = r'# Use semantic versioning: \1/\2:v1.0.0\n        # Set VERSION environment variable in CI/CD pipeline\n        image: \1/\2:${VERSION:-v1.0.0}\n        imagePullPolicy: IfNotPresent'

    content = re.sub(acr_pattern, acr_replacement, content)

    # Fix 5: Update comments for ACR images
    content = re.sub(
        r'        # ACR image - authentication via managed identity \(no imagePullSecrets needed\)\n        image:',
        r'# ACR image - authentication via managed identity (no imagePullSecrets needed)\n        ',
        content
    )

    # Only write if changes were made
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"  ✓ Fixed {file_path.name}")
        return True
    else:
        print(f"  - No changes needed for {file_path.name}")
        return False

def main():
    """Process all service manifest files"""
    print("Fixing Kubernetes manifests...\n")

    files_fixed = 0
    service_files = list(SERVICES_DIR.glob("*.yaml"))

    for file_path in sorted(service_files):
        if fix_manifest(file_path):
            files_fixed += 1

    print(f"\n✓ Fixed {files_fixed} out of {len(service_files)} files")

if __name__ == "__main__":
    main()
