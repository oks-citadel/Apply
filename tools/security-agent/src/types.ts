export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SecurityIssue {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  filePath: string;
  line: number;
  column: number;
  code: string;
  scanner: string;
  recommendation: string;
  cweId?: string;
}

export interface ScanResult {
  issues: SecurityIssue[];
  scannedFiles: number;
  scanDuration: number;
  timestamp: string;
}

export interface Scanner {
  name: string;
  description: string;
  scan(files: string[]): Promise<SecurityIssue[]>;
}

export const severityOrder: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};
