# User Service

User profile and preferences management microservice for JobPilot AI Platform.

## Overview

The User Service manages user profiles, skills, experience, education, preferences, and subscription information. It provides APIs for CRUD operations on user data.

## Features

- User profile management
- Skills and competencies tracking
- Work experience management
- Education history
- Job preferences and alerts
- Subscription tier management
- Profile photo upload
- User settings and preferences

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL (via TypeORM)
- **Storage**: AWS S3 (profile photos)
- **Cache**: Redis

## API Endpoints

### User Profile

- `GET /api/v1/users/me` - Get current user profile
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user profile
- `DELETE /api/v1/users/:id` - Delete user account
- `POST /api/v1/users/:id/photo` - Upload profile photo

### Skills

- `GET /api/v1/users/:id/skills` - Get user skills
- `POST /api/v1/users/:id/skills` - Add skills
- `DELETE /api/v1/users/:id/skills/:skillId` - Remove skill

### Experience

- `GET /api/v1/users/:id/experience` - Get work experience
- `POST /api/v1/users/:id/experience` - Add experience
- `PATCH /api/v1/users/:id/experience/:expId` - Update experience
- `DELETE /api/v1/users/:id/experience/:expId` - Delete experience

### Education

- `GET /api/v1/users/:id/education` - Get education history
- `POST /api/v1/users/:id/education` - Add education
- `PATCH /api/v1/users/:id/education/:eduId` - Update education
- `DELETE /api/v1/users/:id/education/:eduId` - Delete education

### Preferences

- `GET /api/v1/users/:id/preferences` - Get user preferences
- `PATCH /api/v1/users/:id/preferences` - Update preferences

### Subscription

- `GET /api/v1/users/:id/subscription` - Get subscription details
- `POST /api/v1/users/:id/subscription/upgrade` - Upgrade subscription

## Environment Variables

```bash
PORT=8002
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5434/jobpilot
REDIS_URL=redis://localhost:6381

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=jobpilot-user-uploads
AWS_S3_REGION=us-east-1
AWS_S3_PROFILE_PHOTOS_PREFIX=profile-photos/

# Service URLs
AUTH_SERVICE_URL=http://localhost:8001/api/v1

# File Upload
MAX_FILE_SIZE=5242880  # 5MB
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

CORS_ORIGINS=http://localhost:3000
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Run migrations
pnpm migration:run

# Start development server
pnpm dev
```

## Database Schema

### User Profiles

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  location VARCHAR(255),
  title VARCHAR(255),
  bio TEXT,
  photo_url VARCHAR(500),
  linkedin_url VARCHAR(500),
  github_url VARCHAR(500),
  portfolio_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Skills

```sql
CREATE TABLE user_skills (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  proficiency VARCHAR(50),  -- beginner, intermediate, advanced, expert
  years_experience INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing

```bash
pnpm test
pnpm test:cov
pnpm test:e2e
```

## Support

Email: dev@jobpilot.ai
