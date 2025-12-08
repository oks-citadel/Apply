# AI Resume Builder

A comprehensive, AI-powered resume builder with step-by-step wizard interface.

## Features Implemented

### Core Features
- **Step-by-step wizard** - 7-step guided resume creation process
  - Personal Information
  - Professional Summary
  - Work Experience
  - Education
  - Skills
  - Projects
  - Review

### AI-Powered Features
- **AI Suggestions** - Get AI-generated content for summary and experience sections
- **Resume Optimization** - Optimize entire resume with AI analysis
- **Resume Score** - Get ATS (Applicant Tracking System) score and feedback
- **Smart Suggestions** - Apply AI suggestions with one click

### Additional Features
- **Real-time Preview** - Live preview of resume as you build it
- **Auto-save** - Automatic draft saving every 5 seconds
- **Export Options** - Export to PDF or DOCX format
- **Draft Management** - Save and continue later
- **Progress Tracking** - Visual progress indicator across wizard steps

## Components

### Main Components
1. **page.tsx** - Main resume builder page with wizard navigation
2. **ResumeSection.tsx** - Handles rendering of each wizard step
3. **AISuggestionCard.tsx** - Displays AI-generated suggestions
4. **ResumePreview.tsx** - Live preview of the resume
5. **ScoreDisplay.tsx** - Shows ATS score and feedback

## Hooks

### Custom Hooks
- `useResumeAI.ts` - Hooks for AI features:
  - `useGenerateSummary()` - Generate professional summary
  - `useGenerateBullets()` - Generate bullet points
  - `useOptimizeResumeAI()` - Optimize entire resume
  - `useImproveText()` - Improve specific text
  - `useGetResumeScore()` - Get resume score

## API Integration

The resume builder integrates with the following AI endpoints:
- `/api/ai/generate-summary` - Generate professional summaries
- `/api/ai/generate-bullets` - Generate experience bullet points
- `/api/ai/optimize-resume` - Optimize resume content
- `/api/ai/ats-score` - Calculate ATS score

And resume endpoints:
- `/api/resumes` - Create/update resumes
- `/api/resumes/:id/export` - Export resume

## Usage

Navigate to `/ai-tools/resume-builder` to start building a resume.

### Workflow
1. Fill in personal information
2. Write or generate AI summary
3. Add work experience with AI-generated bullet points
4. Add education history
5. Add skills by category
6. Add projects (optional)
7. Review and export

### AI Features
- Click "AI Suggest" on summary or experience sections for AI-generated content
- Click "Optimize Resume" to get comprehensive AI optimization
- Click "Calculate Score" to get ATS score and improvement suggestions
- Apply suggestions individually or review all before applying

## Design System
Uses the existing design system components:
- Cards, Buttons, Inputs from `@/components/ui`
- Icons from `lucide-react`
- Tailwind CSS for styling
- Dark mode support included

## State Management
- React Query for API state management
- Local state for wizard navigation and form data
- Optimistic updates for better UX

## Error Handling
- Toast notifications for all actions
- Loading states for async operations
- Error boundaries for component failures
- Validation feedback for required fields
