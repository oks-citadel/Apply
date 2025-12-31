import * as fs from "fs";
import { SecurityIssue, Scanner } from "../types";

interface ControllerInfo {
  filePath: string;
  className: string;
  line: number;
  hasClassGuard: boolean;
  endpoints: EndpointInfo[];
}

interface EndpointInfo {
  method: string;
  path: string;
  line: number;
  hasGuard: boolean;
  isPublic: boolean;
}

export class AuthorizationGapsScanner implements Scanner {
  name = "authorization-gaps";
  description = "Detects endpoints without proper auth guards";

  private readonly guardPatterns = [
    /@UseGuards\s*\(/,
    /@Auth\s*\(/,
    /@Roles\s*\(/,
    /@JwtAuth/,
    /@Public\s*\(/,
    /@AllowAnonymous/,
  ];

  private readonly httpMethodDecorators = [
    "@Get",
    "@Post",
    "@Put",
    "@Patch",
    "@Delete",
    "@All",
  ];

  async scan(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const controllerFiles = files.filter((f) => f.includes(".controller."));

    for (const filePath of controllerFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const controllerInfo = this.analyzeController(content, filePath);

        for (const endpoint of controllerInfo.endpoints) {
          if (!endpoint.hasGuard && !endpoint.isPublic && !controllerInfo.hasClassGuard) {
            issues.push({
              id: `auth-gap-${filePath}-${endpoint.line}`,
              title: "ENDPOINT WITHOUT AUTH GUARD",
              description: `The ${endpoint.method} ${endpoint.path || "endpoint"} has no authentication guard`,
              severity: "HIGH",
              filePath,
              line: endpoint.line,
              column: 1,
              code: `${endpoint.method}(${endpoint.path ? "\x27" + endpoint.path + "\x27" : ""})`,
              scanner: this.name,
              recommendation: "Add @UseGuards(JwtAuthGuard) or @Public() decorator if intentionally public",
              cweId: "CWE-862",
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning file ${filePath}:`, error);
      }
    }

    return issues;
  }

  private analyzeController(content: string, filePath: string): ControllerInfo {
    const lines = content.split("\n");
    const controllerInfo: ControllerInfo = {
      filePath,
      className: this.extractClassName(content),
      line: 1,
      hasClassGuard: this.hasClassLevelGuard(content),
      endpoints: [],
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const decorator of this.httpMethodDecorators) {
        if (line.includes(decorator)) {
          const pathMatch = line.match(new RegExp(`${decorator}\s*\(["\x27]?([^"\x27)]*)["\x27]?\)`));
          const hasGuard = this.checkMethodGuard(lines, i);
          const isPublic = this.checkIsPublic(lines, i);

          controllerInfo.endpoints.push({
            method: decorator,
            path: pathMatch?.[1] || "",
            line: i + 1,
            hasGuard,
            isPublic,
          });
        }
      }
    }

    return controllerInfo;
  }

  private extractClassName(content: string): string {
    const match = content.match(/class\s+(\w+Controller)/);
    return match?.[1] || "UnknownController";
  }

  private hasClassLevelGuard(content: string): boolean {
    const classMatch = content.match(/@Controller\s*\([^)]*\)([\s\S]*?)class/);
    if (!classMatch) return false;

    const beforeClass = classMatch[1];
    return this.guardPatterns.some((pattern) => pattern.test(beforeClass));
  }

  private checkMethodGuard(lines: string[], methodLine: number): boolean {
    for (let i = methodLine - 1; i >= Math.max(0, methodLine - 5); i--) {
      const line = lines[i];
      if (this.guardPatterns.some((pattern) => pattern.test(line))) {
        return true;
      }
      if (this.httpMethodDecorators.some((d) => line.includes(d))) {
        break;
      }
    }
    return false;
  }

  private checkIsPublic(lines: string[], methodLine: number): boolean {
    const publicPatterns = [/@Public/, /@AllowAnonymous/, /@SkipAuth/];
    for (let i = methodLine - 1; i >= Math.max(0, methodLine - 5); i--) {
      const line = lines[i];
      if (publicPatterns.some((pattern) => pattern.test(line))) {
        return true;
      }
      if (this.httpMethodDecorators.some((d) => line.includes(d))) {
        break;
      }
    }
    return false;
  }
}

export const authorizationGapsScanner = new AuthorizationGapsScanner();
