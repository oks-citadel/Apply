import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Resume } from './entities/resume.entity';
import { ResumeVersion } from './entities/resume-version.entity';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { ParserService } from '../parser/parser.service';

@Injectable()
export class ResumesService {
  private readonly logger = new Logger(ResumesService.name);

  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepository: Repository<Resume>,
    @InjectRepository(ResumeVersion)
    private readonly versionRepository: Repository<ResumeVersion>,
    private readonly parserService: ParserService,
  ) {}

  async create(userId: string, createResumeDto: CreateResumeDto): Promise<Resume> {
    this.logger.log(`Creating resume for user ${userId}`);

    // If setting as primary, unset other primary resumes
    if (createResumeDto.isPrimary) {
      await this.unsetPrimaryResumes(userId);
    }

    const resume = this.resumeRepository.create({
      ...createResumeDto,
      userId,
      content: createResumeDto.content || {},
      version: 1,
    });

    const savedResume = await this.resumeRepository.save(resume);

    // Create initial version
    await this.createVersion(savedResume, userId, 'Initial version');

    return savedResume;
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ resumes: Resume[]; total: number }> {
    const [resumes, total] = await this.resumeRepository.findAndCount({
      where: { userId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['template'],
    });

    return { resumes, total };
  }

  async findOne(id: string, userId: string): Promise<Resume> {
    const resume = await this.resumeRepository.findOne({
      where: { id, userId, deletedAt: IsNull() },
      relations: ['template'],
    });

    if (!resume) {
      throw new NotFoundException(`Resume with ID ${id} not found`);
    }

    return resume;
  }

  async update(
    id: string,
    userId: string,
    updateResumeDto: UpdateResumeDto,
  ): Promise<Resume> {
    const resume = await this.findOne(id, userId);

    // If setting as primary, unset other primary resumes
    if (updateResumeDto.isPrimary && !resume.isPrimary) {
      await this.unsetPrimaryResumes(userId);
    }

    // Increment version if content changed
    if (updateResumeDto.content) {
      resume.version += 1;
      await this.createVersion(
        { ...resume, content: updateResumeDto.content },
        userId,
        'Content updated',
      );
    }

    Object.assign(resume, updateResumeDto);
    return await this.resumeRepository.save(resume);
  }

  async remove(id: string, userId: string): Promise<void> {
    const resume = await this.findOne(id, userId);

    // Soft delete
    resume.deletedAt = new Date();
    await this.resumeRepository.save(resume);

    this.logger.log(`Resume ${id} soft deleted by user ${userId}`);
  }

  async duplicate(id: string, userId: string): Promise<Resume> {
    const original = await this.findOne(id, userId);

    const duplicate = this.resumeRepository.create({
      userId,
      title: `${original.title} (Copy)`,
      templateId: original.templateId,
      content: original.content,
      isPrimary: false,
      version: 1,
    });

    const savedDuplicate = await this.resumeRepository.save(duplicate);

    // Create initial version for duplicate
    await this.createVersion(savedDuplicate, userId, 'Duplicated from original');

    this.logger.log(`Resume ${id} duplicated as ${savedDuplicate.id}`);

    return savedDuplicate;
  }

  async setPrimary(id: string, userId: string): Promise<Resume> {
    const resume = await this.findOne(id, userId);

    // Unset all other primary resumes
    await this.unsetPrimaryResumes(userId);

    resume.isPrimary = true;
    return await this.resumeRepository.save(resume);
  }

  async importFromFile(
    userId: string,
    file: Express.Multer.File,
    title?: string,
  ): Promise<Resume> {
    this.logger.log(`Importing resume from file for user ${userId}`);

    let parsedContent;

    try {
      if (file.mimetype === 'application/pdf') {
        parsedContent = await this.parserService.parsePdf(file.buffer);
      } else if (
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        parsedContent = await this.parserService.parseDocx(file.buffer);
      } else {
        throw new BadRequestException('Unsupported file type. Only PDF and DOCX are supported.');
      }
    } catch (error) {
      this.logger.error(`Failed to parse file: ${error.message}`);
      throw new BadRequestException('Failed to parse resume file');
    }

    const resume = this.resumeRepository.create({
      userId,
      title: title || file.originalname.replace(/\.[^/.]+$/, ''),
      content: parsedContent,
      originalFilename: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      version: 1,
    });

    const savedResume = await this.resumeRepository.save(resume);

    // Create initial version
    await this.createVersion(savedResume, userId, 'Imported from file');

    return savedResume;
  }

  async getVersions(resumeId: string, userId: string): Promise<ResumeVersion[]> {
    // Verify ownership
    await this.findOne(resumeId, userId);

    return await this.versionRepository.find({
      where: { resumeId },
      order: { version: 'DESC' },
    });
  }

  async restoreVersion(
    resumeId: string,
    versionNumber: number,
    userId: string,
  ): Promise<Resume> {
    const resume = await this.findOne(resumeId, userId);

    const version = await this.versionRepository.findOne({
      where: { resumeId, version: versionNumber },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found`);
    }

    resume.content = version.content;
    resume.version += 1;

    await this.createVersion(resume, userId, `Restored from version ${versionNumber}`);

    return await this.resumeRepository.save(resume);
  }

  private async unsetPrimaryResumes(userId: string): Promise<void> {
    await this.resumeRepository.update(
      { userId, isPrimary: true },
      { isPrimary: false },
    );
  }

  private async createVersion(
    resume: Resume,
    changedBy: string,
    changeDescription: string,
  ): Promise<ResumeVersion> {
    const version = this.versionRepository.create({
      resumeId: resume.id,
      version: resume.version,
      content: resume.content,
      changedBy,
      changeDescription,
    });

    return await this.versionRepository.save(version);
  }

  async calculateAtsScore(resumeId: string, userId: string): Promise<number> {
    const resume = await this.findOne(resumeId, userId);

    // Placeholder ATS scoring logic
    // In production, this would call AI service for analysis
    let score = 0;

    // Check for key sections (40 points)
    if (resume.content.personalInfo?.email) score += 5;
    if (resume.content.personalInfo?.phone) score += 5;
    if (resume.content.summary) score += 10;
    if (resume.content.experience && resume.content.experience.length > 0) score += 10;
    if (resume.content.education && resume.content.education.length > 0) score += 10;

    // Check for skills (20 points)
    if (resume.content.skills?.technical && resume.content.skills.technical.length > 0) {
      score += 10;
    }
    if (resume.content.skills?.soft && resume.content.skills.soft.length > 0) {
      score += 10;
    }

    // Check for additional sections (20 points)
    if (resume.content.certifications && resume.content.certifications.length > 0) {
      score += 10;
    }
    if (resume.content.projects && resume.content.projects.length > 0) score += 10;

    // Quality checks (20 points)
    if (resume.content.experience) {
      const hasAchievements = resume.content.experience.some(
        (exp) => exp.achievements && exp.achievements.length > 0,
      );
      if (hasAchievements) score += 10;
    }

    if (resume.content.personalInfo?.linkedin) score += 5;
    if (resume.content.personalInfo?.github || resume.content.personalInfo?.website) {
      score += 5;
    }

    resume.atsScore = Math.min(score, 100);
    await this.resumeRepository.save(resume);

    return resume.atsScore;
  }
}
