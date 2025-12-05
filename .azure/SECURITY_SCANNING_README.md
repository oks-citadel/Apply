# Security Scanning Implementation Guide

## Overview

This document describes the security scanning implementation for the JobPilot AI Platform Azure DevOps pipelines.

## Security Scanning Tools

### 1. Application Pipeline (azure-pipelines.yml)

#### Stage 3: Security Scanning

The security scanning stage runs after tests and includes four parallel jobs:

##### Job 1: SAST (Static Application Security Testing)
- **Tool**: Snyk Security Scan
- **Purpose**: Detect vulnerabilities in application code and dependencies
- **Configuration**:
  - Service connection: `snyk-connection` (must be configured in Azure DevOps)
  - Test type: Application
  - Fails on issues: No (continueOnError: true)
  - Monitors on build: No

**Setup Required**:
1. Create a Snyk account at https://snyk.io
2. In Azure DevOps, go to Project Settings > Service Connections
3. Create a new service connection of type "Snyk"
4. Name it `snyk-connection`
5. Add your Snyk API token

##### Job 2: Container Scanning
- **Tool**: Trivy
- **Purpose**: Scan container images and Dockerfiles for vulnerabilities
- **Scans**:
  - Dockerfile configuration scanning
  - Container image vulnerability scanning (after build)
- **Severity**: HIGH and CRITICAL vulnerabilities
- **Output**: JSON and CLI formats

**Features**:
- Scans Dockerfiles in the `docker/` directory
- Scans built container images (auth-service, ai-service)
- Publishes scan results as pipeline artifacts

##### Job 3: Dependency Vulnerability Check
- **Tools**:
  - `pnpm audit` for Node.js dependencies
  - `safety` for Python dependencies
- **Purpose**: Check for known vulnerabilities in project dependencies
- **Configuration**:
  - NPM audit level: high
  - Python safety check for ai-service requirements.txt

**Output Artifacts**:
- `npm-audit.json` - NPM vulnerability report
- `safety-report.json` - Python dependency vulnerability report

##### Job 4: CodeQL Analysis
- **Tool**: CodeQL (placeholder)
- **Purpose**: Advanced semantic code analysis
- **Status**: Placeholder implementation

**To Enable CodeQL**:
- Configure Azure DevOps Advanced Security (ADAS), or
- Integrate with GitHub Advanced Security (GHAS)

### 2. Infrastructure Pipeline (azure-pipelines-infra.yml)

#### Enhanced Security Scanning Jobs

##### Job 1: Checkov IaC Security Scan
- **Tool**: Checkov
- **Purpose**: Infrastructure as Code security scanning for Bicep templates
- **Framework**: Bicep
- **Output Formats**:
  - CLI (console output)
  - JUnit XML (for test results)
  - SARIF (for advanced security reporting)

**Scans**:
- Main Bicep file: `infrastructure/azure/main.bicep`
- All module files: `infrastructure/azure/modules/*.bicep`

**Features**:
- Soft fail mode (doesn't fail pipeline)
- Publishes test results to Azure DevOps
- Generates SARIF output for integration with security dashboards

##### Job 2: PSRule for Azure
- **Tool**: PSRule for Azure
- **Purpose**: Azure-specific best practices and compliance checking
- **Module**: PSRule.Rules.Azure
- **Output**: SARIF format

**What it Checks**:
- Azure resource configuration best practices
- Security recommendations
- Cost optimization opportunities
- Compliance with Azure Well-Architected Framework

## Configuration Files

### 1. `.github/dependabot.yml`
Automated dependency updates configuration:

**Update Schedules**:
- NPM dependencies: Monday 9:00 AM
- Python dependencies: Monday 9:00 AM
- Docker base images: Tuesday 9:00 AM
- GitHub Actions: Wednesday 9:00 AM

**Features**:
- Grouped minor/patch updates
- Separate major version updates
- Auto-labeling
- Team assignments
- Semantic commit messages

### 2. `security-scan-config.yaml`
Centralized security scanning configuration:

**Configured Tools**:
- Trivy (container & IaC scanning)
- Snyk (SAST & dependency scanning)
- Checkov (IaC security)
- PSRule (Azure compliance)
- Safety (Python dependencies)
- NPM Audit (Node.js dependencies)
- CodeQL (future implementation)

**Key Settings**:
- Severity thresholds
- Scan targets
- Output formats
- Ignore policies
- Notification settings

## Setup Instructions

### Prerequisites

1. **Azure DevOps Project Setup**:
   - Admin access to the Azure DevOps project
   - Ability to create service connections
   - Ability to install extensions

2. **Required Extensions**:
   - Snyk Security Scan (from Azure DevOps Marketplace)
   - PSRule (from Azure DevOps Marketplace)

### Step 1: Install Extensions

```bash
# In Azure DevOps
# 1. Go to Organization Settings > Extensions
# 2. Browse Marketplace
# 3. Search and install:
#    - "Snyk Security Scan"
#    - "PSRule"
```

### Step 2: Configure Snyk Service Connection

1. Create Snyk account at https://snyk.io
2. Get your API token from Snyk account settings
3. In Azure DevOps:
   - Go to Project Settings > Service Connections
   - Click "New service connection"
   - Select "Snyk"
   - Enter your API token
   - Name it `snyk-connection`
   - Save and verify

### Step 3: Update Pipeline Variables (if needed)

Add these variables to your pipeline if you want to customize behavior:

```yaml
variables:
  - name: SECURITY_SCAN_ENABLED
    value: true
  - name: TRIVY_SEVERITY
    value: 'HIGH,CRITICAL'
  - name: CHECKOV_SOFT_FAIL
    value: true
```

### Step 4: Configure Dependabot (GitHub only)

If using GitHub mirror or GitHub Advanced Security:

1. Push the `.github/dependabot.yml` file to your repository
2. Dependabot will automatically start creating PRs for dependency updates
3. Configure team reviews in GitHub Settings

### Step 5: Review and Adjust Scan Settings

1. Review `security-scan-config.yaml`
2. Adjust severity thresholds based on your requirements
3. Add any specific vulnerabilities to ignore lists (with justification)
4. Configure notification settings

## Security Scan Results

### Viewing Results

#### Azure DevOps Pipeline Results:
1. Go to your pipeline run
2. Click on the "Security" stage
3. Each job shows its scan results
4. Download artifacts for detailed reports

#### Artifact Downloads:
- `snyk-results` - Snyk vulnerability reports
- `trivy-results` - Trivy scan results
- `npm-audit-results` - NPM audit report
- `safety-results` - Python safety check report
- `container-scan-results` - Container image scan results
- `checkov-sarif` - Checkov IaC scan (SARIF format)
- `psrule-results` - PSRule Azure compliance report

### Test Results Integration

- Checkov results appear in the Tests tab
- Can set quality gates based on test pass/fail
- SARIF files can be imported to security dashboards

## Continuous Improvement

### Recommended Actions

1. **Weekly Review**:
   - Review security scan results every Monday
   - Triage new vulnerabilities
   - Plan remediation work

2. **Monthly Reports**:
   - Generate security posture report
   - Track vulnerability trends
   - Review and update ignore policies

3. **Quarterly Updates**:
   - Update security scanning tools
   - Review and update security policies
   - Conduct security training

### Severity Response Times

Based on `security-scan-config.yaml`:
- **CRITICAL**: 24 hours
- **HIGH**: 3 days
- **MEDIUM**: 7 days
- **LOW**: 30 days

## Troubleshooting

### Common Issues

#### Snyk Connection Fails
```
Error: Could not authenticate with Snyk
```
**Solution**: Verify the service connection credentials in Azure DevOps

#### Trivy Installation Fails
```
Error: Unable to install Trivy
```
**Solution**: Check network connectivity and apt repository access

#### Checkov Module Not Found
```
Error: No module named 'checkov'
```
**Solution**: Ensure Python 3.11 is installed and pip is working

#### PSRule Task Not Found
```
Error: Task 'ps-rule-assert@2' not found
```
**Solution**: Install the PSRule extension from Azure DevOps Marketplace

### Debug Mode

Enable verbose logging for any security scan:

```yaml
- script: |
    set -x  # Enable debug mode
    trivy --debug image myimage:tag
  displayName: 'Debug Trivy Scan'
```

## Security Contacts

- **Security Team**: security@citadelcloudmanagement.com
- **DevOps Team**: devops@citadelcloudmanagement.com
- **Incident Response**: security-incidents@citadelcloudmanagement.com

## Compliance

This security scanning implementation helps meet:
- **OWASP Top 10** - Application security risks
- **CIS Azure Foundations Benchmark** - Cloud security standards
- **NIST Cybersecurity Framework** - Security controls
- **DevSecOps Best Practices** - Security in CI/CD

## Additional Resources

- [Snyk Documentation](https://docs.snyk.io/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Checkov Documentation](https://www.checkov.io/1.Welcome/What%20is%20Checkov.html)
- [PSRule for Azure](https://azure.github.io/PSRule.Rules.Azure/)
- [Azure DevOps Security](https://docs.microsoft.com/en-us/azure/devops/organizations/security/)
- [GitHub Advanced Security](https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-12-04 | Initial security scanning implementation |

---

**Last Updated**: December 4, 2024
**Maintained By**: JobPilot DevOps Team
