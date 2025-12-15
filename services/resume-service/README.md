# Resume Service

Resume creation, management, and parsing microservice for ApplyForUs AI Platform.

## Overview

The Resume Service handles all resume-related operations including CRUD operations, resume parsing from PDF/DOCX files, AI-powered optimization, version management, and export functionality.

## Features

- Resume CRUD operations
- Resume parsing (PDF, DOCX to structured data)
- AI-powered resume optimization
- Multiple resume versions
- Resume export (PDF, DOCX, TXT, JSON)
- Template management
- Resume sharing and public links
- Cover letter generation

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (via TypeORM)
- **Storage**: AWS S3 (resume files)
- **Parsing**: Python libraries, AI Service

## API Endpoints

### Resume CRUD

- `POST /api/v1/resumes` - Create resume
- `GET /api/v1/resumes` - List user resumes
- `GET /api/v1/resumes/:id` - Get resume by ID
- `PATCH /api/v1/resumes/:id` - Update resume
- `DELETE /api/v1/resumes/:id` - Delete resume

### Resume Operations

- `POST /api/v1/resumes/parse` - Upload and parse resume file
- `POST /api/v1/resumes/:id/optimize` - Get AI optimization suggestions
- `GET /api/v1/resumes/:id/export` - Export resume in various formats
- `POST /api/v1/resumes/:id/duplicate` - Duplicate resume
- `GET /api/v1/resumes/:id/versions` - Get version history

### Templates

- `GET /api/v1/resumes/templates` - List available templates
- `GET /api/v1/resumes/templates/:id` - Get template details

## Environment Variables

```bash
PORT=8003
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5434/applyforus
REDIS_URL=redis://localhost:6381

# AWS S3
AWS_S3_BUCKET=applyforus-resumes
AWS_S3_RESUMES_PREFIX=resumes/
AWS_S3_PARSED_PREFIX=parsed-resumes/

# AI Service
AI_SERVICE_URL=http://localhost:8000/api/v1

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Versioning
ENABLE_VERSION_CONTROL=true
MAX_VERSIONS_PER_RESUME=10
```

## Getting Started

```bash
pnpm install
pnpm migration:run
pnpm dev
```

## Resume Structure

```typescript
interface Resume {
  id: string;
  userId: string;
  title: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    portfolio?: string;
  };
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications?: Certification[];
  languages?: Language[];
  customSections?: CustomSection[];
}
```

## Support

Email: dev@applyforus.ai
