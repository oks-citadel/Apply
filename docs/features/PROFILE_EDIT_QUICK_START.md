# Profile Edit - Quick Start Guide

## For Developers

### Running the Implementation

#### 1. Backend Setup

```bash
# Navigate to user service
cd services/user-service

# Install dependencies (if needed)
npm install

# Generate and run migrations
npm run migration:generate -- -n AddProfileSections
npm run migration:run

# Start the service
npm run dev
```

#### 2. Frontend Setup

```bash
# Navigate to web app
cd apps/web

# Install dependencies (if needed)
npm install

# Start the development server
npm run dev
```

#### 3. Access the Profile Page

Navigate to: `http://localhost:3000/dashboard/profile`

### Quick API Reference

#### Base URL
```
http://localhost:3001/api/profile
```

#### Work Experience Endpoints
```bash
# Get all work experiences
GET /profile/work-experience

# Create work experience
POST /profile/work-experience
{
  "company": "Tech Corp",
  "title": "Software Engineer",
  "location": "San Francisco, CA",
  "start_date": "2020-01-01",
  "end_date": "2023-12-31",
  "is_current": false,
  "description": "Description here",
  "achievements": ["Achievement 1", "Achievement 2"]
}

# Update work experience
PUT /profile/work-experience/:id
{
  "title": "Senior Software Engineer"
}

# Delete work experience
DELETE /profile/work-experience/:id
```

#### Education Endpoints
```bash
# Get all education
GET /profile/education

# Create education
POST /profile/education
{
  "school": "University Name",
  "degree": "Bachelor of Science",
  "field_of_study": "Computer Science",
  "start_date": "2016-09-01",
  "end_date": "2020-06-01",
  "gpa": "3.8",
  "activities": "Dean's List, CS Club President"
}

# Update education
PUT /profile/education/:id

# Delete education
DELETE /profile/education/:id
```

#### Skills Endpoints
```bash
# Get all skills
GET /profile/skills

# Create skill
POST /profile/skills
{
  "name": "React",
  "category": "technical",  // technical, soft, language
  "proficiency": "expert"   // beginner, intermediate, advanced, expert
}

# Update skill
PUT /profile/skills/:id

# Delete skill
DELETE /profile/skills/:id
```

#### Certifications Endpoints
```bash
# Get all certifications
GET /profile/certifications

# Create certification
POST /profile/certifications
{
  "name": "AWS Certified Solutions Architect",
  "issuing_organization": "Amazon Web Services",
  "issue_date": "2023-01-15",
  "expiration_date": "2026-01-15",
  "credential_id": "AWS-12345",
  "credential_url": "https://credly.com/badges/12345"
}

# Update certification
PUT /profile/certifications/:id

# Delete certification
DELETE /profile/certifications/:id
```

### Frontend Components Usage

#### Using the Profile Page
```tsx
// Already implemented at /dashboard/profile
// Navigate to see all sections
import ProfilePage from '@/app/(dashboard)/profile/page';
```

#### Using Individual Form Components
```tsx
import { WorkExperienceForm } from '@/components/forms/WorkExperienceForm';
import { EducationForm } from '@/components/forms/EducationForm';
import { SkillsForm } from '@/components/forms/SkillsForm';
import { CertificationsForm } from '@/components/forms/CertificationsForm';

// Example: Work Experience
function MyComponent() {
  const [experiences, setExperiences] = useState([]);

  return (
    <WorkExperienceForm
      experiences={experiences}
      onChange={setExperiences}
      isLoading={false}
    />
  );
}
```

#### Using React Query Hooks
```tsx
import {
  useWorkExperiences,
  useCreateWorkExperience,
  useUpdateWorkExperience,
  useDeleteWorkExperience,
} from '@/hooks/useProfileSections';

function MyComponent() {
  // Fetch work experiences
  const { data: experiences, isLoading } = useWorkExperiences();

  // Create mutation
  const createExperience = useCreateWorkExperience();

  const handleCreate = () => {
    createExperience.mutate({
      company: 'Tech Corp',
      title: 'Engineer',
      // ... other fields
    });
  };

  // Update mutation
  const updateExperience = useUpdateWorkExperience();

  const handleUpdate = (id: string) => {
    updateExperience.mutate({
      id,
      data: { title: 'Senior Engineer' }
    });
  };

  // Delete mutation
  const deleteExperience = useDeleteWorkExperience();

  const handleDelete = (id: string) => {
    deleteExperience.mutate(id);
  };

  return (
    <div>
      {isLoading ? 'Loading...' : experiences?.map(exp => (
        <div key={exp.id}>{exp.company}</div>
      ))}
    </div>
  );
}
```

### Testing the Implementation

#### Manual Testing Checklist

**Basic Profile:**
- [ ] Upload profile photo
- [ ] Update name, email, phone
- [ ] Update bio
- [ ] Save changes successfully

**Work Experience:**
- [ ] Add new work experience
- [ ] Edit existing work experience
- [ ] Delete work experience
- [ ] Toggle "currently working" checkbox
- [ ] Add bullet points in description

**Education:**
- [ ] Add new education entry
- [ ] Edit existing education
- [ ] Delete education
- [ ] Optional fields (GPA, activities) work correctly

**Skills:**
- [ ] Add skills from suggestions
- [ ] Create custom skills
- [ ] Change skill category
- [ ] Set proficiency level
- [ ] Delete skills
- [ ] Skills grouped by category correctly

**Certifications:**
- [ ] Add new certification
- [ ] Edit existing certification
- [ ] Delete certification
- [ ] Optional fields work (credential ID, URL)
- [ ] External link opens correctly

**UI/UX:**
- [ ] Tab navigation works
- [ ] Profile completeness updates
- [ ] Loading states display
- [ ] Success toasts appear
- [ ] Error messages show
- [ ] Responsive on mobile
- [ ] Dark mode works

#### Using Postman/Thunder Client

Import the following into your API client:

```json
{
  "name": "Profile Sections API",
  "item": [
    {
      "name": "Work Experience",
      "item": [
        {
          "name": "Get Work Experiences",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/profile/work-experience"
            }
          }
        }
      ]
    }
  ]
}
```

### Common Issues and Solutions

#### 1. Migration Errors
**Issue:** Migration fails to create tables

**Solution:**
```bash
# Drop and recreate database (dev only!)
npm run migration:revert
npm run migration:run

# Or manually check database schema
```

#### 2. CORS Errors
**Issue:** Frontend can't connect to backend

**Solution:** Check `services/user-service/src/main.ts`:
```typescript
app.enableCors({
  origin: ['http://localhost:3000'],
  credentials: true,
});
```

#### 3. Authentication Errors
**Issue:** 401 Unauthorized responses

**Solution:**
- Ensure JWT token is valid
- Check Authorization header: `Bearer <token>`
- Verify token hasn't expired

#### 4. TypeScript Errors
**Issue:** Type errors in frontend

**Solution:**
```bash
# Rebuild types
cd apps/web
npm run type-check
```

#### 5. React Query Cache Issues
**Issue:** Data not updating after mutation

**Solution:**
```typescript
// Manually invalidate cache
queryClient.invalidateQueries({ queryKey: ['profile-sections'] });
```

### Performance Tips

1. **Lazy Load Images**
   - Profile photos are lazy loaded
   - Use next/image for optimization

2. **Debounce Form Inputs**
   - Don't save on every keystroke
   - Use debounce for autosave features

3. **Pagination for Large Lists**
   - If user has many experiences, consider pagination
   - Current implementation loads all data

4. **Cache Strategy**
   - React Query caches for 5 minutes
   - Adjust `staleTime` if needed

### Security Checklist

- [x] JWT authentication on all endpoints
- [x] User can only access own profile data
- [x] Input validation on backend
- [x] SQL injection protection (TypeORM)
- [x] XSS protection (React escaping)
- [x] File upload validation (size, type)
- [x] HTTPS in production
- [ ] Rate limiting on API endpoints (TODO)
- [ ] CSRF protection (TODO)

### Deployment Checklist

Before deploying to production:

1. **Environment Variables**
   ```bash
   # Backend
   DATABASE_URL=postgresql://...
   JWT_SECRET=...

   # Frontend
   NEXT_PUBLIC_API_URL=https://api.yourapp.com
   NEXT_PUBLIC_USER_SERVICE_URL=https://api.yourapp.com/api
   ```

2. **Database Migrations**
   ```bash
   npm run migration:run
   ```

3. **Build Frontend**
   ```bash
   cd apps/web
   npm run build
   ```

4. **Build Backend**
   ```bash
   cd services/user-service
   npm run build
   ```

5. **Health Checks**
   - Verify all endpoints respond
   - Check database connections
   - Test file uploads

### Monitoring

Add logging for:
- Profile updates
- Failed validations
- API errors
- Slow queries

Example:
```typescript
logger.info('Profile updated', { userId, section: 'work-experience' });
```

### Support

For issues or questions:
1. Check the implementation summary document
2. Review the code comments
3. Test with Swagger docs at `/api/docs`
4. Check console logs for errors

---

## Quick Commands Reference

```bash
# Start everything
npm run dev           # In root directory

# Backend only
cd services/user-service && npm run dev

# Frontend only
cd apps/web && npm run dev

# Run migrations
cd services/user-service && npm run migration:run

# Type checking
cd apps/web && npm run type-check

# Build for production
npm run build

# Run tests
npm test
```

That's it! You're ready to use the profile edit functionality.
