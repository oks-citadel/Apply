import * as fs from "fs";
import { SecurityIssue, Scanner } from "../types";

interface EndpointValidation {
  method: string;
  path: string;
  line: number;
  hasBodyDto: boolean;
  hasQueryDto: boolean;
  hasParamDto: boolean;
  bodyParamName?: string;
  queryParamName?: string;
}

export class DtoValidationScanner implements Scanner {
  name = "dto-validation";
  description = "Detects endpoints without DTO validation";

  private readonly httpMethodsWithBody = ["@Post", "@Put", "@Patch"];
  private readonly allHttpMethods = ["@Get", "@Post", "@Put", "@Patch", "@Delete", "@All"];

  async scan(files: string[]): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];
    const controllerFiles = files.filter((f) => f.includes(".controller."));

    for (const filePath of controllerFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const endpoints = this.findEndpointsWithoutValidation(content, filePath);

        for (const endpoint of endpoints) {
          if (this.httpMethodsWithBody.includes(endpoint.method) && !endpoint.hasBodyDto) {
            issues.push({
              id: `dto-missing-body-${filePath}-${endpoint.line}`,
              title: "ENDPOINT WITHOUT BODY DTO VALIDATION",
              description: `The ${endpoint.method} ${endpoint.path || "endpoint"} accepts a body but has no DTO validation`,
              severity: "MEDIUM",
              filePath,
              line: endpoint.line,
              column: 1,
              code: `${endpoint.method}(${endpoint.path ? "\x27" + endpoint.path + "\x27" : ""}) - body: ${endpoint.bodyParamName || "any"}`,
              scanner: this.name,
              recommendation: "Create a DTO class with class-validator decorators and use @Body() with the DTO type",
              cweId: "CWE-20",
            });
          }
        }
      } catch (error) {
        console.error(`Error scanning file ${filePath}:`, error);
      }
    }

    return issues;
  }

  private findEndpointsWithoutValidation(content: string, filePath: string): EndpointValidation[] {
    const lines = content.split("\n");
    const endpoints: EndpointValidation[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const method of this.allHttpMethods) {
        if (!line.includes(method)) continue;

        const pathMatch = line.match(new RegExp(`${method}\s*\(["\x27]?([^"\x27)]*)["\x27]?\)`));
        const methodSignature = this.extractMethodSignature(lines, i);

        const hasBodyDto = this.checkBodyDto(methodSignature);
        const hasQueryDto = this.checkQueryDto(methodSignature);
        const hasParamDto = this.checkParamValidation(methodSignature);
        const bodyParamName = this.extractBodyType(methodSignature);

        endpoints.push({
          method,
          path: pathMatch?.[1] || "",
          line: i + 1,
          hasBodyDto,
          hasQueryDto,
          hasParamDto,
          bodyParamName,
        });
      }
    }

    return endpoints;
  }

  private extractMethodSignature(lines: string[], startLine: number): string {
    let signature = "";
    let braceCount = 0;
    let started = false;

    for (let i = startLine; i < Math.min(lines.length, startLine + 20); i++) {
      const line = lines[i];
      signature += line + "\n";

      for (const char of line) {
        if (char === "(") {
          started = true;
          braceCount++;
        } else if (char === ")") {
          braceCount--;
          if (started && braceCount === 0) {
            return signature;
          }
        }
      }

      if (line.includes("{") && started && braceCount <= 0) {
        return signature;
      }
    }

    return signature;
  }

  private checkBodyDto(signature: string): boolean {
    const bodyMatch = signature.match(/@Body\s*\([^)]*\)\s*(\w+)\s*:\s*(\w+)/);
    if (!bodyMatch) return true;

    const typeName = bodyMatch[2];
    if (typeName === "any" || typeName === "object" || typeName === "unknown") {
      return false;
    }
    if (typeName.toLowerCase().includes("dto")) {
      return true;
    }
    return typeName.charAt(0) === typeName.charAt(0).toUpperCase();
  }

  private checkQueryDto(signature: string): boolean {
    const queryMatch = signature.match(/@Query\s*\([^)]*\)\s*(\w+)\s*:\s*(\w+)/);
    if (!queryMatch) return true;
    const typeName = queryMatch[2];
    return typeName !== "any" && typeName !== "object";
  }

  private checkParamValidation(signature: string): boolean {
    const paramMatch = signature.match(/@Param\s*\(/);
    if (!paramMatch) return true;
    return signature.includes("ParseIntPipe") || signature.includes("ParseUUIDPipe") || signature.includes("ValidationPipe");
  }

  private extractBodyType(signature: string): string | undefined {
    const bodyMatch = signature.match(/@Body\s*\([^)]*\)\s*(\w+)\s*:\s*(\w+)/);
    return bodyMatch?.[2];
  }
}

export const dtoValidationScanner = new DtoValidationScanner();
