import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { Resume } from '../resumes/entities/resume.entity';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  /**
   * Generate PDF from resume data
   */
  async generatePdf(resume: Resume): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header with name and contact info
        if (resume.content.personalInfo) {
          const { fullName, email, phone, address, linkedin, github, website } = resume.content.personalInfo;

          doc.fontSize(24).font('Helvetica-Bold').text(fullName || '', { align: 'center' });
          doc.moveDown(0.5);

          const contactInfo: string[] = [];
          if (email) contactInfo.push(email);
          if (phone) contactInfo.push(phone);
          if (address) contactInfo.push(address);

          if (contactInfo.length > 0) {
            doc.fontSize(10).font('Helvetica').text(contactInfo.join(' | '), { align: 'center' });
          }

          const linksInfo: string[] = [];
          if (linkedin) linksInfo.push(linkedin);
          if (github) linksInfo.push(github);
          if (website) linksInfo.push(website);

          if (linksInfo.length > 0) {
            doc.fontSize(9).fillColor('blue').text(linksInfo.join(' | '), { align: 'center', link: linksInfo[0] });
            doc.fillColor('black');
          }

          doc.moveDown(1);
        }

        // Summary
        if (resume.content.summary) {
          doc.fontSize(14).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
          doc.moveDown(0.3);
          doc.fontSize(10).font('Helvetica').text(resume.content.summary);
          doc.moveDown(1);
        }

        // Experience
        if (resume.content.experience && resume.content.experience.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('WORK EXPERIENCE');
          doc.moveDown(0.5);

          for (const exp of resume.content.experience) {
            doc.fontSize(12).font('Helvetica-Bold').text(exp.position);
            doc.fontSize(11).font('Helvetica-Bold').text(exp.company);

            const expDetails: string[] = [];
            if (exp.location) expDetails.push(exp.location);
            if (exp.startDate) {
              const dateRange = exp.current
                ? `${this.formatDate(exp.startDate)} - Present`
                : `${this.formatDate(exp.startDate)} - ${this.formatDate(exp.endDate)}`;
              expDetails.push(dateRange);
            }

            if (expDetails.length > 0) {
              doc.fontSize(9).font('Helvetica').text(expDetails.join(' | '));
            }

            doc.moveDown(0.3);

            if (exp.description) {
              doc.fontSize(10).font('Helvetica').text(exp.description);
            }

            if (exp.achievements && exp.achievements.length > 0) {
              doc.moveDown(0.2);
              exp.achievements.forEach((achievement: string) => {
                doc.fontSize(10).font('Helvetica').text(`• ${achievement}`, { indent: 20 });
              });
            }

            doc.moveDown(0.8);
          }
        }

        // Education
        if (resume.content.education && resume.content.education.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('EDUCATION');
          doc.moveDown(0.5);

          for (const edu of resume.content.education) {
            doc.fontSize(11).font('Helvetica-Bold').text(`${edu.degree} in ${edu.field}`);
            doc.fontSize(10).font('Helvetica').text(edu.institution);

            const eduDetails: string[] = [];
            if (edu.location) eduDetails.push(edu.location);
            if (edu.startDate && edu.endDate) {
              eduDetails.push(`${this.formatDate(edu.startDate)} - ${this.formatDate(edu.endDate)}`);
            }
            if (edu.gpa) eduDetails.push(`GPA: ${edu.gpa}`);

            if (eduDetails.length > 0) {
              doc.fontSize(9).font('Helvetica').text(eduDetails.join(' | '));
            }

            doc.moveDown(0.8);
          }
        }

        // Skills
        if (resume.content.skills) {
          const skills = resume.content.skills;
          const hasSkills = skills.technical?.length || skills.soft?.length || skills.languages?.length || skills.tools?.length;

          if (hasSkills) {
            doc.fontSize(14).font('Helvetica-Bold').text('SKILLS');
            doc.moveDown(0.5);

            if (skills.technical && skills.technical.length > 0) {
              doc.fontSize(11).font('Helvetica-Bold').text('Technical:');
              doc.fontSize(10).font('Helvetica').text(skills.technical.join(', '), { indent: 20 });
              doc.moveDown(0.5);
            }

            if (skills.soft && skills.soft.length > 0) {
              doc.fontSize(11).font('Helvetica-Bold').text('Soft Skills:');
              doc.fontSize(10).font('Helvetica').text(skills.soft.join(', '), { indent: 20 });
              doc.moveDown(0.5);
            }

            if (skills.languages && skills.languages.length > 0) {
              doc.fontSize(11).font('Helvetica-Bold').text('Programming Languages:');
              doc.fontSize(10).font('Helvetica').text(skills.languages.join(', '), { indent: 20 });
              doc.moveDown(0.5);
            }

            if (skills.tools && skills.tools.length > 0) {
              doc.fontSize(11).font('Helvetica-Bold').text('Tools:');
              doc.fontSize(10).font('Helvetica').text(skills.tools.join(', '), { indent: 20 });
              doc.moveDown(0.5);
            }

            doc.moveDown(0.5);
          }
        }

        // Projects
        if (resume.content.projects && resume.content.projects.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('PROJECTS');
          doc.moveDown(0.5);

          for (const project of resume.content.projects) {
            doc.fontSize(11).font('Helvetica-Bold').text(project.name);

            if (project.technologies && project.technologies.length > 0) {
              doc.fontSize(9).font('Helvetica').text(`Technologies: ${project.technologies.join(', ')}`);
            }

            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica').text(project.description);

            doc.moveDown(0.8);
          }
        }

        // Certifications
        if (resume.content.certifications && resume.content.certifications.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('CERTIFICATIONS');
          doc.moveDown(0.5);

          for (const cert of resume.content.certifications) {
            doc.fontSize(10).font('Helvetica-Bold').text(cert.name);
            doc.fontSize(9).font('Helvetica').text(`${cert.issuer} - ${this.formatDate(cert.date)}`);
            doc.moveDown(0.5);
          }
        }

        // Languages
        if (resume.content.languages && resume.content.languages.length > 0) {
          doc.fontSize(14).font('Helvetica-Bold').text('LANGUAGES');
          doc.moveDown(0.5);

          const langText = resume.content.languages
            .map(lang => `${lang.language} (${lang.proficiency})`)
            .join(', ');

          doc.fontSize(10).font('Helvetica').text(langText);
        }

        doc.end();
      } catch (error) {
        this.logger.error(`Failed to generate PDF: ${error.message}`);
        reject(error);
      }
    });
  }

  /**
   * Generate DOCX from resume data
   */
  async generateDocx(resume: Resume): Promise<Buffer> {
    try {
      const sections: any[] = [];

      // Header
      if (resume.content.personalInfo) {
        const { fullName, email, phone, address, linkedin, github, website } = resume.content.personalInfo;

        sections.push(
          new Paragraph({
            text: fullName || '',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          })
        );

        const contactInfo: string[] = [];
        if (email) contactInfo.push(email);
        if (phone) contactInfo.push(phone);
        if (address) contactInfo.push(address);

        if (contactInfo.length > 0) {
          sections.push(
            new Paragraph({
              text: contactInfo.join(' | '),
              alignment: AlignmentType.CENTER,
            })
          );
        }

        const linksInfo: string[] = [];
        if (linkedin) linksInfo.push(linkedin);
        if (github) linksInfo.push(github);
        if (website) linksInfo.push(website);

        if (linksInfo.length > 0) {
          sections.push(
            new Paragraph({
              text: linksInfo.join(' | '),
              alignment: AlignmentType.CENTER,
            })
          );
        }

        sections.push(new Paragraph({ text: '' }));
      }

      // Summary
      if (resume.content.summary) {
        sections.push(
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2,
          })
        );
        sections.push(
          new Paragraph({
            text: resume.content.summary,
          })
        );
        sections.push(new Paragraph({ text: '' }));
      }

      // Experience
      if (resume.content.experience && resume.content.experience.length > 0) {
        sections.push(
          new Paragraph({
            text: 'WORK EXPERIENCE',
            heading: HeadingLevel.HEADING_2,
          })
        );

        for (const exp of resume.content.experience) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.position,
                  bold: true,
                }),
              ],
            })
          );

          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.company,
                  bold: true,
                }),
              ],
            })
          );

          const expDetails: string[] = [];
          if (exp.location) expDetails.push(exp.location);
          if (exp.startDate) {
            const dateRange = exp.current
              ? `${this.formatDate(exp.startDate)} - Present`
              : `${this.formatDate(exp.startDate)} - ${this.formatDate(exp.endDate)}`;
            expDetails.push(dateRange);
          }

          if (expDetails.length > 0) {
            sections.push(
              new Paragraph({
                text: expDetails.join(' | '),
              })
            );
          }

          if (exp.description) {
            sections.push(
              new Paragraph({
                text: exp.description,
              })
            );
          }

          if (exp.achievements && exp.achievements.length > 0) {
            exp.achievements.forEach((achievement: string) => {
              sections.push(
                new Paragraph({
                  text: `• ${achievement}`,
                })
              );
            });
          }

          sections.push(new Paragraph({ text: '' }));
        }
      }

      // Education
      if (resume.content.education && resume.content.education.length > 0) {
        sections.push(
          new Paragraph({
            text: 'EDUCATION',
            heading: HeadingLevel.HEADING_2,
          })
        );

        for (const edu of resume.content.education) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${edu.degree} in ${edu.field}`,
                  bold: true,
                }),
              ],
            })
          );

          sections.push(
            new Paragraph({
              text: edu.institution,
            })
          );

          const eduDetails: string[] = [];
          if (edu.location) eduDetails.push(edu.location);
          if (edu.startDate && edu.endDate) {
            eduDetails.push(`${this.formatDate(edu.startDate)} - ${this.formatDate(edu.endDate)}`);
          }
          if (edu.gpa) eduDetails.push(`GPA: ${edu.gpa}`);

          if (eduDetails.length > 0) {
            sections.push(
              new Paragraph({
                text: eduDetails.join(' | '),
              })
            );
          }

          sections.push(new Paragraph({ text: '' }));
        }
      }

      // Skills
      if (resume.content.skills) {
        const skills = resume.content.skills;
        const hasSkills = skills.technical?.length || skills.soft?.length || skills.languages?.length || skills.tools?.length;

        if (hasSkills) {
          sections.push(
            new Paragraph({
              text: 'SKILLS',
              heading: HeadingLevel.HEADING_2,
            })
          );

          if (skills.technical && skills.technical.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: 'Technical: ', bold: true }),
                  new TextRun({ text: skills.technical.join(', ') }),
                ],
              })
            );
          }

          if (skills.soft && skills.soft.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: 'Soft Skills: ', bold: true }),
                  new TextRun({ text: skills.soft.join(', ') }),
                ],
              })
            );
          }

          if (skills.languages && skills.languages.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: 'Programming Languages: ', bold: true }),
                  new TextRun({ text: skills.languages.join(', ') }),
                ],
              })
            );
          }

          if (skills.tools && skills.tools.length > 0) {
            sections.push(
              new Paragraph({
                children: [
                  new TextRun({ text: 'Tools: ', bold: true }),
                  new TextRun({ text: skills.tools.join(', ') }),
                ],
              })
            );
          }

          sections.push(new Paragraph({ text: '' }));
        }
      }

      // Projects
      if (resume.content.projects && resume.content.projects.length > 0) {
        sections.push(
          new Paragraph({
            text: 'PROJECTS',
            heading: HeadingLevel.HEADING_2,
          })
        );

        for (const project of resume.content.projects) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: project.name,
                  bold: true,
                }),
              ],
            })
          );

          if (project.technologies && project.technologies.length > 0) {
            sections.push(
              new Paragraph({
                text: `Technologies: ${project.technologies.join(', ')}`,
              })
            );
          }

          sections.push(
            new Paragraph({
              text: project.description,
            })
          );

          sections.push(new Paragraph({ text: '' }));
        }
      }

      // Certifications
      if (resume.content.certifications && resume.content.certifications.length > 0) {
        sections.push(
          new Paragraph({
            text: 'CERTIFICATIONS',
            heading: HeadingLevel.HEADING_2,
          })
        );

        for (const cert of resume.content.certifications) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cert.name,
                  bold: true,
                }),
              ],
            })
          );

          sections.push(
            new Paragraph({
              text: `${cert.issuer} - ${this.formatDate(cert.date)}`,
            })
          );
        }

        sections.push(new Paragraph({ text: '' }));
      }

      // Languages
      if (resume.content.languages && resume.content.languages.length > 0) {
        sections.push(
          new Paragraph({
            text: 'LANGUAGES',
            heading: HeadingLevel.HEADING_2,
          })
        );

        const langText = resume.content.languages
          .map(lang => `${lang.language} (${lang.proficiency})`)
          .join(', ');

        sections.push(
          new Paragraph({
            text: langText,
          })
        );
      }

      const doc = new Document({
        sections: [
          {
            children: sections,
          },
        ],
      });

      return await Packer.toBuffer(doc);
    } catch (error) {
      this.logger.error(`Failed to generate DOCX: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate JSON from resume data
   */
  generateJson(resume: Resume): string {
    return JSON.stringify(resume, null, 2);
  }

  /**
   * Format date to readable format
   */
  private formatDate(dateString?: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  }
}
