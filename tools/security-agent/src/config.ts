import { Severity } from './types';

export interface ScanConfig {
  /** Directories to scan */
  includePaths: string[];
  /** Patterns to exclude */
  excludePatterns: string[];
  /** File extensions to scan */
  fileExtensions: string[];
  /** Minimum severity to report */
  minSeverity: Severity;
  /** Enable specific scanners */
  scanners: {
    unsafePatterns: boolean;
    secretsDetector: boolean;
    dependencyAudit: boolean;
    authorizationGaps: boolean;
    dtoValidation: boolean;
  };
  /** Output configuration */
  output: {
    markdown: boolean;
    console: boolean;
    sarif: boolean;
    markdownPath: string;
    sarifPath: string;
  };
}

export const defaultConfig: ScanConfig = {
  includePaths: ['services/', 'apps/'],
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/*.spec.ts',
    '**/*.test.ts',
    '**/__tests__/**',
    '**/*.d.ts',
  ],
  fileExtensions: ['.ts', '.tsx'],
  minSeverity: 'LOW',
  scanners: {
    unsafePatterns: true,
    secretsDetector: true,
    dependencyAudit: true,
    authorizationGaps: true,
    dtoValidation: true,
  },
  output: {
    markdown: true,
    console: true,
    sarif: true,
    markdownPath: 'SECURITY/security-report.md',
    sarifPath: 'SECURITY/security-report.sarif',
  },
};
