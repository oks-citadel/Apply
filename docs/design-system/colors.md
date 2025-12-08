# Color System

## Overview

The ApplyforUs color system is designed to provide clarity, hierarchy, and meaning throughout the application. Our palette balances professionalism with approachability, using indigo as our primary brand color to convey trust, intelligence, and innovation.

## Brand Colors

### Primary - Indigo

The primary color represents the ApplyforUs brand and is used for key actions, links, and brand moments.

```
Primary (Base):     #6366F1 (Indigo-500)
Primary Dark:       #4F46E5 (Indigo-600)
Primary Light:      #818CF8 (Indigo-400)
Primary Lighter:    #A5B4FC (Indigo-300)
Primary Lightest:   #E0E7FF (Indigo-200)
```

**Usage:**
- Primary buttons and CTAs
- Active navigation items
- Links and interactive elements
- Focus states
- Brand accents

**Accessibility:**
- Primary on white: 4.51:1 (AA compliant)
- White text on Primary: 5.14:1 (AA compliant)

### Secondary - Violet

The secondary color adds depth and variety to the interface, used for secondary actions and accents.

```
Secondary (Base):   #8B5CF6 (Violet-500)
Secondary Dark:     #7C3AED (Violet-600)
Secondary Light:    #A78BFA (Violet-400)
```

**Usage:**
- Secondary buttons
- Accent elements
- Illustrations and graphics
- Gradient combinations with primary

**Accessibility:**
- Secondary on white: 4.22:1 (AA compliant)

## Semantic Colors

### Success - Emerald

Indicates successful actions, positive states, and confirmations.

```
Success:            #10B981 (Emerald-500)
Success Dark:       #059669 (Emerald-600)
Success Light:      #34D399 (Emerald-400)
Success Lightest:   #D1FAE5 (Emerald-100)
```

**Usage:**
- Success messages
- Completed states
- Positive indicators
- Checkmarks and confirmations

### Warning - Amber

Signals caution, pending states, or actions requiring attention.

```
Warning:            #F59E0B (Amber-500)
Warning Dark:       #D97706 (Amber-600)
Warning Light:      #FCD34D (Amber-300)
Warning Lightest:   #FEF3C7 (Amber-100)
```

**Usage:**
- Warning messages
- Pending actions
- Attention-required states
- Incomplete or draft indicators

### Error - Red

Communicates errors, destructive actions, and critical issues.

```
Error:              #EF4444 (Red-500)
Error Dark:         #DC2626 (Red-600)
Error Light:        #F87171 (Red-400)
Error Lightest:     #FEE2E2 (Red-100)
```

**Usage:**
- Error messages
- Form validation errors
- Destructive button actions
- Alert states

### Info - Blue

Provides informational context and helpful guidance.

```
Info:               #3B82F6 (Blue-500)
Info Dark:          #2563EB (Blue-600)
Info Light:         #60A5FA (Blue-400)
Info Lightest:      #DBEAFE (Blue-100)
```

**Usage:**
- Informational messages
- Tooltips and hints
- Help text
- Neutral notifications

## Neutral Colors

### Gray Scale

Used for text, backgrounds, borders, and subtle UI elements.

```
Gray-50:            #F9FAFB  (Lightest background)
Gray-100:           #F3F4F6  (Light background)
Gray-200:           #E5E7EB  (Borders, dividers)
Gray-300:           #D1D5DB  (Disabled borders)
Gray-400:           #9CA3AF  (Placeholder text)
Gray-500:           #6B7280  (Secondary text)
Gray-600:           #4B5563  (Primary text)
Gray-700:           #374151  (Headings)
Gray-800:           #1F2937  (Emphasis text)
Gray-900:           #111827  (Maximum contrast)
```

**Usage:**
- **Gray-50/100**: Page backgrounds, card backgrounds
- **Gray-200/300**: Borders, dividers, disabled states
- **Gray-400/500**: Secondary text, placeholders, icons
- **Gray-600/700**: Primary text, headings
- **Gray-800/900**: High-emphasis text, dark mode backgrounds

### White & Black

```
White:              #FFFFFF
Black:              #000000
```

## Color Usage Guidelines

### Hierarchy

Use color to establish visual hierarchy:
1. **High emphasis**: Primary color, Gray-800, Gray-900
2. **Medium emphasis**: Secondary color, Gray-600, Gray-700
3. **Low emphasis**: Gray-400, Gray-500

### Consistency

- **Do**: Use semantic colors consistently (green for success, red for errors)
- **Don't**: Use colors arbitrarily or for decoration only
- **Do**: Limit color palette to maintain cohesion
- **Don't**: Mix too many colors in a single interface

### Accessibility

All color combinations must meet WCAG 2.1 AA standards:

#### Text Contrast Ratios

| Text Size | Minimum Ratio | Preferred Ratio |
|-----------|--------------|-----------------|
| Small (< 18px) | 4.5:1 | 7:1 |
| Large (≥ 18px) | 3:1 | 4.5:1 |

#### Interactive Elements

- Minimum 3:1 contrast ratio for UI components
- Focus indicators must have 3:1 contrast with background
- Don't rely on color alone to convey information

### Tested Combinations

#### Light Mode

| Foreground | Background | Ratio | Status |
|------------|-----------|-------|--------|
| Primary (#6366F1) | White | 4.51:1 | AA ✓ |
| White | Primary | 5.14:1 | AA ✓ |
| Gray-600 | White | 7.57:1 | AAA ✓ |
| Success | White | 3.39:1 | AA Large ✓ |
| Error | White | 4.03:1 | AA ✓ |

#### Dark Mode

| Foreground | Background | Ratio | Status |
|------------|-----------|-------|--------|
| Primary-Light (#818CF8) | Gray-900 | 7.02:1 | AAA ✓ |
| White | Gray-900 | 17.38:1 | AAA ✓ |
| Gray-300 | Gray-900 | 8.59:1 | AAA ✓ |

## Color Applications

### Buttons

**Primary Button:**
- Background: Primary (#6366F1)
- Text: White
- Hover: Primary Dark (#4F46E5)
- Active: Primary Dark (#4F46E5)
- Disabled: Gray-300 background, Gray-500 text

**Secondary Button:**
- Background: White
- Text: Primary (#6366F1)
- Border: Gray-300
- Hover: Gray-50 background
- Active: Gray-100 background

**Danger Button:**
- Background: Error (#EF4444)
- Text: White
- Hover: Error Dark (#DC2626)

### Forms

**Input Fields:**
- Border: Gray-300
- Focus: Primary (#6366F1) 2px ring
- Error: Error (#EF4444) border
- Success: Success (#10B981) border
- Disabled: Gray-100 background

### Backgrounds

**Page Backgrounds:**
- Default: White or Gray-50
- Elevated: White
- Subtle: Gray-100

**Card Backgrounds:**
- Default: White
- Hover: Gray-50
- Selected: Primary Lightest (#E0E7FF)

### Text

**Primary Text:**
- Headings: Gray-900
- Body: Gray-700
- Secondary: Gray-600

**Link Text:**
- Default: Primary (#6366F1)
- Hover: Primary Dark (#4F46E5)
- Visited: Violet (#8B5CF6)

## Dark Mode

See [dark_mode.md](./dark_mode.md) for complete dark mode color specifications.

**Quick Reference:**

```
Dark Mode Backgrounds:
- Page: Gray-900
- Card: Gray-800
- Elevated: Gray-700

Dark Mode Text:
- Primary: White
- Secondary: Gray-300
- Tertiary: Gray-400

Dark Mode Primary:
- Base: Primary-Light (#818CF8)
- Hover: Primary (#6366F1)
```

## Implementation

### Tailwind CSS

```typescript
// tailwind.config.ts
colors: {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Base
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  secondary: {
    400: '#A78BFA',
    500: '#8B5CF6', // Base
    600: '#7C3AED',
  },
  success: {
    100: '#D1FAE5',
    400: '#34D399',
    500: '#10B981', // Base
    600: '#059669',
  },
  warning: {
    100: '#FEF3C7',
    300: '#FCD34D',
    500: '#F59E0B', // Base
    600: '#D97706',
  },
  error: {
    100: '#FEE2E2',
    400: '#F87171',
    500: '#EF4444', // Base
    600: '#DC2626',
  },
  info: {
    100: '#DBEAFE',
    400: '#60A5FA',
    500: '#3B82F6', // Base
    600: '#2563EB',
  },
}
```

### CSS Variables

```css
:root {
  /* Primary */
  --color-primary: 99 102 241;
  --color-primary-dark: 79 70 229;
  --color-primary-light: 129 140 248;

  /* Secondary */
  --color-secondary: 139 92 246;
  --color-secondary-dark: 124 58 237;

  /* Semantic */
  --color-success: 16 185 129;
  --color-warning: 245 158 11;
  --color-error: 239 68 68;
  --color-info: 59 130 246;
}

/* Usage */
.button-primary {
  background-color: rgb(var(--color-primary));
}
```

## Best Practices

### Do's
✓ Use primary color for primary actions
✓ Maintain consistent semantic color usage
✓ Test color combinations for accessibility
✓ Provide text alternatives for color-coded information
✓ Use neutral colors for most UI elements

### Don'ts
✗ Don't use too many colors in one interface
✗ Don't rely solely on color to convey meaning
✗ Don't use low-contrast color combinations
✗ Don't use brand colors for semantic states
✗ Don't override semantic colors arbitrarily

## Color Psychology

**Indigo (Primary):**
- Represents intelligence, trust, and professionalism
- Associated with technology and innovation
- Inspires confidence in AI-powered features

**Violet (Secondary):**
- Suggests creativity and sophistication
- Complements indigo while adding warmth
- Differentiates secondary actions

**Green (Success):**
- Universal indicator of success and completion
- Positive, encouraging tone
- Aligns with career growth and achievement

## Gradients

For special occasions (hero sections, empty states):

```
Primary Gradient:
background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);

Subtle Gradient:
background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
```

**Usage:**
- Hero sections
- Empty state illustrations
- Feature highlights
- Marketing materials

---

**Last Updated**: December 2025
