# Resume Templates Quick Start Guide

Get started with the resume templates system in 5 minutes.

## Quick Links

- **Template Gallery**: `/resumes/templates`
- **Create with Template**: `/resumes/new`
- **Customize Template**: `/resumes/[id]/customize`
- **Documentation**: `apps/web/src/app/(dashboard)/resumes/TEMPLATES_README.md`

## Installation

All files are already created. No additional installation needed.

## File Overview

```
Created Files:
├── apps/web/src/
│   ├── app/(dashboard)/resumes/
│   │   ├── templates/page.tsx              ✅ Template gallery
│   │   ├── new/page.tsx                    ✅ New resume wizard
│   │   ├── [id]/customize/page.tsx         ✅ Customization page
│   │   └── TEMPLATES_README.md             ✅ Feature docs
│   ├── components/resume/
│   │   ├── TemplateRenderer.tsx            ✅ 6 template designs
│   │   ├── TemplatePreview.tsx             ✅ Preview component
│   │   ├── TemplateCustomizer.tsx          ✅ Customization panel
│   │   └── TemplateSelector.tsx            ✅ Quick selector
│   ├── data/
│   │   └── templates.ts                    ✅ Template data
│   └── types/
│       └── template.ts                     ✅ TypeScript types
└── Documentation:
    ├── RESUME_TEMPLATES_IMPLEMENTATION.md  ✅ Full implementation
    ├── TEMPLATES_INTEGRATION_GUIDE.md      ✅ Integration steps
    └── TEMPLATES_QUICK_START.md            ✅ This file
```

## Templates Available

1. **Professional Classic** - Traditional ATS-friendly (single-column)
2. **Modern Minimalist** - Clean contemporary design (single-column)
3. **Creative Designer** - Bold two-column with sidebar
4. **Executive Professional** - Sophisticated two-column
5. **Tech Developer** - Developer-focused two-column
6. **Simple & Elegant** - Universal professional (single-column)

## Usage Examples

### 1. Browse Templates

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Layout } from 'lucide-react';

// Add to any page
<Link href="/resumes/templates">
  <Button>
    <Layout className="w-4 h-4 mr-2" />
    Browse Templates
  </Button>
</Link>
```

### 2. Create Resume with Template

```tsx
import { useRouter } from 'next/navigation';
import { useCreateResume } from '@/hooks/useResumes';

const createResume = useCreateResume();
const router = useRouter();

// Create with specific template
const handleCreate = async () => {
  const newResume = await createResume.mutateAsync({
    name: 'My Professional Resume',
    template: 'professional-classic',
    personalInfo: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+1 555-0123',
    }
  });

  router.push(`/resumes/${newResume.id}`);
};
```

### 3. Render Template

```tsx
import { TemplateRenderer } from '@/components/resume/TemplateRenderer';
import { DEFAULT_CUSTOMIZATION } from '@/types/template';

<TemplateRenderer
  templateId="professional-classic"
  resume={resumeData}
  customization={customization || DEFAULT_CUSTOMIZATION}
  scale={0.75}
/>
```

### 4. Preview Template

```tsx
import { TemplatePreview } from '@/components/resume/TemplatePreview';
import { RESUME_TEMPLATES } from '@/data/templates';

const template = RESUME_TEMPLATES[0];

<TemplatePreview
  template={template}
  selected={false}
  onSelect={() => handleSelect(template.id)}
  showDetails={true}
  scale={0.2}
/>
```

### 5. Customize Template

```tsx
import { TemplateCustomizer } from '@/components/resume/TemplateCustomizer';
import { useState } from 'react';
import { DEFAULT_CUSTOMIZATION } from '@/types/template';

const [customization, setCustomization] = useState(DEFAULT_CUSTOMIZATION);

<TemplateCustomizer
  customization={customization}
  onChange={setCustomization}
  onReset={() => setCustomization(DEFAULT_CUSTOMIZATION)}
/>
```

### 6. Get Template Data

```tsx
import {
  getTemplateById,
  getTemplatesByCategory,
  searchTemplates
} from '@/data/templates';

// Get specific template
const template = getTemplateById('professional-classic');

// Get by category
const professionalTemplates = getTemplatesByCategory('professional');

// Search templates
const results = searchTemplates('modern');
```

## Customization Options

```typescript
import { TemplateCustomization } from '@/types/template';

const customization: TemplateCustomization = {
  // Color scheme
  colorScheme: 'classic-blue', // 8 options available

  // Font
  fontFamily: 'inter', // 8 fonts available

  // Layout
  layout: 'single-column', // single-column | two-column-left | two-column-right

  // Typography
  fontSize: 14, // 12-16
  lineHeight: 1.5, // 1.3-1.8
  sectionSpacing: 16, // 8-24

  // Display options
  showPhoto: false,
  showIcons: true,
  showProgressBars: false,

  // Header style
  headerStyle: 'centered', // centered | left | two-column

  // Section order
  sectionOrder: ['summary', 'experience', 'education', 'skills'],
};
```

## Navigation Setup

Add these routes to your navigation:

```tsx
// In your nav/menu component
const navItems = [
  { href: '/resumes', label: 'My Resumes', icon: FileText },
  { href: '/resumes/templates', label: 'Templates', icon: Layout },
  { href: '/resumes/new', label: 'Create Resume', icon: Plus },
];
```

## Common Patterns

### Pattern 1: Template Selection Flow

```tsx
// Step 1: Show gallery
<Link href="/resumes/templates">
  <Button>Choose Template</Button>
</Link>

// Step 2: User selects template
// Redirects to: /resumes/new?template=professional-classic

// Step 3: Fill basic info
// Creates resume and redirects to: /resumes/{id}

// Step 4: Edit and customize
// User can access: /resumes/{id}/customize
```

### Pattern 2: Quick Template Switch

```tsx
import { TemplateSelector } from '@/components/resume/TemplateSelector';

// In resume editor
<TemplateSelector
  currentTemplateId={resume.template}
  resumeId={resume.id}
  onTemplateChange={async (templateId) => {
    await updateResume({ id: resume.id, data: { template: templateId }});
  }}
/>
```

### Pattern 3: Preview with Custom Settings

```tsx
const PreviewModal = ({ resume, isOpen, onClose }) => {
  const template = getTemplateById(resume.template);
  const customization = resume.customization || template?.defaultCustomization;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <TemplateRenderer
        templateId={resume.template}
        resume={resume}
        customization={customization}
        scale={0.6}
      />
    </Modal>
  );
};
```

## Styling Tips

### Add Global Styles for Templates

```css
/* apps/web/src/styles/templates.css */

.resume-template {
  font-family: inherit;
  color: inherit;
  background: white;
}

.resume-template * {
  box-sizing: border-box;
}

@media print {
  .resume-template {
    width: 210mm;
    height: 297mm;
    margin: 0;
    padding: 0;
  }
}
```

### Import in Layout

```tsx
// apps/web/src/app/layout.tsx
import '@/styles/templates.css';
```

## Troubleshooting

### Issue: Templates not rendering

**Solution**: Check that template ID exists
```tsx
import { RESUME_TEMPLATES } from '@/data/templates';

const templateExists = RESUME_TEMPLATES.find(t => t.id === templateId);
if (!templateExists) {
  console.error('Template not found:', templateId);
}
```

### Issue: Fonts not loading

**Solution**: Add fonts to Next.js config (see TEMPLATES_INTEGRATION_GUIDE.md section 6)

### Issue: Colors not applying

**Solution**: Check color scheme exists
```tsx
import { COLOR_SCHEMES } from '@/types/template';

const colorScheme = customization.colorScheme;
if (!COLOR_SCHEMES[colorScheme]) {
  console.error('Invalid color scheme:', colorScheme);
}
```

### Issue: Preview too large/small

**Solution**: Adjust scale prop
```tsx
// For gallery previews
<TemplatePreview scale={0.15} />

// For full previews
<TemplateRenderer scale={0.75} />

// For mobile
<TemplateRenderer scale={0.5} />
```

## Best Practices

1. **Always provide fallback customization**
   ```tsx
   const customization = resume.customization || DEFAULT_CUSTOMIZATION;
   ```

2. **Validate template ID before rendering**
   ```tsx
   if (!getTemplateById(templateId)) {
     return <ErrorState message="Template not found" />;
   }
   ```

3. **Use appropriate scale for context**
   - Gallery: 0.15-0.2
   - Modal preview: 0.5-0.6
   - Full page: 0.75-1.0

4. **Handle loading states**
   ```tsx
   if (isLoading) return <Skeleton />;
   if (!resume) return <ErrorState />;
   ```

5. **Provide navigation back**
   ```tsx
   <Button variant="ghost" onClick={() => router.back()}>
     <ArrowLeft /> Back
   </Button>
   ```

## Next Steps

1. ✅ Browse the template gallery at `/resumes/templates`
2. ✅ Create a new resume at `/resumes/new`
3. ✅ Customize a template at `/resumes/[id]/customize`
4. 📖 Read full documentation in `TEMPLATES_README.md`
5. 🔗 Integrate into existing pages using `TEMPLATES_INTEGRATION_GUIDE.md`

## Getting Help

- **Feature Documentation**: `apps/web/src/app/(dashboard)/resumes/TEMPLATES_README.md`
- **Integration Guide**: `TEMPLATES_INTEGRATION_GUIDE.md`
- **Full Implementation**: `RESUME_TEMPLATES_IMPLEMENTATION.md`
- **Code Examples**: Check component files for inline documentation

## Component Props Reference

### TemplateRenderer
```typescript
{
  templateId: string;           // Required: Template ID
  resume: Resume;               // Required: Resume data
  customization: TemplateCustomization; // Required: Customization settings
  scale?: number;               // Optional: Scale factor (default: 1)
}
```

### TemplatePreview
```typescript
{
  template: ResumeTemplate;     // Required: Template definition
  customization?: TemplateCustomization; // Optional: Custom settings
  resumeData?: Resume;          // Optional: Real resume data
  selected?: boolean;           // Optional: Selected state
  onSelect?: () => void;        // Optional: Selection handler
  showDetails?: boolean;        // Optional: Show name/description
  scale?: number;               // Optional: Scale factor (default: 0.25)
}
```

### TemplateCustomizer
```typescript
{
  customization: TemplateCustomization; // Required: Current settings
  onChange: (customization: TemplateCustomization) => void; // Required: Change handler
  onReset?: () => void;         // Optional: Reset handler
}
```

### TemplateSelector
```typescript
{
  currentTemplateId: string;    // Required: Current template
  resumeId: string;             // Required: Resume ID
  onTemplateChange: (templateId: string) => void; // Required: Change handler
}
```

## Ready to Use!

All components are ready to use. Simply import and use them in your pages:

```tsx
import { TemplateRenderer } from '@/components/resume/TemplateRenderer';
import { TemplatePreview } from '@/components/resume/TemplatePreview';
import { TemplateCustomizer } from '@/components/resume/TemplateCustomizer';
import { TemplateSelector } from '@/components/resume/TemplateSelector';
import { RESUME_TEMPLATES, getTemplateById } from '@/data/templates';
import { DEFAULT_CUSTOMIZATION } from '@/types/template';
```

Happy building! 🚀
