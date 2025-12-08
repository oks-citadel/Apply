# Resume Templates System

A comprehensive resume templates system with customization, live preview, and professional designs.

## Features

### 1. Template Gallery (`/resumes/templates`)
- Browse 6+ professionally designed templates
- Filter by category (Professional, Modern, Creative, Simple)
- Search templates by name, description, or tags
- Sort by popularity, name, or recent
- Template preview with zoom
- Detailed template information and tags

### 2. Template Categories

#### Professional
- **Professional Classic**: Traditional ATS-friendly design for corporate roles
- **Executive Professional**: Sophisticated design for senior-level positions

#### Modern
- **Modern Minimalist**: Clean contemporary design with focus on content
- **Tech Developer**: Optimized for software engineers with skills emphasis

#### Creative
- **Creative Designer**: Bold creative layout for design roles with two-column layout

#### Simple
- **Simple & Elegant**: Straightforward professional design with excellent readability

### 3. Template Customization (`/resumes/[id]/customize`)

#### Color Schemes (8 options)
- Classic Blue
- Professional Gray
- Modern Teal
- Creative Purple
- Bold Red
- Elegant Black
- Fresh Green
- Warm Orange

#### Font Families (8 options)
- Inter (sans-serif)
- Roboto (sans-serif)
- Open Sans (sans-serif)
- Lato (sans-serif)
- Merriweather (serif)
- Playfair Display (serif)
- Source Sans Pro (sans-serif)
- Nunito (sans-serif)

#### Layout Options
- Single Column: Traditional layout, best for ATS
- Two Column (Left Sidebar): Sidebar on left with main content
- Two Column (Right Sidebar): Sidebar on right with main content

#### Display Options
- Show Photo: Display profile photo
- Show Icons: Display section icons (email, phone, etc.)
- Show Progress Bars: Display skill level indicators

#### Header Styles
- Centered: Traditional centered header
- Left-aligned: Modern left-aligned header
- Two-column: Split header design

#### Typography Controls
- Font Size: 12-16px (adjustable)
- Line Height: 1.3-1.8 (adjustable)
- Section Spacing: 8-24px (adjustable)

### 4. Live Preview
- Real-time preview of all customizations
- Zoom controls (30%-100%)
- Interactive template rendering
- Responsive preview container

### 5. Template Renderer
Each template includes:
- Header with contact information
- Professional summary section
- Work experience with highlights
- Education section
- Skills display (tags, lists, or progress bars)
- Optional certifications, projects, languages

## File Structure

```
apps/web/src/
├── app/(dashboard)/resumes/
│   ├── templates/
│   │   └── page.tsx                    # Template gallery
│   ├── [id]/
│   │   ├── page.tsx                    # Resume editor
│   │   └── customize/
│   │       └── page.tsx                # Template customization
│   └── new/
│       └── page.tsx                    # New resume with template selection
├── components/resume/
│   ├── TemplateRenderer.tsx            # Renders all template designs
│   ├── TemplatePreview.tsx             # Template preview card
│   └── TemplateCustomizer.tsx          # Customization panel
├── data/
│   └── templates.ts                    # Template definitions and utilities
└── types/
    └── template.ts                     # TypeScript types and constants
```

## Usage

### Creating a Resume with a Template

1. Navigate to `/resumes`
2. Click "Create New Resume"
3. Select a template from the gallery
4. Fill in basic information
5. Click "Create Resume"

### Customizing a Resume Template

1. Open an existing resume
2. Click "Customize Template" or navigate to `/resumes/[id]/customize`
3. Adjust colors, fonts, layout, and display options
4. Preview changes in real-time
5. Click "Save Changes"

### Browsing Templates

1. Navigate to `/resumes/templates`
2. Use category filters or search
3. Click on a template to select it
4. Click "Use This Template" to create a new resume

## Template Design Guidelines

### ATS Compatibility
- Single-column layouts preferred
- Avoid tables and complex formatting
- Use standard section headings
- Include contact info in header
- Use readable fonts (12-14px)

### Visual Hierarchy
- Clear section separation
- Consistent spacing
- Readable fonts and sizes
- Appropriate color contrast
- Professional appearance

### Content Organization
- Most important information first
- Reverse chronological order
- Clear job titles and dates
- Quantifiable achievements
- Relevant keywords

## Customization Best Practices

1. **Color Selection**
   - Use professional colors for corporate roles
   - Creative colors for design/creative positions
   - Ensure text readability

2. **Font Choice**
   - Sans-serif fonts for modern, tech roles
   - Serif fonts for traditional, executive positions
   - Keep font size 12-14px for readability

3. **Layout Selection**
   - Single-column for ATS optimization
   - Two-column for visual appeal (creative roles)
   - Consider industry standards

4. **Display Options**
   - Icons: Use sparingly for clean look
   - Progress bars: Good for creative/tech roles
   - Photos: Include only if industry-appropriate

## Technical Implementation

### Template Rendering
- React functional components
- CSS-in-JS for dynamic styling
- Scale transforms for preview
- Responsive design

### State Management
- React hooks for local state
- React Query for server state
- URL params for template selection

### Performance
- Memoized template components
- Lazy loading for templates
- Optimized re-renders
- Efficient preview scaling

## Future Enhancements

1. Additional template designs
2. Custom template builder
3. Template marketplace
4. Industry-specific templates
5. AI-powered template recommendations
6. Multi-page resume support
7. Template version history
8. Collaborative template editing

## API Integration

The templates system integrates with the resume service API:

- `GET /api/resumes/:id` - Get resume with template data
- `PUT /api/resumes/:id` - Update resume with customization
- `POST /api/resumes` - Create resume with template selection
- `GET /api/resumes/:id/export` - Export with template rendering

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with ES6+ support

## Contributing

When adding new templates:

1. Add template definition to `data/templates.ts`
2. Implement template component in `TemplateRenderer.tsx`
3. Add template thumbnail (210mm x 297mm preview)
4. Update template categories if needed
5. Test template with various content lengths
6. Ensure ATS compatibility
7. Document template-specific features

## Troubleshooting

### Template not rendering
- Check template ID matches definition
- Verify resume data structure
- Check console for errors

### Customization not saving
- Ensure valid customization object
- Check API connection
- Verify user permissions

### Preview scaling issues
- Clear browser cache
- Check CSS transform support
- Verify scale value range

## Support

For issues or questions about the templates system:
1. Check the troubleshooting section
2. Review code comments in implementation files
3. Contact the development team
