# ApplyforUs Design System

## Overview

The ApplyforUs Design System is a comprehensive collection of design standards, components, and guidelines that ensure consistency, accessibility, and quality across the entire platform. This system serves as the single source of truth for all design and development decisions.

## Design Principles

### 1. User-Centric
Every design decision prioritizes the user's needs, workflows, and goals. We focus on reducing friction in the job application process and empowering users with AI-driven tools.

### 2. Accessible by Default
Accessibility is not an afterthought. All components meet WCAG 2.1 AA standards, ensuring the platform is usable by everyone, regardless of ability.

### 3. Consistent & Predictable
Users should feel familiar with every part of the platform. Consistent patterns, terminology, and interactions build trust and reduce cognitive load.

### 4. Performance-First
Fast, responsive interfaces are essential. Every component is optimized for performance, with loading states and skeleton screens to maintain perceived speed.

### 5. Scalable & Maintainable
The design system grows with the platform. Modular components and clear documentation enable teams to build and iterate quickly.

### 6. Professional & Trustworthy
As a platform handling sensitive career information, ApplyforUs maintains a professional aesthetic that inspires confidence and trust.

## Component Library Overview

The design system includes the following component categories:

### Foundation
- Colors
- Typography
- Spacing
- Icons
- Animations

### Layout
- Grid System
- Container
- Stack
- Flex
- Divider

### Navigation
- Sidebar
- Top Navigation Bar
- Breadcrumbs
- Tabs
- Pagination

### Inputs
- Text Input
- Textarea
- Select
- Checkbox
- Radio
- Toggle Switch
- Date Picker
- File Upload

### Buttons
- Primary Button
- Secondary Button
- Outline Button
- Ghost Button
- Danger Button
- Icon Button
- Button Group

### Data Display
- Table
- List
- Badge
- Tag
- Avatar
- Card
- Stat Card
- Timeline

### Feedback
- Alert
- Toast
- Modal
- Confirmation Dialog
- Progress Bar
- Spinner
- Skeleton

### Content
- Empty State
- Error State
- Loading State
- Typography Components

## Usage Guidelines

### Component Selection
Choose components based on:
- **Context**: Consider where the component will be used
- **User intent**: Match the interaction pattern to the user's goal
- **Hierarchy**: Use visual weight appropriately to guide attention
- **Consistency**: Prefer existing patterns over creating new ones

### Customization
- Follow the established design tokens (colors, spacing, typography)
- Document any deviations from standard patterns
- Consult with the design team before creating new component variants

### Composition
- Compose complex interfaces from simple, reusable components
- Maintain consistent spacing between elements
- Use layout components for structural organization

## Accessibility Standards

All components must meet WCAG 2.1 AA compliance:

### Color Contrast
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order throughout the interface
- Visible focus indicators on all focusable elements
- Keyboard shortcuts documented and non-conflicting

### Screen Readers
- Semantic HTML used throughout
- ARIA labels for complex interactions
- Alt text for all meaningful images
- Announced state changes for dynamic content

### Focus Management
- Clear focus indicators (2px outline with adequate contrast)
- Focus trap in modals and dialogs
- Restore focus after dismissing overlays

### Forms
- Clear labels associated with inputs
- Error messages announced to screen readers
- Required fields clearly marked
- Helpful validation messages

## Responsive Design

### Breakpoints
```
xs: 0px      (Mobile portrait)
sm: 640px    (Mobile landscape)
md: 768px    (Tablet portrait)
lg: 1024px   (Tablet landscape / Small desktop)
xl: 1280px   (Desktop)
2xl: 1536px  (Large desktop)
```

### Mobile-First Approach
- Design for mobile devices first
- Progressively enhance for larger screens
- Touch targets minimum 44x44px
- Readable font sizes without zooming

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Implementation

### Technology Stack
- **Framework**: React with Next.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Tailwind CSS + Framer Motion
- **Components**: Custom components + shadcn/ui

### File Structure
```
src/
  components/
    ui/           # Base UI components
    layout/       # Layout components
    features/     # Feature-specific components
  styles/
    globals.css   # Global styles and CSS variables
  lib/
    utils.ts      # Utility functions
```

### Naming Conventions
- Components: PascalCase (e.g., `Button`, `TextField`)
- Props: camelCase (e.g., `isDisabled`, `onClick`)
- CSS classes: lowercase with hyphens (e.g., `btn-primary`)
- Files: kebab-case for components (e.g., `text-field.tsx`)

## Design Tokens

Design tokens are the atomic values of the design system:

- **Colors**: Brand, semantic, and neutral colors
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Margin, padding, and gap values
- **Sizing**: Width, height, and dimension values
- **Border**: Radius, width, and style values
- **Shadow**: Elevation and shadow values
- **Transition**: Duration and easing values

## Documentation

Each component includes:
- Visual examples
- Props/API documentation
- Usage guidelines
- Accessibility notes
- Code examples
- Do's and don'ts

## Versioning

The design system follows semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes and minor updates

Current Version: **1.0.0**

## Contributing

When contributing to the design system:
1. Review existing components before creating new ones
2. Follow accessibility guidelines
3. Document all props and use cases
4. Include tests for interactive components
5. Update this documentation with changes

## Support

For questions or issues:
- Design Team: design@applyforus.com
- Developer Support: dev@applyforus.com
- Documentation: https://docs.applyforus.com/design-system

---

**Last Updated**: December 2025
**Maintained By**: ApplyforUs Design & Engineering Teams
