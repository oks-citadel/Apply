import * as fs from "fs";
import { SecurityIssue, Severity, Scanner } from "../types";

interface UnsafePattern {
  name: string;
  pattern: RegExp;
  severity: Severity;
  description: string;
  recommendation: string;
  cweId: string;
}

const unsafePatterns: UnsafePattern[] = [
  {
    name: "eval-usage",
    pattern: /\beval\s*\(/g,
    severity: "CRITICAL",
    description: "Use of eval() can lead to code injection vulnerabilities",
    recommendation: "Replace eval() with safer alternatives like JSON.parse() or Function constructor with proper validation",
    cweId: "CWE-95",
  },
  {
    name: "innerHTML-usage",
    pattern: /\.innerHTML\s*=/g,
    severity: "HIGH",
    description: "Direct innerHTML assignment can lead to XSS vulnerabilities",
    recommendation: "Use textContent, innerText, or sanitize HTML before insertion using DOMPurify",
    cweId: "CWE-79",
  },
  {
    name: "sql-string-concat",
    pattern: /(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN).*\+.*(?:req\.|params\.|body\.|query\.)/gi,
    severity: "CRITICAL",
    description: "SQL query built with string concatenation is vulnerable to SQL injection",
    recommendation: "Use parameterized queries or an ORM like TypeORM with proper query builder",
    cweId: "CWE-89",
  },
  {
    name: "shell-exec",
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\([^)]*(?:req\.|params\.|body\.|query\.)/g,
    severity: "CRITICAL",
    description: "Command execution with user input is vulnerable to command injection",
    recommendation: "Validate and sanitize all user input, use allowlists for commands",
    cweId: "CWE-78",
  },
  {
    name: "dangerouslySetInnerHTML",
    pattern: /dangerouslySetInnerHTML/g,
    severity: "HIGH",
    description: "dangerouslySetInnerHTML can lead to XSS if not properly sanitized",
    recommendation: "Sanitize HTML content using DOMPurify before passing to dangerouslySetInnerHTML",
    cweId: "CWE-79",
  },
  {
    name: "document-write",
    pattern: /document\.write\s*\(/g,
    severity: "HIGH",
    description: "document.write can lead to XSS vulnerabilities",
    recommendation: "Use DOM manipulation methods instead of document.write",
    cweId: "CWE-79",
  },
];

export class UnsafePatternsScanner implements Scanner {
  name = "unsafe-patterns";
  description = "Detects unsafe code patterns like eval(), innerHTML, SQL concatenation";

  async scan(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        for (const unsafePattern of unsafePatterns) {
          let match;
          const pattern = new RegExp(unsafePattern.pattern.source, unsafePattern.pattern.flags);

          while ((match = pattern.exec(content)) \!== null) {
            const lineNumber = content.substring(0, match.index).split("\n").length;
            const line = lines[lineNumber - 1] || "";
            const column = match.index - content.lastIndexOf("\n", match.index - 1);

            issues.push({
              id: `${unsafePattern.name}-${filePath}-${lineNumber}`,
              title: unsafePattern.name.replace(/-/g, " ").toUpperCase(),
              description: unsafePattern.description,
              severity: unsafePattern.severity,
              filePath,
              line: lineNumber,
              column,
              code: line.trim(),
              scanner: this.name,
              recommendation: unsafePattern.recommendation,
              cweId: unsafePattern.cweId,
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning file ${filePath}:`, error);
      }
    }

    return issues;
  }
}

export const unsafePatternsScanner = new UnsafePatternsScanner();
