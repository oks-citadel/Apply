# Cosign Image Signing Setup

This document provides instructions for setting up Cosign.

## Overview

Cosign is used for:
- Signing container images using keyless signing (OIDC)
- Verifying image signatures before deployment
- Attaching SBOM and vulnerability attestations

## Prerequisites

1. Install Cosign
2. Azure CLI logged in
3. ACR Access to applyforusacr.azurecr.io

## Keyless Signing (Recommended)

Keyless signing uses OIDC identity from GitHub Actions.

### GitHub Actions Workflow Integration

Add to your CI/CD workflow:

\n
### Verification

\n
## Security Best Practices

1. Use keyless signing when possible
2. Always verify signatures before deployment
3. Enforce signature verification via Kyverno policies
4. Store keys in Azure Key Vault
5. Rotate keys regularly
