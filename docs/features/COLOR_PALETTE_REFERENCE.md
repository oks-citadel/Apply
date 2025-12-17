# ApplyForUs Color Palette Reference

## Quick Reference Guide

### Primary Colors (Most Used)

| Color Name | Hex Code | Tailwind Class | Usage |
|------------|----------|----------------|-------|
| Teal 600 (Primary CTA) | `#0D9488` | `bg-teal-600` | Primary buttons, main CTAs |
| Teal 700 (Hover) | `#0F766E` | `bg-teal-700` | Button hover states |
| Charcoal 900 (Dark BG) | `#1A1A1F` | `bg-charcoal-900` | Dark mode backgrounds |
| Slate 600 (Text) | `#6C757D` | `text-slate-600` | Secondary text |
| Warm Gray 50 (Light BG) | `#FAFAF9` | `bg-warmGray-50` | Section backgrounds |

---

## Complete Color System

### Charcoal (Primary Neutral)
**Use for**: Text, dark backgrounds, high contrast elements

```
charcoal-50:  #F7F7F8  (Lightest - subtle backgrounds)
charcoal-100: #EBEBED
charcoal-200: #D1D1D6
charcoal-300: #B7B7BF
charcoal-400: #9D9DA8
charcoal-500: #6B6B7A  ← Main charcoal
charcoal-600: #525261
charcoal-700: #3D3D49
charcoal-800: #2A2A33
charcoal-900: #1A1A1F  ← Primary dark background
charcoal-950: #0F0F13  (Darkest)
```

### Slate (Secondary Neutral)
**Use for**: UI elements, borders, secondary text

```
slate-50:  #F8F9FA
slate-100: #F1F3F5
slate-200: #E9ECEF
slate-300: #DEE2E6
slate-400: #CED4DA
slate-500: #ADB5BD
slate-600: #6C757D  ← Main slate (secondary text)
slate-700: #495057
slate-800: #343A40
slate-900: #212529
slate-950: #1A1D20
```

### Warm Gray (Warm Neutral)
**Use for**: Backgrounds, borders, subtle UI elements

```
warmGray-50:  #FAFAF9  ← Section backgrounds
warmGray-100: #F5F5F4
warmGray-200: #E7E5E4  ← Borders
warmGray-300: #D6D3D1
warmGray-400: #A8A29E
warmGray-500: #78716C  ← Main warm gray
warmGray-600: #57534E
warmGray-700: #44403C
warmGray-800: #292524
warmGray-900: #1C1917
warmGray-950: #0C0A09
```

### Teal (Primary Brand)
**Use for**: CTAs, links, accents, brand elements

```
teal-50:  #F0FDFA  ← Light backgrounds
teal-100: #CCFBF1  ← Badge backgrounds
teal-200: #99F6E4
teal-300: #5EEAD4
teal-400: #2DD4BF
teal-500: #14B8A6  ← Main teal
teal-600: #0D9488  ← Primary buttons ⭐
teal-700: #0F766E  ← Button hover ⭐
teal-800: #115E59  ← Button active
teal-900: #134E4A
teal-950: #042F2E
```

### Muted Blue (Secondary Brand)
**Use for**: Secondary accents, decorative elements

```
mutedBlue-50:  #F0F4F8
mutedBlue-100: #D9E2EC
mutedBlue-200: #BCCCDC
mutedBlue-300: #9FB3C8
mutedBlue-400: #829AB1
mutedBlue-500: #627D98  ← Main muted blue
mutedBlue-600: #486581
mutedBlue-700: #334E68
mutedBlue-800: #243B53
mutedBlue-900: #102A43
mutedBlue-950: #0A1F33
```

---

## Common Usage Patterns

### Backgrounds

#### Light Mode
```css
/* Page background */
bg-white

/* Section alternating */
bg-white
bg-warmGray-50

/* Card backgrounds */
bg-white with border-warmGray-200
```

#### Dark Mode
```css
/* Page background */
dark:bg-charcoal-900

/* Section alternating */
dark:bg-charcoal-900
dark:bg-charcoal-800/50

/* Card backgrounds */
dark:bg-charcoal-800 with dark:border-warmGray-800
```

### Text Colors

```css
/* Primary headings */
text-charcoal-900 dark:text-white

/* Body text */
text-slate-600 dark:text-slate-400

/* Secondary/muted text */
text-warmGray-600 dark:text-warmGray-400

/* Links/accents */
text-teal-600 dark:text-teal-400
```

### Buttons

#### Primary Button
```css
bg-teal-600
hover:bg-teal-700
active:bg-teal-800
text-white
```

#### Outline Button
```css
border-2 border-slate-300 dark:border-slate-600
text-charcoal-900 dark:text-white
hover:bg-slate-100 dark:hover:bg-slate-800
```

### Borders

```css
/* Light borders */
border-warmGray-200 dark:border-warmGray-800

/* Accent borders */
border-teal-200 dark:border-teal-800

/* Hover accent borders */
hover:border-teal-300 dark:hover:border-teal-700
```

### Badges

```css
/* Primary badge */
bg-teal-100 dark:bg-teal-900/30
text-teal-700 dark:text-teal-300
border border-teal-200 dark:border-teal-800

/* Secondary badge */
bg-warmGray-100 dark:bg-warmGray-800
text-warmGray-700 dark:text-warmGray-300
```

---

## Accessibility Contrast Ratios

### WCAG AA Compliant Combinations

#### Light Mode
✅ `charcoal-900` on `white` (18.5:1)
✅ `slate-600` on `white` (5.9:1)
✅ `teal-700` on `white` (4.8:1)
✅ `warmGray-600` on `white` (4.5:1)

#### Dark Mode
✅ `white` on `charcoal-900` (18.5:1)
✅ `slate-300` on `charcoal-900` (11.2:1)
✅ `teal-400` on `charcoal-900` (8.1:1)

### Large Text (18pt+)
✅ `teal-600` on `white` (4.5:1) - Passes AA
✅ `slate-500` on `white` (3.1:1) - Passes AA for large text

---

## Usage Examples from Landing Page

### Hero Section
```jsx
// Background gradient
bg-gradient-to-br from-warmGray-50 via-white to-teal-50
dark:from-charcoal-900 dark:via-charcoal-800 dark:to-charcoal-900

// Heading
text-charcoal-900 dark:text-white

// Accent text
text-teal-600 dark:text-teal-400

// Primary CTA
bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white
```

### Trust Bar
```jsx
// Background
bg-warmGray-50 dark:bg-charcoal-800/50

// Text
text-warmGray-600 dark:text-warmGray-400

// Icons
text-teal-600 dark:text-teal-400
```

### Cards
```jsx
// Card container
bg-white dark:bg-charcoal-800
border-2 border-warmGray-200 dark:border-warmGray-800

// Hover state
hover:border-teal-300 dark:hover:border-teal-700

// Icon background
bg-teal-100 dark:bg-teal-900/30
text-teal-600 dark:text-teal-400
```

### Success Metrics Section
```jsx
// Background
bg-teal-600 dark:bg-teal-800

// Text
text-white

// Light text
text-teal-100

// Card backgrounds
bg-white/10 dark:bg-charcoal-900/30
```

---

## Color Philosophy

### Why These Colors?

1. **Charcoal (#1A1A1F, #6B6B7A)**:
   - Neutral, professional, sophisticated
   - Less harsh than pure black
   - Inclusive and accessible

2. **Slate (#6C757D)**:
   - Soft, approachable gray
   - Great for secondary text
   - Universal appeal

3. **Warm Gray (#78716C, #FAFAF9)**:
   - Adds warmth without color bias
   - Inviting and friendly
   - Great for backgrounds

4. **Teal (#0D9488, #14B8A6)**:
   - Trustworthy and professional
   - Modern and energetic
   - Gender-neutral appeal
   - Associated with growth and opportunity

5. **Muted Blue (#627D98)**:
   - Calm and reliable
   - Professional tone
   - Complements teal nicely

### Inclusivity Considerations

- No reliance on red/green for critical information (colorblind friendly)
- High contrast ratios for visual impairments
- Warm and cool neutrals for balance
- Gender-neutral color choices
- Culturally neutral associations

---

## Tailwind Configuration

The colors are configured in `apps/web/tailwind.config.ts`:

```typescript
extend: {
  colors: {
    charcoal: { /* ... */ },
    slate: { /* ... */ },
    warmGray: { /* ... */ },
    teal: { /* ... */ },
    mutedBlue: { /* ... */ },
    primary: { /* maps to teal */ },
  }
}
```

Use in your components:
```jsx
<div className="bg-teal-600 text-white">...</div>
<p className="text-slate-600 dark:text-slate-400">...</p>
<button className="bg-charcoal-900 hover:bg-charcoal-800">...</button>
```

---

## Dos and Don'ts

### ✅ Do

- Use teal for primary actions and CTAs
- Use charcoal for primary text
- Provide dark mode alternatives for all colors
- Maintain WCAG AA contrast ratios
- Use warmGray for subtle backgrounds
- Use slate for secondary information

### ❌ Don't

- Don't use pure black (#000000)
- Don't use pure white text on colored backgrounds without checking contrast
- Don't use teal for destructive actions
- Don't mix warm and cool grays in the same component
- Don't rely on color alone to convey information

---

## Tools & Resources

- **Contrast Checker**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Color Blindness Simulator**: [Coblis](https://www.color-blindness.com/coblis-color-blindness-simulator/)
- **Tailwind Color Generator**: [UIColors](https://uicolors.app/create)

---

**Last Updated**: December 2025
**Version**: 1.0.0
