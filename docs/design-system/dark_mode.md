# Dark Mode

## Overview

ApplyforUs supports a comprehensive dark mode that reduces eye strain in low-light environments while maintaining readability and visual hierarchy. Our dark mode follows modern best practices with carefully calibrated colors and contrast ratios.

## Implementation Strategy

### Class-Based Dark Mode

We use Tailwind's class-based dark mode strategy:

```typescript
// tailwind.config.ts
export default {
  darkMode: ['class'],
  // ...
}
```

**Advantages:**
- Manual control over dark mode toggle
- Persists user preference
- No flash of incorrect theme
- Works across all browsers

### Theme Provider

```tsx
// app/providers.tsx
'use client';

import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

### Theme Toggle

```tsx
'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
    </button>
  );
}
```

## Color Mappings

### Background Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Page Background | Gray-50 (#F9FAFB) | Gray-900 (#111827) |
| Card Background | White (#FFFFFF) | Gray-800 (#1F2937) |
| Elevated Card | White (#FFFFFF) | Gray-700 (#374151) |
| Input Background | White (#FFFFFF) | Gray-800 (#1F2937) |
| Hover Background | Gray-50 (#F9FAFB) | Gray-700 (#374151) |
| Active Background | Gray-100 (#F3F4F6) | Gray-600 (#4B5563) |

### Text Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary Text | Gray-900 (#111827) | White (#FFFFFF) |
| Secondary Text | Gray-700 (#374151) | Gray-300 (#D1D5DB) |
| Tertiary Text | Gray-600 (#4B5563) | Gray-400 (#9CA3AF) |
| Disabled Text | Gray-400 (#9CA3AF) | Gray-600 (#4B5563) |
| Placeholder | Gray-400 (#9CA3AF) | Gray-500 (#6B7280) |

### Border Colors

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Default Border | Gray-200 (#E5E7EB) | Gray-700 (#374151) |
| Strong Border | Gray-300 (#D1D5DB) | Gray-600 (#4B5563) |
| Divider | Gray-200 (#E5E7EB) | Gray-700 (#374151) |
| Focus Ring | Primary-500 | Primary-400 |

### Brand Colors

| Color | Light Mode | Dark Mode |
|-------|------------|-----------|
| Primary | Indigo-500 (#6366F1) | Indigo-400 (#818CF8) |
| Primary Hover | Indigo-600 (#4F46E5) | Indigo-500 (#6366F1) |
| Secondary | Violet-500 (#8B5CF6) | Violet-400 (#A78BFA) |
| Success | Emerald-500 (#10B981) | Emerald-400 (#34D399) |
| Warning | Amber-500 (#F59E0B) | Amber-400 (#FBBF24) |
| Error | Red-500 (#EF4444) | Red-400 (#F87171) |
| Info | Blue-500 (#3B82F6) | Blue-400 (#60A5FA) |

**Note:** Brand colors are generally lighter in dark mode to maintain proper contrast against dark backgrounds.

## Component Adjustments

### Buttons

```tsx
/* Primary Button */
<button className="bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700">
  Primary Button
</button>

/* Secondary Button */
<button className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700">
  Secondary Button
</button>

/* Outline Button */
<button className="bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800">
  Outline Button
</button>

/* Ghost Button */
<button className="bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
  Ghost Button
</button>
```

### Cards

```tsx
/* Default Card */
<div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700">
  Card content
</div>

/* Elevated Card */
<div className="bg-white shadow-lg rounded-lg p-6 dark:bg-gray-700 dark:shadow-gray-900/30">
  Elevated card
</div>

/* Interactive Card */
<div className="bg-white border border-gray-200 hover:border-primary-500 hover:shadow-md dark:bg-gray-800 dark:border-gray-700 dark:hover:border-primary-400 cursor-pointer transition-all">
  Interactive card
</div>
```

### Inputs

```tsx
/* Text Input */
<input
  type="text"
  className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-primary-400 dark:focus:ring-primary-400"
  placeholder="Enter text..."
/>

/* Select */
<select className="bg-white border border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white">
  <option>Option 1</option>
</select>

/* Textarea */
<textarea className="bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500"></textarea>
```

### Navigation

```tsx
/* Sidebar */
<nav className="bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800">
  {/* Navigation items */}
  <a
    href="/dashboard"
    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
  >
    Dashboard
  </a>
  <a
    href="/applications"
    className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
  >
    Applications
  </a>
</nav>

/* Top Navigation */
<header className="bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
  {/* Header content */}
</header>
```

### Tables

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <tr>
        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
          Data
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Modals

```tsx
/* Modal Backdrop */
<div className="fixed inset-0 bg-black/50 dark:bg-black/70"></div>

/* Modal Content */
<div className="bg-white rounded-lg p-8 shadow-xl dark:bg-gray-800 dark:shadow-gray-900/50">
  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
    Modal Title
  </h2>
  <p className="text-gray-600 dark:text-gray-400 mb-6">
    Modal content
  </p>
  <div className="flex gap-3 justify-end">
    <button className="btn-secondary">Cancel</button>
    <button className="btn-primary">Confirm</button>
  </div>
</div>
```

### Alerts

```tsx
/* Success Alert */
<div className="bg-success-50 border border-success-200 text-success-900 dark:bg-success-900/20 dark:border-success-800 dark:text-success-300 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <CheckCircle className="h-5 w-5 text-success-500 dark:text-success-400" />
    <div>
      <h4 className="font-semibold">Success!</h4>
      <p className="text-sm text-success-700 dark:text-success-400 mt-1">
        Your changes have been saved.
      </p>
    </div>
  </div>
</div>

/* Error Alert */
<div className="bg-error-50 border border-error-200 text-error-900 dark:bg-error-900/20 dark:border-error-800 dark:text-error-300 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <XCircle className="h-5 w-5 text-error-500 dark:text-error-400" />
    <div>
      <h4 className="font-semibold">Error</h4>
      <p className="text-sm text-error-700 dark:text-error-400 mt-1">
        Something went wrong.
      </p>
    </div>
  </div>
</div>
```

### Badges

```tsx
/* Success Badge */
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400">
  Active
</span>

/* Warning Badge */
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400">
  Pending
</span>

/* Error Badge */
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400">
  Failed
</span>

/* Neutral Badge */
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
  Draft
</span>
```

## Shadows

Dark mode requires adjusted shadows:

```css
/* Light Mode Shadows */
.shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }

/* Dark Mode Shadows */
.dark .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.5); }
.dark .shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.5), 0 1px 2px -1px rgb(0 0 0 / 0.5); }
.dark .shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.5); }
.dark .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5); }
.dark .shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5); }
```

**Usage:**
```tsx
<div className="shadow-lg dark:shadow-gray-900/50">
  Card with adjusted dark mode shadow
</div>
```

## CSS Variables Approach

For more flexible theming, use CSS variables:

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 239 84% 67%;
  --primary-foreground: 0 0% 100%;
  --border: 214.3 31.8% 91.4%;
  --ring: 239 84% 67%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 0 0% 100%;
  --card: 222.2 84% 11.8%;
  --card-foreground: 0 0% 100%;
  --primary: 239 85% 77%;
  --primary-foreground: 222.2 84% 4.9%;
  --border: 217.2 32.6% 17.5%;
  --ring: 239 85% 77%;
}
```

**Usage:**
```tsx
<div className="bg-background text-foreground">
  Content adapts to theme
</div>

<div className="bg-card text-card-foreground border border-border">
  Card with theme-aware colors
</div>
```

## Images and Media

### Logo Variants

Provide separate logos for light and dark modes:

```tsx
<div>
  <img
    src="/logo-light.svg"
    alt="ApplyforUs"
    className="h-8 dark:hidden"
  />
  <img
    src="/logo-dark.svg"
    alt="ApplyforUs"
    className="h-8 hidden dark:block"
  />
</div>
```

### Image Opacity

Reduce opacity of images in dark mode for better integration:

```tsx
<img
  src="/feature.jpg"
  alt="Feature"
  className="rounded-lg dark:opacity-80"
/>
```

### Illustrations

```tsx
/* Theme-aware illustration */
<div className="relative">
  <img
    src="/illustration-light.svg"
    alt="Illustration"
    className="dark:hidden"
  />
  <img
    src="/illustration-dark.svg"
    alt="Illustration"
    className="hidden dark:block"
  />
</div>
```

## Code Blocks

```tsx
<pre className="bg-gray-100 border border-gray-200 rounded-lg p-4 overflow-x-auto dark:bg-gray-900 dark:border-gray-800">
  <code className="text-sm font-mono text-gray-900 dark:text-gray-100">
    {codeString}
  </code>
</pre>
```

## Accessibility in Dark Mode

### Contrast Ratios

Maintain WCAG 2.1 AA contrast ratios in both modes:

**Light Mode:**
- Body text (Gray-700 on White): 11.63:1 (AAA)
- Secondary text (Gray-600 on White): 7.57:1 (AAA)
- Primary button (White on Primary-500): 5.14:1 (AA)

**Dark Mode:**
- Body text (White on Gray-900): 17.38:1 (AAA)
- Secondary text (Gray-300 on Gray-900): 8.59:1 (AAA)
- Primary button (Gray-900 on Primary-400): 8.82:1 (AAA)

### Testing

Test both themes thoroughly:
- All text meets contrast requirements
- Focus indicators are visible in both modes
- Interactive elements are distinguishable
- Colors maintain semantic meaning

## Best Practices

### Do's
✓ Test all components in both light and dark modes
✓ Maintain consistent contrast ratios
✓ Use semantic color naming
✓ Provide theme toggle in accessible location
✓ Persist user preference
✓ Use slightly lighter brand colors in dark mode
✓ Adjust shadows for dark backgrounds
✓ Test with actual users in different environments

### Don'ts
✗ Don't use pure black (#000000) for backgrounds
✗ Don't forget to adjust shadows
✗ Don't use the same colors for both modes
✗ Don't rely solely on color to convey meaning
✗ Don't forget about images and illustrations
✗ Don't use overly saturated colors in dark mode
✗ Don't ignore system preference

## Implementation Checklist

- [ ] Configure Tailwind dark mode
- [ ] Set up theme provider
- [ ] Create theme toggle component
- [ ] Update all component styles
- [ ] Adjust colors for proper contrast
- [ ] Update shadows for dark backgrounds
- [ ] Create dark mode variants for logos/images
- [ ] Test all interactive states
- [ ] Verify accessibility standards
- [ ] Persist user preference
- [ ] Respect system preference
- [ ] Document dark mode patterns

## Example: Complete Dark Mode Component

```tsx
export function DashboardCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm dark:shadow-gray-900/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Applications
        </h3>
        <button className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4">
        Track your latest job applications
      </p>

      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                Software Engineer
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Google Inc.
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
              Active
            </span>
          </div>
        </div>
      </div>

      <button className="mt-4 w-full py-2 px-4 bg-primary-500 dark:bg-primary-600 text-white rounded-lg hover:bg-primary-600 dark:hover:bg-primary-700 transition-colors">
        View All Applications
      </button>
    </div>
  );
}
```

---

**Last Updated**: December 2025
