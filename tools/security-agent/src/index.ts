#!/usr/bin/env node
import { Command } from "commander";
import { glob } from "glob";
import * as path from "path";
import { defaultConfig, ScanConfig } from "./config";
import { SecurityIssue, ScanResult, severityOrder } from "./types";
import { unsafePatternsScanner, secretsDetectorScanner, authorizationGapsScanner, dtoValidationScanner } from "./scanners";
import { consoleReporter, markdownReporter, sarifReporter } from "./reporters";

const program = new Command();

program
  .name("security-agent")
  .description("PR-gated security scanning tool")
  .version("1.0.0")
  .option("-p, --path <paths...>", "Paths to scan", ["services/", "apps/"])
  .option("-o, --output <path>", "Output path for reports", "SECURITY")
  .option("--no-console", "Disable console output")
  .option("--no-markdown", "Disable markdown report")
  .option("--no-sarif", "Disable SARIF report")
  .option("--min-severity <level>", "Minimum severity to report", "LOW")
  .parse(process.argv);

const options = program.opts();

async function main() {
  console.log("Starting security scan...");
  const startTime = Date.now();

  const config: ScanConfig = {
    ...defaultConfig,
    includePaths: options.path || defaultConfig.includePaths,
    minSeverity: options.minSeverity || defaultConfig.minSeverity,
    output: {
      ...defaultConfig.output,
      console: options.console \!== false,
      markdown: options.markdown \!== false,
      sarif: options.sarif \!== false,
      markdownPath: path.join(options.output, "security-report.md"),
      sarifPath: path.join(options.output, "security-report.sarif"),
    },
  };

  const files = await discoverFiles(config);
  console.log("Found " + files.length + " files to scan");

  const issues: SecurityIssue[] = [];

  if (config.scanners.unsafePatterns) {
    console.log("Running unsafe patterns scanner...");
    issues.push(...await unsafePatternsScanner.scan(files));
  }

  if (config.scanners.secretsDetector) {
    console.log("Running secrets detector...");
    issues.push(...await secretsDetectorScanner.scan(files));
  }

  if (config.scanners.authorizationGaps) {
    console.log("Running authorization gaps scanner...");
    issues.push(...await authorizationGapsScanner.scan(files));
  }

  if (config.scanners.dtoValidation) {
    console.log("Running DTO validation scanner...");
    issues.push(...await dtoValidationScanner.scan(files));
  }

  const filteredIssues = issues.filter(
    (issue) => severityOrder[issue.severity] >= severityOrder[config.minSeverity]
  );

  const result: ScanResult = {
    issues: filteredIssues,
    scannedFiles: files.length,
    scanDuration: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  };

  if (config.output.console) {
    consoleReporter.report(result);
  }

  if (config.output.markdown) {
    markdownReporter.generateReport(result, config.output.markdownPath);
  }

  if (config.output.sarif) {
    sarifReporter.generateReport(result, config.output.sarifPath);
  }

  const criticalCount = filteredIssues.filter((i) => i.severity === "CRITICAL").length;
  const highCount = filteredIssues.filter((i) => i.severity === "HIGH").length;

  if (criticalCount > 0 || highCount > 0) {
    console.log("Security scan FAILED: " + criticalCount + " critical and " + highCount + " high severity issues found");
    process.exit(1);
  }

  console.log("Security scan PASSED");
  process.exit(0);
}

async function discoverFiles(config: ScanConfig): Promise<string[]> {
  const allFiles: string[] = [];

  for (const includePath of config.includePaths) {
    for (const ext of config.fileExtensions) {
      const pattern = includePath + "**/*" + ext;
      const files = await glob(pattern, {
        ignore: config.excludePatterns,
        nodir: true,
      });
      allFiles.push(...files);
    }
  }

  return [...new Set(allFiles)];
}

main().catch((error) => {
  console.error("Security scan failed with error:", error);
  process.exit(1);
});
