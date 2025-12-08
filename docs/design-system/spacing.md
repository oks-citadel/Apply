# Spacing System

## Overview

The ApplyforUs spacing system creates visual rhythm, hierarchy, and breathing room throughout the interface. Our spacing scale is based on a 4px base unit, providing consistency while allowing flexibility for various layout needs.

## Base Unit

**Base Unit: 4px**

All spacing values are multiples of 4px, creating a harmonious and predictable system that aligns elements on a consistent grid.

## Spacing Scale

| Token | Value | Pixels | Rem | Usage |
|-------|-------|--------|-----|-------|
| spacing-0 | 0 | 0px | 0rem | No spacing |
| spacing-px | 1px | 1px | - | Borders, dividers |
| spacing-0.5 | 0.125rem | 2px | 0.125rem | Micro spacing |
| spacing-1 | 0.25rem | 4px | 0.25rem | Tiny spacing |
| spacing-2 | 0.5rem | 8px | 0.5rem | Small spacing |
| spacing-3 | 0.75rem | 12px | 0.75rem | Compact spacing |
| spacing-4 | 1rem | 16px | 1rem | Base spacing |
| spacing-5 | 1.25rem | 20px | 1.25rem | Comfortable spacing |
| spacing-6 | 1.5rem | 24px | 1.5rem | Medium spacing |
| spacing-8 | 2rem | 32px | 2rem | Large spacing |
| spacing-10 | 2.5rem | 40px | 2.5rem | Extra large spacing |
| spacing-12 | 3rem | 48px | 3rem | Section spacing |
| spacing-16 | 4rem | 64px | 4rem | Major section spacing |
| spacing-20 | 5rem | 80px | 5rem | Hero spacing |
| spacing-24 | 6rem | 96px | 6rem | Extra hero spacing |
| spacing-32 | 8rem | 128px | 8rem | Layout spacing |
| spacing-40 | 10rem | 160px | 10rem | Page section spacing |
| spacing-48 | 12rem | 192px | 12rem | Large page spacing |
| spacing-56 | 14rem | 224px | 14rem | Extra large page spacing |
| spacing-64 | 16rem | 256px | 16rem | Maximum spacing |

## Spacing Types

### Padding

Internal spacing within elements.

#### Component Padding

```css
/* Button */
padding: 12px 24px; /* py-3 px-6 */

/* Input */
padding: 12px 16px; /* py-3 px-4 */

/* Card */
padding: 24px; /* p-6 */

/* Modal */
padding: 32px; /* p-8 */

/* Container */
padding: 16px; /* p-4 on mobile */
padding: 24px; /* p-6 on desktop */
```

#### Text Padding

```css
/* Paragraph padding */
padding-bottom: 16px; /* pb-4 */

/* List item padding */
padding: 8px 12px; /* py-2 px-3 */

/* Badge padding */
padding: 4px 12px; /* py-1 px-3 */
```

### Margin

External spacing between elements.

#### Component Margins

```css
/* Section margin */
margin-bottom: 48px; /* mb-12 */

/* Card margin */
margin-bottom: 24px; /* mb-6 */

/* Form field margin */
margin-bottom: 16px; /* mb-4 */

/* Button group margin */
margin-right: 12px; /* mr-3 */
```

### Gap

Spacing in flex and grid layouts.

```css
/* Flex gap - horizontal list */
gap: 12px; /* gap-3 */

/* Grid gap */
gap: 24px; /* gap-6 */

/* Stack gap (vertical) */
gap: 16px; /* gap-4 */
```

## Usage Guidelines

### Component-Level Spacing

#### Buttons

```css
/* Button padding */
Small: py-2 px-4 (8px 16px)
Medium: py-3 px-6 (12px 24px)
Large: py-4 px-8 (16px 32px)

/* Button group gap */
gap-3 (12px)
```

#### Cards

```css
/* Card padding */
Compact: p-4 (16px)
Default: p-6 (24px)
Comfortable: p-8 (32px)

/* Card gap (internal elements) */
space-y-4 (16px between children)

/* Card margin */
mb-6 (24px bottom margin)
```

#### Forms

```css
/* Form field spacing */
mb-4 (16px between fields)

/* Label to input */
mb-1 (4px)

/* Input padding */
py-3 px-4 (12px 16px)

/* Form section spacing */
mb-8 (32px between sections)

/* Error message margin */
mt-1 (4px above error)
```

#### Navigation

```css
/* Sidebar padding */
p-6 (24px)

/* Nav item padding */
py-2 px-4 (8px 16px)

/* Nav item gap */
space-y-1 (4px between items)

/* Top nav padding */
py-4 px-6 (16px 24px)
```

#### Tables

```css
/* Table cell padding */
py-3 px-4 (12px 16px)

/* Header cell padding */
py-4 px-4 (16px 16px)

/* Row spacing */
No gap (use borders)
```

#### Modals

```css
/* Modal padding */
p-8 (32px)

/* Modal header margin */
mb-6 (24px)

/* Modal footer margin */
mt-8 (32px)

/* Modal button gap */
gap-3 (12px)
```

### Layout-Level Spacing

#### Page Layout

```css
/* Page container padding */
Mobile: px-4 py-6 (16px, 24px)
Tablet: px-6 py-8 (24px, 32px)
Desktop: px-8 py-12 (32px, 48px)

/* Max width container padding */
px-4 md:px-6 lg:px-8
```

#### Sections

```css
/* Section spacing */
Small: mb-8 (32px)
Default: mb-12 (48px)
Large: mb-16 (64px)
Hero: mb-20 (80px)

/* Section padding */
py-12 (48px top/bottom)
py-16 (64px top/bottom)
py-20 (80px top/bottom)
```

#### Grid Layouts

```css
/* Card grid gap */
gap-6 (24px)

/* Dashboard grid gap */
gap-8 (32px)

/* Compact grid gap */
gap-4 (16px)
```

#### Content Width

```css
/* Max width containers */
max-w-7xl (1280px)
max-w-6xl (1152px)
max-w-5xl (1024px)
max-w-4xl (896px)
max-w-3xl (768px)
max-w-2xl (672px)
max-w-xl (576px)
max-w-lg (512px)
max-w-prose (65ch - ~650px)
```

## Responsive Spacing

### Mobile First

Start with mobile spacing and scale up:

```html
<!-- Responsive padding -->
<div class="p-4 md:p-6 lg:p-8">
  Content
</div>

<!-- Responsive margin -->
<div class="mb-6 md:mb-8 lg:mb-12">
  Section
</div>

<!-- Responsive gap -->
<div class="grid gap-4 md:gap-6 lg:gap-8">
  Grid items
</div>
```

### Breakpoint Spacing

| Breakpoint | Container Padding | Section Spacing | Card Spacing |
|------------|------------------|-----------------|--------------|
| Mobile (< 640px) | 16px (p-4) | 32px (mb-8) | 16px (p-4) |
| Tablet (640px - 1024px) | 24px (p-6) | 48px (mb-12) | 24px (p-6) |
| Desktop (> 1024px) | 32px (p-8) | 64px (mb-16) | 32px (p-8) |

## Visual Rhythm

### Vertical Spacing

Create visual rhythm with consistent vertical spacing:

```html
<div class="space-y-12">
  <!-- Major sections with 48px spacing -->

  <section class="space-y-6">
    <!-- Section with 24px internal spacing -->

    <h2>Section Title</h2>

    <div class="space-y-4">
      <!-- Content with 16px spacing -->
      <p>Content...</p>
      <p>Content...</p>
    </div>
  </section>

  <section class="space-y-6">
    <!-- Another section -->
  </section>
</div>
```

### Horizontal Spacing

```html
<div class="flex gap-6">
  <!-- Items with 24px gap -->
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

## Component Spacing Patterns

### Dashboard Card

```html
<div class="bg-white rounded-lg p-6 shadow-sm space-y-4">
  <h3 class="text-xl font-semibold">Card Title</h3>
  <p class="text-gray-600">Card description</p>
  <div class="flex gap-3 mt-6">
    <button>Action 1</button>
    <button>Action 2</button>
  </div>
</div>
```

**Spacing breakdown:**
- Card padding: 24px (p-6)
- Internal vertical spacing: 16px (space-y-4)
- Button group margin top: 24px (mt-6)
- Button gap: 12px (gap-3)

### Form Layout

```html
<form class="space-y-6">
  <div class="space-y-1">
    <label class="text-sm font-medium">Label</label>
    <input class="py-3 px-4" />
    <p class="text-xs text-gray-500 mt-1">Helper text</p>
  </div>

  <div class="space-y-1">
    <label class="text-sm font-medium">Label</label>
    <input class="py-3 px-4" />
  </div>

  <div class="flex gap-3 pt-2">
    <button>Submit</button>
    <button>Cancel</button>
  </div>
</form>
```

**Spacing breakdown:**
- Form fields: 24px apart (space-y-6)
- Label to input: 4px (space-y-1)
- Helper text: 4px above (mt-1)
- Button group: 8px above (pt-2)
- Buttons: 12px gap (gap-3)

### Navigation Sidebar

```html
<nav class="w-64 bg-white p-6 space-y-6">
  <div class="space-y-1">
    <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
      Main
    </h3>
    <a class="block py-2 px-3 rounded-lg">Dashboard</a>
    <a class="block py-2 px-3 rounded-lg">Applications</a>
    <a class="block py-2 px-3 rounded-lg">Resumes</a>
  </div>

  <div class="space-y-1">
    <h3 class="text-sm font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
      Tools
    </h3>
    <a class="block py-2 px-3 rounded-lg">AI Tools</a>
    <a class="block py-2 px-3 rounded-lg">Auto-Apply</a>
  </div>
</nav>
```

**Spacing breakdown:**
- Sidebar padding: 24px (p-6)
- Section spacing: 24px (space-y-6)
- Nav item spacing: 4px (space-y-1)
- Nav item padding: 8px 12px (py-2 px-3)
- Section header margin: 8px below (mb-2)

## Accessibility Considerations

### Touch Targets

Minimum touch target size: **44x44px** (WCAG 2.1 AA)

```css
/* Button minimum size */
min-height: 44px;
min-width: 44px;

/* Includes padding */
py-3 px-6 (12px + 20px + 12px = 44px height minimum)
```

### Spacing for Focus Indicators

```css
/* Focus ring offset */
focus:ring-offset-2 (8px offset from element)

/* Focus ring width */
focus:ring-2 (2px ring width)
```

### Reading Comfort

```css
/* Line spacing for readability */
leading-relaxed (1.6 line height)

/* Paragraph spacing */
mb-4 (16px between paragraphs)

/* List item spacing */
space-y-2 (8px between list items)
```

## Best Practices

### Do's
✓ Use consistent spacing from the scale
✓ Increase spacing between major sections
✓ Maintain visual hierarchy with spacing
✓ Use responsive spacing for different screens
✓ Group related elements with less spacing
✓ Use space-y and space-x utilities for consistent gaps

### Don'ts
✗ Don't use arbitrary spacing values
✗ Don't use spacing smaller than 4px (except borders)
✗ Don't create equal spacing between unrelated elements
✗ Don't forget responsive spacing adjustments
✗ Don't use negative margins excessively
✗ Don't ignore touch target sizes on mobile

## Common Spacing Patterns

### Micro Spacing (1-2)
- Badge internal padding
- Border width
- Divider height
- Icon-to-text gap

### Small Spacing (3-4)
- Label-to-input gap
- List item padding
- Chip padding
- Form error message margin

### Medium Spacing (5-6)
- Form field gaps
- Card padding
- Button padding
- Nav item padding

### Large Spacing (8-12)
- Section dividers
- Card margins
- Modal padding
- Page sections

### Extra Large Spacing (16-24)
- Major page sections
- Hero section padding
- Page container spacing

## Implementation

### Tailwind Utilities

```html
<!-- Padding -->
<div class="p-4">Padding all sides</div>
<div class="px-6 py-4">Horizontal 24px, Vertical 16px</div>
<div class="pt-8 pb-12">Top 32px, Bottom 48px</div>

<!-- Margin -->
<div class="m-4">Margin all sides</div>
<div class="mx-auto">Auto horizontal margin (centering)</div>
<div class="mt-6 mb-8">Top 24px, Bottom 32px</div>

<!-- Gap -->
<div class="flex gap-4">Flex with 16px gap</div>
<div class="grid gap-6">Grid with 24px gap</div>

<!-- Space Between -->
<div class="space-y-4">16px vertical space between children</div>
<div class="space-x-3">12px horizontal space between children</div>
```

### Responsive Spacing

```html
<div class="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>

<div class="space-y-4 md:space-y-6 lg:space-y-8">
  Responsive vertical spacing
</div>

<div class="grid gap-4 md:gap-6 lg:gap-8">
  Responsive grid gap
</div>
```

### Negative Spacing

Use sparingly for overlapping effects:

```html
<!-- Pull element up -->
<div class="-mt-12">Overlaps previous element</div>

<!-- Pull element left -->
<div class="-ml-4">Extends beyond container</div>
```

---

**Last Updated**: December 2025
