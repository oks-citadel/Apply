import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExportUtil {
  private readonly logger = new Logger(ExportUtil.name);

  /**
   * Convert data to CSV format
   */
  convertToCSV(data: any[], headers?: string[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    // If headers not provided, extract from first object
    const csvHeaders = headers || Object.keys(data[0]);

    // Create CSV header row
    const headerRow = csvHeaders.map((header) => this.escapeCSVValue(header)).join(',');

    // Create CSV data rows
    const dataRows = data.map((row) => csvHeaders
        .map((header) => {
          const value = row[header];
          return this.escapeCSVValue(this.formatValue(value));
        })
        .join(','));

    return [headerRow, ...dataRows].join('\n');
  }

  /**
   * Escape CSV values
   */
  private escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // If value contains comma, newline, or quotes, wrap in quotes and escape existing quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Format value for CSV
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Convert placement data to CSV
   */
  convertPlacementToCSV(placements: any[]): string {
    const headers = [
      'student_name',
      'student_email',
      'student_id',
      'cohort',
      'program',
      'major',
      'graduation_year',
      'graduation_date',
      'placement_status',
      'company_name',
      'job_title',
      'industry',
      'location',
      'employment_type',
      'salary',
      'salary_currency',
      'start_date',
      'placement_date',
      'days_to_placement',
      'total_applications',
      'interviews_attended',
      'offers_received',
      'job_source',
      'used_platform',
      'satisfaction_score',
    ];

    return this.convertToCSV(placements, headers);
  }

  /**
   * Convert user data to CSV
   */
  convertUsersToCSV(users: any[]): string {
    const headers = [
      'user_id',
      'email',
      'full_name',
      'role',
      'department',
      'job_title',
      'employee_id',
      'student_id',
      'cohort',
      'graduation_year',
      'major',
      'is_active',
      'joined_at',
    ];

    return this.convertToCSV(users, headers);
  }

  /**
   * Convert department data to CSV
   */
  convertDepartmentsToCSV(departments: any[]): string {
    const headers = [
      'name',
      'code',
      'description',
      'manager_user_id',
      'headcount',
      'target_headcount',
      'annual_budget',
      'total_applications',
      'successful_placements',
      'placement_rate',
      'average_salary_placed',
      'is_active',
    ];

    return this.convertToCSV(departments, headers);
  }

  /**
   * Generate simple PDF (text-based)
   * Note: For production, consider using libraries like pdfkit or puppeteer
   */
  generateSimplePDF(title: string, data: any): string {
    // This is a placeholder for PDF generation
    // In production, you would use a proper PDF library
    const lines = [
      `PDF REPORT: ${title}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      '=' .repeat(80),
      '',
      JSON.stringify(data, null, 2),
    ];

    return lines.join('\n');
  }

  /**
   * Generate placement report
   */
  generatePlacementReport(analytics: any): any {
    return {
      title: 'Placement Analytics Report',
      generatedAt: new Date().toISOString(),
      summary: analytics.summary,
      breakdown: {
        byIndustry: analytics.byIndustry,
        byEmploymentType: analytics.byEmploymentType,
      },
      dateRange: analytics.dateRange,
      totalRecords: analytics.placements?.length || 0,
    };
  }

  /**
   * Parse CSV to JSON
   */
  parseCSV(csvContent: string): any[] {
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      return [];
    }

    // Parse header
    const headers = this.parseCSVLine(lines[0]);

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      data.push(row);
    }

    return data;
  }

  /**
   * Parse CSV line
   */
  private parseCSVLine(line: string): string[] {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last value
    values.push(current.trim());

    return values;
  }
}
