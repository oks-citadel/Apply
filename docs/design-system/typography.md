# Typography System

## Overview

Typography is fundamental to the ApplyforUs user experience. Our typography system balances readability, hierarchy, and personality, using Inter for UI elements and Plus Jakarta Sans for headings to create a modern, professional aesthetic.

## Font Families

### Plus Jakarta Sans (Headings)

Plus Jakarta Sans is our display font, used for headings, titles, and emphasis text. It's a geometric sans-serif that conveys modernity and approachability.

```css
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Weights Available:**
- 400 (Regular)
- 500 (Medium)
- 600 (Semibold)
- 700 (Bold)

**Usage:**
- Page titles (H1)
- Section headings (H2-H6)
- Card titles
- Marketing copy
- Feature highlights

### Inter (UI & Body Text)

Inter is our primary UI font, optimized for screen readability at all sizes. Its neutral character supports long-form reading and interface clarity.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Weights Available:**
- 400 (Regular)
- 500 (Medium)
- 600 (Semibold)
- 700 (Bold)

**Usage:**
- Body text
- Form labels and inputs
- Button text
- Navigation items
- Table content
- Descriptions

### Monospace (Code)

For code snippets and technical content:

```css
font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Courier New', monospace;
```

## Font Scale

Our type scale follows a modular scale with a 1.25 ratio, providing clear hierarchy while maintaining harmony.

| Token | Size | Line Height | Usage |
|-------|------|-------------|-------|
| text-xs | 12px (0.75rem) | 16px (1.33) | Captions, labels, helper text |
| text-sm | 14px (0.875rem) | 20px (1.43) | Small body text, table cells |
| text-base | 16px (1rem) | 24px (1.5) | Body text, default size |
| text-lg | 18px (1.125rem) | 28px (1.56) | Emphasized body text |
| text-xl | 20px (1.25rem) | 28px (1.4) | Small headings, card titles |
| text-2xl | 24px (1.5rem) | 32px (1.33) | H4 headings |
| text-3xl | 30px (1.875rem) | 36px (1.2) | H3 headings |
| text-4xl | 36px (2.25rem) | 40px (1.11) | H2 headings |
| text-5xl | 48px (3rem) | 48px (1.0) | H1 headings, page titles |
| text-6xl | 60px (3.75rem) | 60px (1.0) | Display, hero headings |
| text-7xl | 72px (4.5rem) | 72px (1.0) | Large display, marketing |

## Line Heights

Line height affects readability and vertical rhythm.

| Token | Value | Usage |
|-------|-------|-------|
| leading-none | 1.0 | Large display text, headings |
| leading-tight | 1.2 | Headings, tight layouts |
| leading-snug | 1.4 | Subheadings, card titles |
| leading-normal | 1.5 | Body text (default) |
| leading-relaxed | 1.6 | Long-form reading |
| leading-loose | 2.0 | Spacious layouts, poetry |

**Guidelines:**
- **Headings**: Use tighter line heights (1.0-1.2)
- **Body text**: Use normal to relaxed (1.5-1.6)
- **Small text**: Use normal to snug (1.4-1.5)

## Font Weights

| Token | Weight | Usage |
|-------|--------|-------|
| font-normal | 400 | Body text, default weight |
| font-medium | 500 | Emphasized text, labels |
| font-semibold | 600 | Subheadings, button text |
| font-bold | 700 | Headings, strong emphasis |

**Guidelines:**
- **Body text**: 400 (normal)
- **Labels**: 500 (medium)
- **Buttons**: 600 (semibold)
- **Headings**: 600-700 (semibold to bold)

## Heading Styles

### H1 - Page Title

```css
font-family: 'Plus Jakarta Sans';
font-size: 48px (3rem);
font-weight: 700;
line-height: 1.0;
color: Gray-900 (#111827);
```

**Usage:** Main page headings, hero titles

**Example:**
```html
<h1 class="text-5xl font-bold leading-none text-gray-900">
  Your Dashboard
</h1>
```

### H2 - Section Heading

```css
font-family: 'Plus Jakarta Sans';
font-size: 36px (2.25rem);
font-weight: 700;
line-height: 1.11;
color: Gray-900 (#111827);
```

**Usage:** Major section headings, modal titles

**Example:**
```html
<h2 class="text-4xl font-bold text-gray-900">
  Recent Applications
</h2>
```

### H3 - Subsection Heading

```css
font-family: 'Plus Jakarta Sans';
font-size: 30px (1.875rem);
font-weight: 600;
line-height: 1.2;
color: Gray-800 (#1F2937);
```

**Usage:** Subsection headings, large card titles

**Example:**
```html
<h3 class="text-3xl font-semibold text-gray-800">
  Application Status
</h3>
```

### H4 - Card Heading

```css
font-family: 'Plus Jakarta Sans';
font-size: 24px (1.5rem);
font-weight: 600;
line-height: 1.33;
color: Gray-800 (#1F2937);
```

**Usage:** Card headings, panel titles

**Example:**
```html
<h4 class="text-2xl font-semibold text-gray-800">
  Resume Builder
</h4>
```

### H5 - Small Heading

```css
font-family: 'Plus Jakarta Sans';
font-size: 20px (1.25rem);
font-weight: 600;
line-height: 1.4;
color: Gray-700 (#374151);
```

**Usage:** Small section headings, list headers

### H6 - Micro Heading

```css
font-family: 'Plus Jakarta Sans';
font-size: 18px (1.125rem);
font-weight: 600;
line-height: 1.56;
color: Gray-700 (#374151);
```

**Usage:** Sidebar headings, compact sections

## Body Text Styles

### Large Body

```css
font-family: 'Inter';
font-size: 18px (1.125rem);
font-weight: 400;
line-height: 1.56;
color: Gray-700 (#374151);
```

**Usage:** Lead paragraphs, emphasized content

### Body (Default)

```css
font-family: 'Inter';
font-size: 16px (1rem);
font-weight: 400;
line-height: 1.5;
color: Gray-700 (#374151);
```

**Usage:** Standard body text, descriptions, paragraphs

**Example:**
```html
<p class="text-base text-gray-700">
  This is the default body text style.
</p>
```

### Small Body

```css
font-family: 'Inter';
font-size: 14px (0.875rem);
font-weight: 400;
line-height: 1.43;
color: Gray-600 (#4B5563);
```

**Usage:** Secondary information, table cells, form help text

### Caption

```css
font-family: 'Inter';
font-size: 12px (0.75rem);
font-weight: 400;
line-height: 1.33;
color: Gray-500 (#6B7280);
```

**Usage:** Captions, timestamps, footnotes

## UI Text Styles

### Button Text

```css
font-family: 'Inter';
font-size: 16px (1rem);
font-weight: 600;
line-height: 1.5;
letter-spacing: 0.01em;
```

**Usage:** All button labels

### Label

```css
font-family: 'Inter';
font-size: 14px (0.875rem);
font-weight: 500;
line-height: 1.43;
color: Gray-700 (#374151);
```

**Usage:** Form labels, input labels

### Input Text

```css
font-family: 'Inter';
font-size: 16px (1rem);
font-weight: 400;
line-height: 1.5;
color: Gray-900 (#111827);
```

**Usage:** Input fields, textarea

### Placeholder Text

```css
font-family: 'Inter';
font-size: 16px (1rem);
font-weight: 400;
line-height: 1.5;
color: Gray-400 (#9CA3AF);
```

**Usage:** Placeholder text in inputs

### Link Text

```css
font-family: 'Inter';
font-size: inherit;
font-weight: 500;
line-height: inherit;
color: Primary (#6366F1);
text-decoration: underline;
text-underline-offset: 2px;
```

**Usage:** Inline links, navigation links

## Special Styles

### Overline

```css
font-family: 'Inter';
font-size: 12px (0.75rem);
font-weight: 600;
line-height: 1.33;
letter-spacing: 0.1em;
text-transform: uppercase;
color: Gray-500 (#6B7280);
```

**Usage:** Category labels, section tags

**Example:**
```html
<span class="text-xs font-semibold uppercase tracking-wider text-gray-500">
  Featured
</span>
```

### Code

```css
font-family: 'JetBrains Mono', monospace;
font-size: 14px (0.875rem);
font-weight: 400;
line-height: 1.43;
color: Primary-Dark (#4F46E5);
background: Gray-100 (#F3F4F6);
padding: 2px 6px;
border-radius: 4px;
```

**Usage:** Inline code, technical terms

### Blockquote

```css
font-family: 'Plus Jakarta Sans';
font-size: 20px (1.25rem);
font-weight: 500;
line-height: 1.4;
font-style: italic;
color: Gray-700 (#374151);
border-left: 4px solid Primary (#6366F1);
padding-left: 20px;
```

**Usage:** Testimonials, pull quotes

## Responsive Typography

### Mobile (< 768px)

Scale down headings for better mobile readability:

```css
/* H1 on mobile */
text-5xl → text-4xl (48px → 36px)

/* H2 on mobile */
text-4xl → text-3xl (36px → 30px)

/* H3 on mobile */
text-3xl → text-2xl (30px → 24px)
```

**Example:**
```html
<h1 class="text-4xl md:text-5xl font-bold">
  Page Title
</h1>
```

### Tablet (768px - 1024px)

Use intermediate sizes or mobile/desktop based on context.

### Desktop (> 1024px)

Full scale as specified above.

## Accessibility

### Minimum Sizes

- **Body text**: Minimum 16px for readability
- **Small text**: Minimum 14px, use sparingly
- **Captions**: Minimum 12px, high contrast required

### Contrast Requirements

| Text Size | Weight | Min. Contrast |
|-----------|--------|---------------|
| < 18px | Any | 4.5:1 |
| ≥ 18px | Any | 3:1 |
| < 18px | Bold (700+) | 3:1 |

### Line Length

- **Optimal**: 50-75 characters per line
- **Maximum**: 90 characters per line
- Use `max-w-prose` for body text containers

### Letter Spacing

- **Body text**: Default (0)
- **Headings**: Slightly tighter (-0.01em to -0.02em)
- **Small text**: Default to slightly wider (0 to 0.01em)
- **All caps**: Wider spacing (0.05em to 0.1em)

## Implementation

### Tailwind Configuration

```typescript
// tailwind.config.ts
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      display: ['Plus Jakarta Sans', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'monospace'],
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
      '4xl': ['36px', { lineHeight: '40px' }],
      '5xl': ['48px', { lineHeight: '48px' }],
      '6xl': ['60px', { lineHeight: '60px' }],
      '7xl': ['72px', { lineHeight: '72px' }],
    },
  },
}
```

### Loading Fonts

```html
<!-- In <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Or use Next.js Font Optimization:

```typescript
// app/layout.tsx
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});
```

## Best Practices

### Do's
✓ Use system font stack as fallback
✓ Load fonts with `font-display: swap`
✓ Limit font weights to those actually used
✓ Use relative units (rem) for scalability
✓ Maintain consistent hierarchy
✓ Test with different font sizes (browser zoom)

### Don'ts
✗ Don't use more than 2-3 font families
✗ Don't load unnecessary font weights
✗ Don't use font sizes smaller than 12px
✗ Don't use low-contrast text colors
✗ Don't rely solely on size for hierarchy
✗ Don't use decorative fonts for body text

## Examples

### Dashboard Header

```html
<div class="space-y-2">
  <span class="text-xs font-semibold uppercase tracking-wider text-gray-500">
    Dashboard
  </span>
  <h1 class="text-4xl md:text-5xl font-bold text-gray-900 font-display">
    Welcome back, Sarah
  </h1>
  <p class="text-lg text-gray-600">
    Here's what's happening with your applications today.
  </p>
</div>
```

### Card Component

```html
<div class="card">
  <h3 class="text-2xl font-semibold text-gray-800 font-display mb-2">
    Recent Applications
  </h3>
  <p class="text-base text-gray-700 mb-4">
    Track your job applications and their current status.
  </p>
  <span class="text-sm text-gray-500">
    Updated 5 minutes ago
  </span>
</div>
```

### Form Field

```html
<div class="space-y-1">
  <label class="text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input
    type="email"
    placeholder="you@example.com"
    class="text-base text-gray-900 placeholder:text-gray-400"
  />
  <p class="text-xs text-gray-500">
    We'll never share your email with anyone.
  </p>
</div>
```

---

**Last Updated**: December 2025
