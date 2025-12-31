import * as fs from "fs";
import { SecurityIssue, Severity, Scanner } from "../types";

interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: Severity;
  description: string;
  recommendation: string;
}

const secretPatterns: SecretPattern[] = [
  {
    name: "api-key",
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["\x27][a-zA-Z0-9_-]{20,}["\x27]/gi,
    severity: "CRITICAL",
    description: "Potential hardcoded API key detected",
    recommendation: "Move API keys to environment variables or a secure vault like Azure Key Vault",
  },
  {
    name: "password",
    pattern: /(?:password|passwd|pwd)\s*[:=]\s*["\x27][^\x27"]{8,}["\x27]/gi,
    severity: "CRITICAL",
    description: "Potential hardcoded password detected",
    recommendation: "Never hardcode passwords. Use environment variables or secure secret management",
  },
  {
    name: "jwt-secret",
    pattern: /(?:jwt[_-]?secret|secret[_-]?key)\s*[:=]\s*["\x27][a-zA-Z0-9+/=_-]{20,}["\x27]/gi,
    severity: "CRITICAL",
    description: "Potential hardcoded JWT secret detected",
    recommendation: "Store JWT secrets in environment variables or a secure vault",
  },
  {
    name: "private-key",
    pattern: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
    severity: "CRITICAL",
    description: "Private key found in source code",
    recommendation: "Never commit private keys. Use secure key management systems",
  },
  {
    name: "aws-access-key",
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: "CRITICAL",
    description: "AWS Access Key ID detected",
    recommendation: "Remove AWS credentials and use IAM roles or environment variables",
  },
  {
    name: "aws-secret-key",
    pattern: /["\x27][a-zA-Z0-9/+=]{40}["\x27]/g,
    severity: "HIGH",
    description: "Potential AWS Secret Access Key detected",
    recommendation: "Never hardcode AWS credentials. Use IAM roles or environment variables",
  },
  {
    name: "azure-connection-string",
    pattern: /DefaultEndpointsProtocol=https?;AccountName=[^;]+;AccountKey=[^;]+/g,
    severity: "CRITICAL",
    description: "Azure Storage connection string detected",
    recommendation: "Use Azure Key Vault or managed identities instead of hardcoded connection strings",
  },
  {
    name: "database-url",
    pattern: /(?:mongodb|postgres|mysql|redis):\/\/[^:]+:[^@]+@/g,
    severity: "CRITICAL",
    description: "Database connection string with credentials detected",
    recommendation: "Store database credentials in environment variables or secure vault",
  },
  {
    name: "bearer-token",
    pattern: /Bearer\s+[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    severity: "HIGH",
    description: "Hardcoded Bearer token detected",
    recommendation: "Tokens should be retrieved dynamically, not hardcoded",
  },
];

export class SecretsDetectorScanner implements Scanner {
  name = "secrets-detector";
  description = "Detects hardcoded API keys, passwords, and other secrets";

  async scan(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const filePath of files) {
      if (this.shouldSkipFile(filePath)) continue;

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        for (const secretPattern of secretPatterns) {
          let match;
          const pattern = new RegExp(secretPattern.pattern.source, secretPattern.pattern.flags);

          while ((match = pattern.exec(content)) \!== null) {
            const lineNumber = content.substring(0, match.index).split("\n").length;
            const line = lines[lineNumber - 1] || "";
            const column = match.index - content.lastIndexOf("\n", match.index - 1);

            if (this.isFalsePositive(match[0], line)) continue;

            issues.push({
              id: `${secretPattern.name}-${filePath}-${lineNumber}`,
              title: secretPattern.name.replace(/-/g, " ").toUpperCase(),
              description: secretPattern.description,
              severity: secretPattern.severity,
              filePath,
              line: lineNumber,
              column,
              code: this.maskSecret(line.trim()),
              scanner: this.name,
              recommendation: secretPattern.recommendation,
              cweId: "CWE-798",
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning file ${filePath}:`, error);
      }
    }

    return issues;
  }

  private shouldSkipFile(filePath: string): boolean {
    const skipPatterns = [".example", ".sample", ".template", ".md", ".txt"];
    return skipPatterns.some((p) => filePath.toLowerCase().includes(p));
  }

  private isFalsePositive(match: string, line: string): boolean {
    const falsePositivePatterns = [
      /process\.env/,
      /\$\{/,
      /getenv/,
      /environment/i,
      /config\./,
      /placeholder/i,
      /example/i,
      /your[_-]?/i,
      /xxx+/i,
    ];
    return falsePositivePatterns.some((p) => p.test(line));
  }

  private maskSecret(line: string): string {
    return line.replace(/(["\x27])[^\x27"]{8,}(["\x27])/g, "$1[REDACTED]$2");
  }
}

export const secretsDetectorScanner = new SecretsDetectorScanner();
