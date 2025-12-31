# Security Agent

PR-gated security scanning tool for detecting vulnerabilities and security issues.

## Features

- **Unsafe Patterns Detection**: Detects eval(), innerHTML, SQL string concatenation
- **Secrets Detection**: Finds hardcoded API keys, passwords, and secrets
- **Dependency Audit**: Checks for vulnerable dependencies
- **Authorization Gaps**: Detects endpoints without auth guards
- **DTO Validation**: Detects endpoints without proper DTO validation

## Installation

```bash
cd tools/security-agent
npm install
npm run build
```

## Usage

```bash
# Run security scan
npm run scan

# With custom paths
npm run scan -- --path services/ apps/

# With minimum severity level
npm run scan -- --min-severity HIGH

# Disable specific reports
npm run scan -- --no-markdown --no-sarif
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <paths...>` | Paths to scan | `services/`, `apps/` |
| `-o, --output <path>` | Output path for reports | `SECURITY` |
| `--no-console` | Disable console output | false |
| `--no-markdown` | Disable markdown report | false |
| `--no-sarif` | Disable SARIF report | false |
| `--min-severity <level>` | Minimum severity | `LOW` |

## Severity Levels

- **CRITICAL**: Immediate security risk (eval, SQL injection, hardcoded secrets)
- **HIGH**: Serious security issue (XSS, missing auth guards)
- **MEDIUM**: Moderate security concern (missing validation)
- **LOW**: Minor security improvement recommended

## Output

Reports are generated in the `SECURITY/` directory:

- `security-report.md` - Human-readable markdown report
- `security-report.sarif` - SARIF format for GitHub code scanning

## Exit Codes

- `0` - No critical or high severity issues found
- `1` - Critical or high severity issues found (fails PR)

## CI/CD Integration

The security-agent is designed to run as a PR gate. Add it to your CI workflow:

```yaml
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20
    - name: Install and run security scan
      run: |
        cd tools/security-agent
        npm install
        npm run build
        npm start
    - name: Upload security report
      uses: actions/upload-artifact@v4
      with:
        name: security-report
        path: SECURITY/
```
