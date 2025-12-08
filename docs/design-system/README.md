# ApplyforUs Design System

Welcome to the ApplyforUs Design System documentation. This comprehensive guide provides all the resources designers and developers need to create consistent, accessible, and beautiful user experiences across the platform.

## Overview

The ApplyforUs Design System is built on the principles of accessibility, consistency, and scalability. Our rebrand introduces a modern, professional aesthetic with **Indigo** as the primary brand color, reflecting intelligence, trust, and innovation in AI-powered job application tools.

## Quick Links

- [Design System Overview](./design_system.md) - Core principles and component library
- [Colors](./colors.md) - Complete color palette and usage guidelines
- [Typography](./typography.md) - Font families, scales, and text styles
- [Spacing](./spacing.md) - Spacing system and layout guidelines
- [Components](./components.md) - UI component library and patterns
- [Layouts](./layouts.md) - Page layouts and responsive patterns
- [Icons](./icons.md) - Icon system using Lucide React
- [Animations](./animations.md) - Motion design and transitions
- [Dark Mode](./dark_mode.md) - Dark mode implementation guide
- [Accessibility](./accessibility.md) - WCAG 2.1 AA compliance guidelines

## Brand Identity

### Primary Colors

```
Primary (Indigo):
- Base: #6366F1 (Indigo-500)
- Dark: #4F46E5 (Indigo-600)
- Light: #818CF8 (Indigo-400)

Secondary (Violet):
- Base: #8B5CF6 (Violet-500)
- Dark: #7C3AED (Violet-600)
```

### Typography

```
Headings: Plus Jakarta Sans
UI/Body: Inter
Code: JetBrains Mono
```

### Design Principles

1. **User-Centric** - Prioritize user needs and reduce friction
2. **Accessible by Default** - Meet WCAG 2.1 AA standards
3. **Consistent & Predictable** - Familiar patterns build trust
4. **Performance-First** - Fast, responsive interfaces
5. **Scalable & Maintainable** - Modular, well-documented components
6. **Professional & Trustworthy** - Inspire confidence

## Getting Started

### For Designers

1. Review the [Design System Overview](./design_system.md)
2. Familiarize yourself with our [Color System](./colors.md)
3. Understand our [Typography](./typography.md) and [Spacing](./spacing.md)
4. Explore the [Component Library](./components.md)
5. Check [Accessibility Guidelines](./accessibility.md) for all designs

### For Developers

1. Install dependencies:
   ```bash
   npm install lucide-react next-themes
   ```

2. The Tailwind configuration is already updated at:
   ```
   apps/web/tailwind.config.ts
   ```

3. Import and use components:
   ```tsx
   import { Button } from '@/components/ui/button';

   <Button variant="primary">Click me</Button>
   ```

4. Follow [Accessibility Guidelines](./accessibility.md) for all implementations

## Key Features

### Comprehensive Color System
- Complete palette with semantic colors (success, warning, error, info)
- WCAG 2.1 AA compliant contrast ratios
- Full dark mode support
- Neutral gray scale for UI elements

### Typography Scale
- 12px to 72px type scale
- Optimized line heights and weights
- Responsive font sizing
- Support for headings, body text, and UI elements

### Spacing System
- 4px base unit
- Consistent scale from 0 to 256px
- Responsive spacing utilities
- Layout and component spacing patterns

### Component Library
- 50+ reusable components
- Buttons, inputs, cards, modals, tables, and more
- All components are accessible and responsive
- Consistent styling and behavior

### Layout Patterns
- Dashboard, auth, landing, detail, and list layouts
- 12-column responsive grid
- Mobile-first approach
- Sticky and fixed positioning patterns

### Icon System
- Lucide React icons (1000+ icons)
- Consistent sizing (16px to 48px)
- Semantic icon mappings
- Accessibility-first implementation

### Motion Design
- 75ms to 1000ms duration scale
- Standard easing functions
- Enter/exit animations
- Loading states and micro-interactions
- Respects `prefers-reduced-motion`

### Dark Mode
- Complete dark mode support
- Adjusted colors for proper contrast
- Component-specific adaptations
- System preference detection

### Accessibility
- WCAG 2.1 AA compliance (AAA for critical features)
- Keyboard navigation support
- Screen reader optimization
- Proper color contrast
- Focus management
- Touch target sizes (44x44px minimum)

## Implementation

### Tailwind CSS Configuration

All design tokens are configured in the Tailwind config:

```typescript
// apps/web/tailwind.config.ts
export default {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#6366F1', // Indigo
          // Full scale 50-900
        },
        secondary: {
          500: '#8B5CF6', // Violet
          // Full scale 50-900
        },
        // Success, warning, error, info, gray
      },
      fontFamily: {
        sans: ['Inter', ...],
        display: ['Plus Jakarta Sans', ...],
        mono: ['JetBrains Mono', ...],
      },
      // Typography, spacing, animations
    },
  },
};
```

### Using Design Tokens

```tsx
// Colors
<div className="bg-primary-500 text-white">Primary background</div>
<div className="text-success-700">Success text</div>

// Typography
<h1 className="text-5xl font-bold font-display">Page Title</h1>
<p className="text-base text-gray-700">Body text</p>

// Spacing
<div className="p-6 mb-8">Padding 24px, margin-bottom 32px</div>
<div className="space-y-4">16px gap between children</div>

// Animations
<div className="animate-fade-in">Fade in animation</div>
<button className="transition-colors duration-150 hover:bg-primary-600">
  Smooth hover
</button>

// Dark mode
<div className="bg-white dark:bg-gray-800">
  Adapts to theme
</div>
```

### Component Example

```tsx
export function DashboardCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Card Title
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Card description
      </p>
      <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors duration-150">
        Action
      </button>
    </div>
  );
}
```

## File Structure

```
docs/design-system/
├── README.md                 # This file
├── design_system.md          # Overview and principles
├── colors.md                 # Color palette and usage
├── typography.md             # Type scale and fonts
├── spacing.md                # Spacing system
├── components.md             # UI components
├── layouts.md                # Layout patterns
├── icons.md                  # Icon library
├── animations.md             # Motion design
├── dark_mode.md              # Dark mode guide
└── accessibility.md          # Accessibility standards
```

## Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Responsive Breakpoints

```
xs:  0px      (Mobile portrait)
sm:  640px    (Mobile landscape)
md:  768px    (Tablet portrait)
lg:  1024px   (Tablet landscape / Small desktop)
xl:  1280px   (Desktop)
2xl: 1536px   (Large desktop)
```

## Accessibility Standards

All components meet **WCAG 2.1 AA** standards:

- ✓ Color contrast ratios (4.5:1 for text, 3:1 for UI)
- ✓ Keyboard navigation
- ✓ Screen reader support
- ✓ Focus indicators
- ✓ Touch targets (44x44px minimum)
- ✓ Semantic HTML
- ✓ ARIA labels where needed

## Contributing

When contributing to the design system:

1. Review existing components before creating new ones
2. Follow accessibility guidelines (WCAG 2.1 AA)
3. Document all props and use cases
4. Test in both light and dark modes
5. Verify responsive behavior
6. Include code examples
7. Update documentation

## Version History

**Version 1.0.0** (December 2025)
- Initial ApplyforUs rebrand
- New indigo/violet color palette
- Complete component library
- Dark mode support
- Comprehensive accessibility guidelines

## Support

For questions, issues, or contributions:

- **Design Team**: design@applyforus.com
- **Engineering Team**: dev@applyforus.com
- **Documentation**: https://docs.applyforus.com/design-system

## Resources

### External Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font](https://rsms.me/inter/)
- [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)

### Tools

- **Color Contrast Checker**: [WebAIM](https://webaim.org/resources/contrastchecker/)
- **Accessibility Testing**: [axe DevTools](https://www.deque.com/axe/devtools/)
- **Screen Reader**: [NVDA](https://www.nvaccess.org/) (Windows), [VoiceOver](https://www.apple.com/accessibility/voiceover/) (macOS)
- **Design Tool**: [Figma](https://figma.com)

## License

Copyright 2025 ApplyforUs. All rights reserved.

This design system is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Maintained By**: ApplyforUs Design & Engineering Teams
