import chalk from "chalk";
import { ScanResult, SecurityIssue, severityOrder } from "../types";

export class ConsoleReporter {
  report(result: ScanResult): void {
    const { issues, scannedFiles, scanDuration, timestamp } = result;
    console.log("\n" + chalk.bold.blue("=".repeat(60)));
    console.log(chalk.bold.blue("  SECURITY SCAN REPORT"));
    console.log(chalk.bold.blue("=".repeat(60)) + "\n");
    console.log(chalk.gray("Scan Date: " + timestamp));
    console.log(chalk.gray("Files Scanned: " + scannedFiles));
    const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
    const highCount = issues.filter((i) => i.severity === "HIGH").length;
    const mediumCount = issues.filter((i) => i.severity === "MEDIUM").length;
    const lowCount = issues.filter((i) => i.severity === "LOW").length;
    console.log(chalk.bold("Severity Summary:"));
    console.log("  CRITICAL: " + criticalCount);
    console.log("  HIGH: " + highCount);
    console.log("  MEDIUM: " + mediumCount);
    console.log("  LOW: " + lowCount);
    if (issues.length === 0) {
      console.log(chalk.green.bold("No security issues found\!"));
      return;
    }
    const sortedIssues = [...issues].sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
    console.log(chalk.bold("Issues Found: " + issues.length));
    for (const issue of sortedIssues) { this.printIssue(issue); }
    if (criticalCount > 0 || highCount > 0) {
      console.log(chalk.red.bold("  STATUS: FAILED"));
    } else {
      console.log(chalk.green.bold("  STATUS: PASSED"));
    }
  }
  private printIssue(issue: SecurityIssue): void {
    console.log();
    console.log(chalk.bold(issue.severity + ": " + issue.title));
    console.log(chalk.gray("   File: " + issue.filePath + ":" + issue.line));
    console.log("   " + issue.description);
    console.log(chalk.cyan("   Fix: " + issue.recommendation));
  }
}
export const consoleReporter = new ConsoleReporter();
