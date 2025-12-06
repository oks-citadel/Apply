# Resume Service - Quick Start Guide

## What Has Been Implemented

### ✅ Complete Implementation
1. **ParserService** (`src/modules/parser/parser.service.ts`)
   - PDF parsing with `pdf-parse`
   - DOCX parsing with `mammoth`
   - Intelligent text extraction and structuring

2. **ExportService** (`src/modules/export/export.service.ts`)
   - PDF generation with `pdfkit`
   - DOCX generation with `docx` library
   - JSON export
   - Professional formatting

3. **Modules**
   - ParserModule
   - ExportModule

### ⚠️ Needs Manual Updates
See `UPDATED_FILES_REFERENCE.md` for complete code. Key changes:
- Entity: `isPrimary` → `isDefault`, `title` → `name`
- DTOs: Update field names
- Service: Rename methods, add search support
- Controller: Add parse endpoint, update export route

## Installation

```bash
cd services/resume-service

# Install dependencies (if not already done)
npm install

# Dependencies are already in package.json:
# - pdf-parse, mammoth, pdfkit, docx, multer
```

## Manual File Updates Required

### Step 1: Update Entity
Edit `src/modules/resumes/entities/resume.entity.ts`:
- Copy content from `UPDATED_FILES_REFERENCE.md` File 1

### Step 2: Update DTOs
Edit these files with content from `UPDATED_FILES_REFERENCE.md`:
- `src/modules/resumes/dto/create-resume.dto.ts` (File 2)
- `src/modules/resumes/dto/resume-response.dto.ts` (File 3)

### Step 3: Update Service
Edit `src/modules/resumes/resumes.service.ts`:
- Add search parameter to `findAll`
- Rename `setPrimary` → `setDefault`
- Rename `unsetPrimaryResumes` → `unsetDefaultResumes`
- Update `calculateAtsScore` signature and implementation
- Replace all `isPrimary` with `isDefault`
- Replace all `title` with `name`

See File 4 in `UPDATED_FILES_REFERENCE.md` for specific methods.

### Step 4: Update Controller
Edit `src/modules/resumes/resumes.controller.ts`:

Add imports:
```typescript
import { Patch } from '@nestjs/common';
import { ParserService } from '../parser/parser.service';
```

Update constructor:
```typescript
constructor(
  private readonly resumesService: ResumesService,
  private readonly exportService: ExportService,
  private readonly parserService: ParserService,
) {}
```

Key changes:
- `/resumes/:id/set-primary` → PATCH `/resumes/:id/set-default`
- `/resumes/:id/export/:format` → GET `/resumes/:id/export?format=pdf`
- Add POST `/resumes/parse` endpoint
- Add `search` query param to GET `/resumes`
- Update ATS score endpoint to accept job description

### Step 5: Database Migration

Create migration file `src/migrations/[timestamp]-RenameResumeFields.ts`:

```bash
# Generate timestamp
npm run migration:create -- src/migrations/RenameResumeFields
```

Use content from `UPDATED_FILES_REFERENCE.md` (Database Migration section).

Or manually create migration:
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameResumeFields[TIMESTAMP] implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('resumes', 'title', 'name');
    await queryRunner.renameColumn('resumes', 'is_primary', 'is_default');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('resumes', 'name', 'title');
    await queryRunner.renameColumn('resumes', 'is_default', 'is_primary');
  }
}
```

Run migration:
```bash
npm run migration:run
```

## Configuration

Create `.env` file if not exists:

```env
NODE_ENV=development
PORT=3004

# Database
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=jobpilot

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Service
SERVICE_VERSION=1.0.0
```

## Running the Service

```bash
# Development mode with hot reload
npm run dev

# Or standard start
npm start

# Build for production
npm run build
npm run start:prod
```

The service will start on `http://localhost:3004` (or your configured PORT).

## Testing Endpoints

### Using cURL

1. **Create Resume**
```bash
curl -X POST http://localhost:3004/resumes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Software Engineer Resume",
    "template": "modern",
    "content": {
      "personalInfo": {
        "fullName": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890"
      }
    }
  }'
```

2. **List Resumes**
```bash
curl -X GET "http://localhost:3004/resumes?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **Get Single Resume**
```bash
curl -X GET http://localhost:3004/resumes/{RESUME_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

4. **Update Resume**
```bash
curl -X PUT http://localhost:3004/resumes/{RESUME_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Resume Name",
    "content": {...}
  }'
```

5. **Delete Resume**
```bash
curl -X DELETE http://localhost:3004/resumes/{RESUME_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

6. **Duplicate Resume**
```bash
curl -X POST http://localhost:3004/resumes/{RESUME_ID}/duplicate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

7. **Set Default Resume**
```bash
curl -X PATCH http://localhost:3004/resumes/{RESUME_ID}/set-default \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

8. **Export Resume**
```bash
# Export as PDF
curl -X GET "http://localhost:3004/resumes/{RESUME_ID}/export?format=pdf" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output resume.pdf

# Export as DOCX
curl -X GET "http://localhost:3004/resumes/{RESUME_ID}/export?format=docx" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output resume.docx
```

9. **Import Resume from File**
```bash
curl -X POST http://localhost:3004/resumes/import \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/resume.pdf"
```

10. **Parse Resume File**
```bash
curl -X POST http://localhost:3004/resumes/parse \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/resume.pdf"
```

11. **Calculate ATS Score**
```bash
curl -X POST http://localhost:3004/resumes/{RESUME_ID}/ats-score \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "We are looking for a senior software engineer with experience in Node.js, TypeScript, React..."
  }'
```

### Using Postman or Insomnia

Import this collection:

**Base URL:** `http://localhost:3004`

**Headers (Global):**
- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Endpoints:**
1. GET `/resumes` - List resumes
2. POST `/resumes` - Create resume
3. GET `/resumes/:id` - Get resume
4. PUT `/resumes/:id` - Update resume
5. DELETE `/resumes/:id` - Delete resume
6. POST `/resumes/:id/duplicate` - Duplicate
7. PATCH `/resumes/:id/set-default` - Set default
8. GET `/resumes/:id/export?format=pdf` - Export
9. POST `/resumes/import` - Import (multipart/form-data)
10. POST `/resumes/parse` - Parse (multipart/form-data)
11. POST `/resumes/:id/ats-score` - ATS Score

## Swagger Documentation

Once running, access interactive API docs at:
```
http://localhost:3004/api/docs
```

## Troubleshooting

### Issue: Migration fails
**Solution:** Check database connection and ensure PostgreSQL is running on port 5434

### Issue: PDF/DOCX generation fails
**Solution:** Ensure all dependencies are installed: `npm install`

### Issue: File upload fails
**Solution:** Check file size (max 10MB) and format (PDF/DOCX only)

### Issue: Authentication fails
**Solution:** Ensure JWT token is valid and includes userId claim

### Issue: Database connection fails
**Solution:** Verify PostgreSQL is running and credentials in `.env` are correct

```bash
# Test database connection
psql -h localhost -p 5434 -U postgres -d jobpilot
```

## Next Steps

1. ✅ Complete manual file updates (see UPDATED_FILES_REFERENCE.md)
2. ✅ Run database migration
3. ✅ Start the service
4. ✅ Test all endpoints
5. ✅ Integrate with frontend
6. 🔄 Consider enhancing ATS score with AI service
7. 🔄 Add more resume templates
8. 🔄 Implement resume analytics

## File Structure

```
services/resume-service/
├── src/
│   ├── modules/
│   │   ├── resumes/
│   │   │   ├── entities/
│   │   │   │   ├── resume.entity.ts ⚠️ UPDATE
│   │   │   │   └── resume-version.entity.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-resume.dto.ts ⚠️ UPDATE
│   │   │   │   ├── update-resume.dto.ts ⚠️ UPDATE
│   │   │   │   └── resume-response.dto.ts ⚠️ UPDATE
│   │   │   ├── resumes.controller.ts ⚠️ UPDATE
│   │   │   ├── resumes.service.ts ⚠️ UPDATE
│   │   │   └── resumes.module.ts
│   │   ├── parser/
│   │   │   ├── parser.service.ts ✅ NEW
│   │   │   └── parser.module.ts ✅ NEW
│   │   └── export/
│   │       ├── export.service.ts ✅ NEW
│   │       └── export.module.ts ✅ NEW
│   ├── migrations/
│   │   └── [timestamp]-RenameResumeFields.ts ⚠️ CREATE
│   ├── config/
│   ├── common/
│   └── main.ts
├── IMPLEMENTATION_SUMMARY.md ✅ NEW
├── UPDATED_FILES_REFERENCE.md ✅ NEW
├── QUICK_START_GUIDE.md ✅ NEW (this file)
└── package.json

Legend:
✅ NEW - Already created, no action needed
⚠️ UPDATE - Needs manual updates
⚠️ CREATE - Needs to be created
```

## Support

For issues or questions:
1. Check IMPLEMENTATION_SUMMARY.md for detailed explanations
2. Review UPDATED_FILES_REFERENCE.md for complete code
3. Verify environment variables
4. Check logs for detailed error messages
