import * as fs from "fs";
import * as path from "path";
import { ScanResult, SecurityIssue } from "../types";
export class SarifReporter {
  generateReport(result: ScanResult, outputPath: string): void {
    const sarif = this.buildSarif(result);
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
    fs.writeFileSync(outputPath, JSON.stringify(sarif, null, 2), "utf-8");
    console.log("SARIF report written to: " + outputPath);
  }
  private buildSarif(result: ScanResult): any {
    const rules = this.buildRules(result.issues);
    const results = this.buildResults(result.issues);
    return { version: "2.1.0", runs: [{ tool: { driver: { name: "@applyforus/security-agent", version: "1.0.0", rules } }, results }] };
  }
private buildRules(x: SecurityIssue[]): any[] { return []; }
private buildResults(x: SecurityIssue[]): any[] { return []; }
private mapLevel(s: string): string { return s === "CRITICAL" ? "error" : "warning"; }
}
export const sarifReporter = new SarifReporter();
