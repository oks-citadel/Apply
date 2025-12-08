# Resume Templates Integration Guide

Quick guide for integrating the resume templates system into existing pages.

## 1. Update Resume List Page

Add a "Browse Templates" button to the resumes list page:

```tsx
// apps/web/src/app/(dashboard)/resumes/page.tsx

import { Layout } from 'lucide-react';
import Link from 'next/link';

// Add this button near the "Create New Resume" button
<div className="flex items-center gap-3">
  <Link href="/resumes/templates">
    <Button variant="outline">
      <Layout className="w-4 h-4 mr-2" />
      Browse Templates
    </Button>
  </Link>
  <Button onClick={handleCreateNew} disabled={createResume.isPending}>
    <Plus className="w-4 h-4 mr-2" />
    Create New Resume
  </Button>
</div>
```

Update the "Create New" handler to use the wizard:

```tsx
const handleCreateNew = useCallback(() => {
  router.push('/resumes/new'); // Navigate to wizard instead
}, [router]);
```

## 2. Update Resume Editor Page

Add template customization link to the resume editor:

```tsx
// apps/web/src/app/(dashboard)/resumes/[id]/page.tsx

import { Palette } from 'lucide-react';
import Link from 'next/link';

// Add this button in the action buttons area (around line 202)
<div className="flex items-center space-x-3">
  <Link href={`/resumes/${params.id}/customize`}>
    <Button variant="outline">
      <Palette className="w-4 h-4 mr-2" />
      Customize Template
    </Button>
  </Link>
  <Button variant="outline" onClick={handlePreview}>
    <Eye className="w-4 h-4 mr-2" />
    Preview
  </Button>
  <Button variant="outline" onClick={handleDownload}>
    <Download className="w-4 h-4 mr-2" />
    Download PDF
  </Button>
  <Button onClick={handleAIOptimize}>
    <Sparkles className="w-4 h-4 mr-2" />
    AI Optimize
  </Button>
</div>
```

Add template selector to sidebar:

```tsx
import { TemplateSelector } from '@/components/resume/TemplateSelector';

// In the sidebar section
<Card>
  <CardHeader>
    <CardTitle>Template</CardTitle>
    <CardDescription>Change your resume template</CardDescription>
  </CardHeader>
  <CardContent>
    <TemplateSelector
      currentTemplateId={resume.template}
      resumeId={params.id}
      onTemplateChange={async (templateId) => {
        await updateResume.mutateAsync({
          id: params.id,
          data: { template: templateId }
        });
      }}
    />
  </CardContent>
</Card>
```

## 3. Update Resume Types

Ensure the Resume interface includes customization field:

```typescript
// apps/web/src/types/resume.ts

export interface Resume {
  id: string;
  userId: string;
  name: string;
  personalInfo: PersonalInfo;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  certifications?: Certification[];
  languages?: Language[];
  projects?: Project[];
  isDefault: boolean;
  template: string;
  customization?: TemplateCustomization; // Add this field
  createdAt: string;
  updatedAt: string;
  applications?: number;
}

export interface UpdateResumeData extends Partial<CreateResumeData> {
  experience?: Experience[];
  education?: Education[];
  skills?: Skill[];
  certifications?: Certification[];
  languages?: Language[];
  projects?: Project[];
  isDefault?: boolean;
  customization?: TemplateCustomization; // Add this field
}
```

## 4. Update Resume Preview/Export

When implementing preview or export, use the TemplateRenderer:

```tsx
import { TemplateRenderer } from '@/components/resume/TemplateRenderer';
import { getTemplateById } from '@/data/templates';

function ResumePreview({ resume }: { resume: Resume }) {
  const template = getTemplateById(resume.template);
  const customization = resume.customization || template?.defaultCustomization;

  return (
    <div className="resume-preview-container">
      <TemplateRenderer
        templateId={resume.template}
        resume={resume}
        customization={customization}
        scale={0.75} // Adjust scale for preview
      />
    </div>
  );
}
```

## 5. Navigation Links

Add these navigation links to make templates easily accessible:

### In Sidebar/Navigation Menu
```tsx
<nav>
  <Link href="/resumes">My Resumes</Link>
  <Link href="/resumes/templates">Templates</Link>
  <Link href="/resumes/new">Create Resume</Link>
</nav>
```

### In Dashboard
```tsx
<Card>
  <CardHeader>
    <CardTitle>Quick Actions</CardTitle>
  </CardHeader>
  <CardContent>
    <Link href="/resumes/new">
      <Button className="w-full mb-2">Create New Resume</Button>
    </Link>
    <Link href="/resumes/templates">
      <Button variant="outline" className="w-full">
        Browse Templates
      </Button>
    </Link>
  </CardContent>
</Card>
```

## 6. Add Fonts to Next.js Config

Ensure the required fonts are loaded in your app:

```tsx
// apps/web/src/app/layout.tsx

import {
  Inter,
  Roboto,
  Open_Sans,
  Lato,
  Merriweather,
  Playfair_Display,
  Source_Sans_Pro,
  Nunito
} from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const roboto = Roboto({ weight: ['300', '400', '500', '700'], subsets: ['latin'], variable: '--font-roboto' });
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' });
const lato = Lato({ weight: ['300', '400', '700'], subsets: ['latin'], variable: '--font-lato' });
const merriweather = Merriweather({ weight: ['300', '400', '700'], subsets: ['latin'], variable: '--font-merriweather' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const sourceSans = Source_Sans_Pro({ weight: ['300', '400', '600', '700'], subsets: ['latin'], variable: '--font-source-sans' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`
      ${inter.variable}
      ${roboto.variable}
      ${openSans.variable}
      ${lato.variable}
      ${merriweather.variable}
      ${playfair.variable}
      ${sourceSans.variable}
      ${nunito.variable}
    `}>
      <body>{children}</body>
    </html>
  );
}
```

And add to Tailwind config:

```js
// apps/web/tailwind.config.js

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        'inter': ['var(--font-inter)'],
        'roboto': ['var(--font-roboto)'],
        'open-sans': ['var(--font-open-sans)'],
        'lato': ['var(--font-lato)'],
        'merriweather': ['var(--font-merriweather)'],
        'playfair': ['var(--font-playfair)'],
        'source-sans': ['var(--font-source-sans)'],
        'nunito': ['var(--font-nunito)'],
      }
    }
  }
}
```

## 7. API Integration

Update the resume service API to handle template data:

### Create Resume
```typescript
POST /api/resumes
{
  "name": "My Resume",
  "template": "professional-classic",
  "customization": {
    "colorScheme": "classic-blue",
    "fontFamily": "inter",
    "layout": "single-column",
    // ... other settings
  },
  "personalInfo": { ... }
}
```

### Update Resume
```typescript
PUT /api/resumes/:id
{
  "template": "modern-minimalist",
  "customization": { ... }
}
```

### Get Resume
```typescript
GET /api/resumes/:id
Response: {
  "id": "...",
  "template": "professional-classic",
  "customization": { ... },
  "personalInfo": { ... },
  // ... other fields
}
```

## 8. Empty States

Update empty states to highlight templates:

```tsx
// When user has no resumes
<EmptyState
  icon={<FileText />}
  title="No resumes yet"
  description="Create your first resume using one of our professional templates"
  action={
    <div className="flex gap-3">
      <Link href="/resumes/new">
        <Button>Create Resume</Button>
      </Link>
      <Link href="/resumes/templates">
        <Button variant="outline">Browse Templates</Button>
      </Link>
    </div>
  }
/>
```

## 9. Onboarding Flow

For new users, guide them through template selection:

```tsx
// Show template gallery on first visit
useEffect(() => {
  const hasSeenTemplates = localStorage.getItem('hasSeenTemplates');

  if (!hasSeenTemplates && resumes.length === 0) {
    router.push('/resumes/templates?onboarding=true');
    localStorage.setItem('hasSeenTemplates', 'true');
  }
}, [resumes, router]);
```

## 10. SEO and Metadata

Add proper metadata to template pages:

```tsx
// apps/web/src/app/(dashboard)/resumes/templates/page.tsx

export const metadata = {
  title: 'Resume Templates | JobPilot',
  description: 'Choose from professional, modern, and creative resume templates. ATS-optimized and fully customizable.',
};
```

## Testing Checklist

After integration, test:

- [ ] Navigate from resumes list to templates gallery
- [ ] Create new resume with template selection
- [ ] Change template on existing resume
- [ ] Customize template (colors, fonts, layout)
- [ ] Preview resume with template styling
- [ ] Export resume with template formatting
- [ ] All navigation links work correctly
- [ ] Empty states display properly
- [ ] Mobile responsiveness
- [ ] Font loading works correctly
- [ ] API endpoints handle template data
- [ ] Template changes save correctly

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify all imports are correct
3. Ensure API endpoints are updated
4. Check font loading configuration
5. Review template type definitions
6. Test with mock data first

## Quick Start

Minimum integration steps:

1. Add navigation links to templates gallery
2. Update "Create New" to use wizard
3. Add "Customize Template" button to editor
4. Update Resume types to include customization
5. Test template selection and customization flows

That's it! The templates system should now be fully integrated with your existing resume builder.
