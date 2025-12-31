import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { SecurityIssue, Scanner } from "../types";

interface VulnerablePackage {
  name: string;
  version: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  vulnerabilities: string[];
}

export class DependencyAuditScanner implements Scanner {
  name = "dependency-audit";
  description = "Checks for vulnerable dependencies using npm audit";

  async scan(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const packageJsonPaths = this.findPackageJsonFiles(files);

    for (const packageJsonPath of packageJsonPaths) {
      const dirPath = path.dirname(packageJsonPath);
      
      try {
        const auditResult = this.runNpmAudit(dirPath);
        if (auditResult) {
          const vulnerabilities = this.parseAuditResult(auditResult, packageJsonPath);
          issues.push(...vulnerabilities);
        }
      } catch (error) {
        console.error(`Error auditing ${packageJsonPath}:`, error);
      }
    }

    return issues;
  }

  private findPackageJsonFiles(files: string[]): string[] {
    const packageJsonPaths: string[] = [];
    const seenDirs = new Set<string>();

    for (const file of files) {
      const dir = path.dirname(file);
      if (seenDirs.has(dir)) continue;
      seenDirs.add(dir);

      const packageJsonPath = path.join(dir, "package.json");
      if (fs.existsSync(packageJsonPath) && \!packageJsonPaths.includes(packageJsonPath)) {
        packageJsonPaths.push(packageJsonPath);
      }

      let currentDir = dir;
      while (currentDir \!== path.dirname(currentDir)) {
        currentDir = path.dirname(currentDir);
        const parentPackageJson = path.join(currentDir, "package.json");
        if (fs.existsSync(parentPackageJson) && \!packageJsonPaths.includes(parentPackageJson)) {
          packageJsonPaths.push(parentPackageJson);
          break;
        }
      }
    }

    return packageJsonPaths;
  }

  private runNpmAudit(dirPath: string): string | null {
    try {
      const lockPath = path.join(dirPath, "package-lock.json");
      const pnpmLockPath = path.join(dirPath, "pnpm-lock.yaml");
      
      if (fs.existsSync(pnpmLockPath)) {
        try {
          return execSync("pnpm audit --json", {
            cwd: dirPath,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
          });
        } catch (e: any) {
          return e.stdout || null;
        }
      } else if (fs.existsSync(lockPath)) {
        try {
          return execSync("npm audit --json", {
            cwd: dirPath,
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
          });
        } catch (e: any) {
          return e.stdout || null;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private parseAuditResult(auditOutput: string, packageJsonPath: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    try {
      const audit = JSON.parse(auditOutput);
      const vulnerabilities = audit.vulnerabilities || audit.advisories || {};

      for (const [pkgName, vuln] of Object.entries(vulnerabilities)) {
        const v = vuln as any;
        const severity = this.mapSeverity(v.severity || "moderate");

        issues.push({
          id: `dep-vuln-${pkgName}-${v.via?.[0]?.source || "unknown"}`,
          title: `Vulnerable dependency: ${pkgName}`,
          description: v.via?.[0]?.title || v.title || `${pkgName} has known vulnerabilities`,
          severity,
          filePath: packageJsonPath,
          line: 1,
          column: 1,
          code: `"${pkgName}": "${v.range || v.version || "*"}"`,
          scanner: this.name,
          recommendation: v.fixAvailable
            ? `Update to ${typeof v.fixAvailable === "object" ? v.fixAvailable.version : "latest"}`
            : "Check for updates or consider alternative packages",
          cweId: v.via?.[0]?.cwe?.[0] || undefined,
        });
      }
    } catch (error) {
      console.error("Error parsing audit result:", error);
    }

    return issues;
  }

  private mapSeverity(severity: string): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" {
    switch (severity.toLowerCase()) {
      case "critical":
        return "CRITICAL";
      case "high":
        return "HIGH";
      case "moderate":
      case "medium":
        return "MEDIUM";
      default:
        return "LOW";
    }
  }
}

export const dependencyAuditScanner = new DependencyAuditScanner();
