# Complete Updated File Reference

This document contains the complete, updated versions of files that need manual changes.

## File 1: Updated Resume Entity

**Path:** `src/modules/resumes/entities/resume.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Template } from '../../templates/entities/template.entity';
import { ResumeVersion } from './resume-version.entity';

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description: string;
  highlights: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft' | 'language' | 'tool' | 'other';
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'basic' | 'conversational' | 'professional' | 'native';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  github?: string;
  startDate: string;
  endDate?: string;
  highlights: string[];
}

export interface ResumeContent {
  personalInfo?: PersonalInfo;
  summary?: string;
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  languages?: Language[];
  projects?: Project[];
}

@Entity('resumes')
@Index(['userId', 'createdAt'])
@Index(['userId', 'isDefault'])
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'template', type: 'varchar', length: 50, default: 'modern' })
  template: string;

  @Column({ type: 'jsonb', default: {} })
  content: ResumeContent;

  @Column({ name: 'ats_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  atsScore: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  @Index()
  isDefault: boolean;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ name: 'file_path', type: 'varchar', length: 500, nullable: true })
  filePath: string;

  @Column({ name: 'original_filename', type: 'varchar', length: 255, nullable: true })
  originalFilename: string;

  @Column({ name: 'file_type', type: 'varchar', length: 50, nullable: true })
  fileType: string;

  @Column({ name: 'file_size', type: 'int', nullable: true })
  fileSize: number;

  @OneToMany(() => ResumeVersion, (version) => version.resume)
  versions: ResumeVersion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  // Computed property for applications count
  applications?: number;
}
```

## File 2: Updated Create Resume DTO

**Path:** `src/modules/resumes/dto/create-resume.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ResumeContent } from '../entities/resume.entity';

export class CreateResumeDto {
  @ApiProperty({
    description: 'Resume name',
    example: 'Senior Software Engineer Resume',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Template to use',
    example: 'modern',
  })
  @IsOptional()
  @IsString()
  template?: string;

  @ApiPropertyOptional({
    description: 'Resume content in structured format',
    type: 'object',
  })
  @IsOptional()
  @IsObject()
  content?: ResumeContent;

  @ApiPropertyOptional({
    description: 'Set as default resume',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
```

## File 3: Updated Resume Response DTO

**Path:** `src/modules/resumes/dto/resume-response.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { ResumeContent } from '../entities/resume.entity';

@Exclude()
export class ResumeResponseDto {
  @Expose()
  @ApiProperty({ description: 'Resume ID' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @Expose()
  @ApiProperty({ description: 'Resume name' })
  name: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Template name' })
  template?: string;

  @Expose()
  @ApiProperty({ description: 'Resume content', type: 'object' })
  content: ResumeContent;

  @Expose()
  @ApiPropertyOptional({ description: 'ATS Score' })
  atsScore?: number;

  @Expose()
  @ApiProperty({ description: 'Is default resume' })
  isDefault: boolean;

  @Expose()
  @ApiProperty({ description: 'Version number' })
  version: number;

  @Expose()
  @ApiPropertyOptional({ description: 'File path' })
  filePath?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Original filename' })
  originalFilename?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'File type' })
  fileType?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'File size in bytes' })
  fileSize?: number;

  @Expose()
  @ApiProperty({ description: 'Created at' })
  @Type(() => Date)
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Updated at' })
  @Type(() => Date)
  updatedAt: Date;

  @Expose()
  @ApiPropertyOptional({ description: 'Number of applications using this resume' })
  applications?: number;
}

export class ResumeListResponseDto {
  @ApiProperty({ type: [ResumeResponseDto] })
  resumes: ResumeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
```

## File 4: Key Service Method Updates

**Path:** `src/modules/resumes/resumes.service.ts`

Add/update these methods:

```typescript
// Update findAll to support search
async findAll(
  userId: string,
  page: number = 1,
  limit: number = 10,
  search?: string,
): Promise<{ resumes: Resume[]; total: number }> {
  const queryBuilder = this.resumeRepository
    .createQueryBuilder('resume')
    .where('resume.userId = :userId', { userId })
    .andWhere('resume.deletedAt IS NULL');

  if (search) {
    queryBuilder.andWhere(
      '(resume.name ILIKE :search OR resume.content::text ILIKE :search)',
      { search: `%${search}%` }
    );
  }

  const [resumes, total] = await queryBuilder
    .orderBy('resume.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return { resumes, total };
}

// Rename setPrimary to setDefault
async setDefault(id: string, userId: string): Promise<Resume> {
  const resume = await this.findOne(id, userId);

  // Unset all other default resumes
  await this.unsetDefaultResumes(userId);

  resume.isDefault = true;
  return await this.resumeRepository.save(resume);
}

// Rename helper method
private async unsetDefaultResumes(userId: string): Promise<void> {
  await this.resumeRepository.update(
    { userId, isDefault: true },
    { isDefault: false },
  );
}

// Update calculateAtsScore to return full score object
async calculateAtsScore(resumeId: string, userId: string, jobDescription?: string): Promise<any> {
  const resume = await this.findOne(resumeId, userId);

  let score = 0;
  let maxScore = 100;
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  const feedback: any[] = [];

  // Check for key sections (40 points)
  let structureScore = 0;
  if (resume.content.personalInfo?.email) structureScore += 5;
  if (resume.content.personalInfo?.phone) structureScore += 5;
  if (resume.content.summary) structureScore += 10;
  if (resume.content.experience && resume.content.experience.length > 0) structureScore += 10;
  if (resume.content.education && resume.content.education.length > 0) structureScore += 10;
  score += structureScore;

  feedback.push({
    category: 'Structure',
    score: structureScore,
    suggestions: structureScore < 40 ? ['Add missing sections like contact info, summary, experience, or education'] : [],
  });

  // Check for skills (20 points)
  const skillScore = Math.min((resume.content.skills?.length || 0) * 2, 20);
  score += skillScore;

  feedback.push({
    category: 'Skills',
    score: skillScore,
    suggestions: skillScore < 20 ? ['Add more relevant skills'] : [],
  });

  // Keyword matching with job description
  if (jobDescription) {
    const jobKeywords = jobDescription.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const resumeText = JSON.stringify(resume.content).toLowerCase();

    jobKeywords.forEach(keyword => {
      if (resumeText.includes(keyword)) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });

    const keywordScore = (matchedKeywords.length / Math.max(jobKeywords.length, 1)) * 20;
    score += keywordScore;

    feedback.push({
      category: 'Keyword Match',
      score: Math.round(keywordScore),
      suggestions: missingKeywords.length > 0 ? [`Consider adding: ${missingKeywords.slice(0, 5).join(', ')}`] : [],
    });
  }

  // Quality checks (20 points)
  let qualityScore = 0;
  if (resume.content.experience) {
    const hasHighlights = resume.content.experience.some(
      (exp) => exp.highlights && exp.highlights.length > 0,
    );
    if (hasHighlights) qualityScore += 10;
  }

  if (resume.content.personalInfo?.linkedin) qualityScore += 5;
  if (resume.content.personalInfo?.github || resume.content.personalInfo?.portfolio) qualityScore += 5;
  score += qualityScore;

  feedback.push({
    category: 'Quality',
    score: qualityScore,
    suggestions: qualityScore < 20 ? ['Add achievements and professional links'] : [],
  });

  const percentage = Math.round((score / maxScore) * 100);

  resume.atsScore = percentage;
  await this.resumeRepository.save(resume);

  return {
    score: Math.round(score),
    maxScore,
    percentage,
    feedback,
    missingKeywords: missingKeywords.slice(0, 10),
    matchedKeywords: matchedKeywords.slice(0, 10),
  };
}
```

Also update in create(), update(), and duplicate() methods:
- Change `isPrimary` to `isDefault`
- Change `unsetPrimaryResumes` to `unsetDefaultResumes`
- Change `title` to `name`

## Database Migration

**Create new migration file:** `src/migrations/[timestamp]-RenameResumeFields.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameResumeFields1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename columns
    await queryRunner.renameColumn('resumes', 'title', 'name');
    await queryRunner.renameColumn('resumes', 'is_primary', 'is_default');

    // Drop old index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_userId_isPrimary"`);

    // Create new index
    await queryRunner.query(`CREATE INDEX "IDX_userId_isDefault" ON "resumes" ("user_id", "is_default")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse the changes
    await queryRunner.renameColumn('resumes', 'name', 'title');
    await queryRunner.renameColumn('resumes', 'is_default', 'is_primary');

    // Drop new index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_userId_isDefault"`);

    // Recreate old index
    await queryRunner.query(`CREATE INDEX "IDX_userId_isPrimary" ON "resumes" ("user_id", "is_primary")`);
  }
}
```

## Running the Migration

```bash
cd services/resume-service

# Generate migration (if not created manually)
npm run migration:generate -- -n RenameResumeFields

# Run migration
npm run migration:run

# If needed to rollback
npm run migration:revert
```

## Quick Checklist

- [ ] Update resume.entity.ts interfaces and fields
- [ ] Update create-resume.dto.ts
- [ ] Update resume-response.dto.ts
- [ ] Update update-resume.dto.ts (extends CreateResumeDto, so should inherit changes)
- [ ] Update resumes.service.ts (findAll, setDefault, unsetDefaultResumes, calculateAtsScore)
- [ ] Update resumes.controller.ts (add ParserService, update endpoints)
- [ ] Create and run database migration
- [ ] Test all endpoints
- [ ] Update .env if needed

## Environment Variables

Make sure your `.env` file has:

```env
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=jobpilot
NODE_ENV=development
PORT=3004
JWT_SECRET=your-jwt-secret
```
