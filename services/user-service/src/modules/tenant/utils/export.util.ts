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
   * Generate PDF document using PDFKit
   * Returns a Buffer containing the PDF data
   */
  async generatePDF(title: string, data: any, options?: {
    author?: string;
    subject?: string;
    includeTimestamp?: boolean;
  }): Promise<Buffer> {
    // Dynamic import of pdfkit to handle optional dependency
    let PDFDocument: any;
    try {
      PDFDocument = (await import('pdfkit')).default;
    } catch {
      this.logger.warn('PDFKit not installed, falling back to text-based PDF');
      return Buffer.from(this.generateSimplePDF(title, data));
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: title,
          Author: options?.author || 'ApplyForUs',
          Subject: options?.subject || 'Export Report',
          CreationDate: new Date(),
        },
      });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown();

      if (options?.includeTimestamp !== false) {
        doc.fontSize(10).font('Helvetica').fillColor('#666666')
          .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
      }

      // Content
      doc.fillColor('#000000');
      this.renderPDFContent(doc, data);

      // Footer
      const pageCount = doc.bufferedPageRange();
      for (let i = 0; i < pageCount.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#999999')
          .text(
            `Page ${i + 1} of ${pageCount.count}`,
            50,
            doc.page.height - 30,
            { align: 'center' }
          );
      }

      doc.end();
    });
  }

  /**
   * Render content to PDF document recursively
   */
  private renderPDFContent(doc: any, data: any, indent: number = 0): void {
    const leftMargin = 50 + (indent * 20);

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          doc.fontSize(12).font('Helvetica-Bold')
            .text(`Item ${index + 1}:`, leftMargin);
          doc.moveDown(0.5);
          this.renderPDFContent(doc, item, indent + 1);
          doc.moveDown();
        } else {
          doc.fontSize(11).font('Helvetica')
            .text(`• ${this.formatValue(item)}`, leftMargin);
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

        if (typeof value === 'object' && value !== null) {
          doc.fontSize(12).font('Helvetica-Bold')
            .text(`${formattedKey}:`, leftMargin);
          doc.moveDown(0.5);
          this.renderPDFContent(doc, value, indent + 1);
        } else {
          doc.fontSize(11).font('Helvetica')
            .text(`${formattedKey}: `, leftMargin, doc.y, { continued: true })
            .font('Helvetica').text(this.formatValue(value));
        }
      });
    } else {
      doc.fontSize(11).font('Helvetica')
        .text(this.formatValue(data), leftMargin);
    }
  }

  /**
   * Generate simple PDF (text-based fallback)
   * Used when PDFKit is not available
   */
  generateSimplePDF(title: string, data: any): string {
    const lines = [
      '%PDF-1.4',
      `%%Title: ${title}`,
      `%%CreationDate: ${new Date().toISOString()}`,
      '',
      `PDF REPORT: ${title}`,
      `Generated: ${new Date().toISOString()}`,
      '',
      '='.repeat(80),
      '',
      JSON.stringify(data, null, 2),
    ];

    return lines.join('\n');
  }

  /**
   * Generate resume PDF from profile data
   */
  async generateResumePDF(profile: any): Promise<Buffer> {
    let PDFDocument: any;
    try {
      PDFDocument = (await import('pdfkit')).default;
    } catch {
      this.logger.warn('PDFKit not installed, returning text format');
      return Buffer.from(this.generateSimplePDF('Resume', profile));
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
      });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Name and contact
      doc.fontSize(28).font('Helvetica-Bold')
        .text(profile.full_name || profile.name || 'Resume', { align: 'center' });
      doc.moveDown(0.3);

      if (profile.email || profile.phone || profile.location) {
        doc.fontSize(10).font('Helvetica').fillColor('#555555');
        const contactParts = [
          profile.email,
          profile.phone,
          profile.location,
        ].filter(Boolean);
        doc.text(contactParts.join(' | '), { align: 'center' });
        doc.moveDown(0.5);
      }

      // LinkedIn / Portfolio
      if (profile.linkedin || profile.portfolio) {
        const links = [profile.linkedin, profile.portfolio].filter(Boolean);
        doc.fontSize(9).fillColor('#0066cc').text(links.join(' | '), { align: 'center' });
      }

      doc.moveDown();
      doc.fillColor('#000000');

      // Professional Summary
      if (profile.summary || profile.bio) {
        this.addResumeSection(doc, 'PROFESSIONAL SUMMARY');
        doc.fontSize(10).font('Helvetica')
          .text(profile.summary || profile.bio, { align: 'justify' });
        doc.moveDown();
      }

      // Work Experience
      if (profile.work_experience?.length > 0) {
        this.addResumeSection(doc, 'WORK EXPERIENCE');
        profile.work_experience.forEach((exp: any) => {
          doc.fontSize(11).font('Helvetica-Bold').text(exp.title || exp.position);
          doc.fontSize(10).font('Helvetica')
            .text(`${exp.company || exp.organization} | ${exp.start_date} - ${exp.end_date || 'Present'}`);
          if (exp.description) {
            doc.moveDown(0.3);
            doc.fontSize(10).text(exp.description, { align: 'justify' });
          }
          doc.moveDown();
        });
      }

      // Education
      if (profile.education?.length > 0) {
        this.addResumeSection(doc, 'EDUCATION');
        profile.education.forEach((edu: any) => {
          doc.fontSize(11).font('Helvetica-Bold')
            .text(`${edu.degree || edu.qualification} in ${edu.field || edu.major || ''}`);
          doc.fontSize(10).font('Helvetica')
            .text(`${edu.institution || edu.school} | ${edu.graduation_year || edu.end_date || ''}`);
          doc.moveDown(0.5);
        });
      }

      // Skills
      if (profile.skills?.length > 0) {
        this.addResumeSection(doc, 'SKILLS');
        const skillsText = profile.skills.map((s: any) =>
          typeof s === 'string' ? s : s.name
        ).join(' • ');
        doc.fontSize(10).font('Helvetica').text(skillsText);
        doc.moveDown();
      }

      // Certifications
      if (profile.certifications?.length > 0) {
        this.addResumeSection(doc, 'CERTIFICATIONS');
        profile.certifications.forEach((cert: any) => {
          doc.fontSize(10).font('Helvetica')
            .text(`• ${cert.name || cert.title}${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}`);
        });
      }

      doc.end();
    });
  }

  /**
   * Add a section header to resume PDF
   */
  private addResumeSection(doc: any, title: string): void {
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#2c3e50').text(title);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2c3e50').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fillColor('#000000');
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
