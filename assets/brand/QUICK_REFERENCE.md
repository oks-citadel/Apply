# ApplyforUs Brand Quick Reference

One-page reference for the most commonly used brand elements.

---

## Logo

### Primary Logo: "The Navigator" (Recommended)
- Compass/arrow design with "A" letterform
- Color: Gradient #6366F1 → #8B5CF6
- Minimum size: 120px digital / 0.75" print
- Clear space: 1.5× height of "A"

### Logo Variants
- **Horizontal**: Default, most uses
- **Icon Only**: Small sizes, favicons, app icons
- **Dark Mode**: Use on #1F2937 or darker backgrounds
- **Monochrome**: Single-color printing

---

## Brand Colors

### Primary Colors
```
Indigo-500    #6366F1  rgb(99, 102, 241)   Primary brand color
Violet-500    #8B5CF6  rgb(139, 92, 246)   Secondary brand color
Emerald-500   #10B981  rgb(16, 185, 129)   Success / positive
Amber-500     #F59E0B  rgb(245, 158, 11)   Warning / attention
Red-500       #EF4444  rgb(239, 68, 68)    Error / destructive
```

### Neutral Colors
```
Gray-50       #F9FAFB  rgb(249, 250, 251)  Light backgrounds
Gray-100      #F3F4F6  rgb(243, 244, 246)  Card backgrounds
Gray-200      #E5E7EB  rgb(229, 231, 235)  Borders, dividers
Gray-500      #6B7280  rgb(107, 114, 128)  Secondary text
Gray-800      #1F2937  rgb(31, 41, 55)     Primary text
Gray-900      #111827  rgb(17, 23, 39)     Dark backgrounds
White         #FFFFFF  rgb(255, 255, 255)  Pure white
Black         #000000  rgb(0, 0, 0)        Pure black
```

### Dark Mode Colors
```
Indigo-400    #818CF8  Replace Indigo-500
Violet-400    #A78BFA  Replace Violet-500
Emerald-400   #34D399  Replace Emerald-500
Amber-400     #FBBF24  Replace Amber-500
Red-400       #F87171  Replace Red-500
```

---

## Typography

### Fonts
- **Primary**: Inter (Sans-serif)
- **Alternatives**: Outfit, Space Grotesk

### Sizes & Weights
```
Headings (H1)    48-80px    Bold (700)     Line-height: 1.1-1.2
Headings (H2-H3) 32-48px    Bold (700)     Line-height: 1.2
Body Text        16-20px    Regular (400)  Line-height: 1.5
                             Medium (500)
UI Elements      14-16px    Medium (500)   Line-height: 1.4
                             SemiBold (600)
```

### Text Colors
```
Light Mode:
- Primary text:     Gray-800 (#1F2937)
- Secondary text:   Gray-500 (#6B7280)
- Links:            Indigo-600 (#4F46E5)

Dark Mode:
- Primary text:     Gray-50 (#F9FAFB)
- Secondary text:   Gray-400 (#9CA3AF)
- Links:            Indigo-400 (#818CF8)
```

---

## Contrast Ratios (WCAG AA)

### Light Mode (on White #FFFFFF)
```
✓ Gray-800     14.99:1  (AAA) Primary text
✓ Gray-600      7.43:1  (AAA) Body text
✓ Gray-500      4.66:1  (AA)  Secondary text
✓ Indigo-600    6.57:1  (AA)  Primary buttons
✓ Emerald-600   5.39:1  (AA)  Success text
✓ Amber-700     5.35:1  (AA)  Warning text
✓ Red-600       5.53:1  (AA)  Error text
```

### Dark Mode (on Gray-800 #1F2937)
```
✓ White        14.99:1  (AAA) Primary text
✓ Gray-50      14.35:1  (AAA) Body text
✓ Gray-400      3.1:1   (AA Large) Secondary text
✓ Indigo-400    5.5:1   (AA)  Primary buttons
✓ Emerald-400   7.15:1  (AAA) Success text
✓ Amber-400     9.85:1  (AAA) Warning text
✓ Red-400       6.73:1  (AA)  Error text
```

---

## Gradients

### Primary Gradient
```css
background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
```
Use: Hero sections, primary CTAs, feature cards

### Success Gradient
```css
background: linear-gradient(135deg, #10B981 0%, #14B8A6 100%);
```
Use: Success states, achievement badges

### Warm Gradient
```css
background: linear-gradient(135deg, #F59E0B 0%, #F97316 100%);
```
Use: Highlights, energy elements (sparingly)

---

## Logo Usage

### Do's ✓
- Always use official logo files
- Maintain aspect ratio
- Respect clear space (1.5× "A" height)
- Use appropriate color version (light/dark)
- Ensure minimum size (120px / 0.75")

### Don'ts ✗
- Never recreate or modify logo
- Don't stretch or distort
- Don't violate clear space
- Don't use wrong color version
- Don't make it too small

---

## Social Media Sizes

### Profile Photos (All Circular)
```
LinkedIn    400×400px
Twitter     400×400px
Facebook    180×180px
Instagram   320×320px
YouTube     800×800px
```

### Cover Photos
```
LinkedIn    1584×396px
Twitter     1500×500px
Facebook    820×312px
YouTube     2560×1440px (with safe zones)
```

### Posts
```
Square      1080×1080px  (Instagram, Facebook, LinkedIn)
Landscape   1200×627px   (Twitter, LinkedIn, Facebook)
Story       1080×1920px  (Instagram, Facebook, TikTok)
YouTube     1280×720px   (Thumbnails)
```

---

## Common Use Cases

### Website Header
- Logo: 120-140px wide, top-left
- Padding: 20-40px from edges
- Version: Horizontal logo
- Color: Match background (light/dark mode)

### Button Styles
```css
/* Primary Button */
background: #6366F1;
color: #FFFFFF;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;

/* Primary Button (Hover) */
background: #4F46E5;

/* Secondary Button */
background: transparent;
border: 2px solid #6366F1;
color: #6366F1;

/* Destructive Button */
background: #EF4444;
color: #FFFFFF;
```

### Card Styles
```css
/* Light Mode Card */
background: #FFFFFF;
border: 1px solid #E5E7EB;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

/* Dark Mode Card */
background: #1F2937;
border: 1px solid #374151;
border-radius: 12px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
```

### Input Fields
```css
/* Text Input */
background: #FFFFFF;
border: 1px solid #D1D5DB;
border-radius: 8px;
padding: 10px 14px;
font-size: 16px;

/* Input Focus */
border-color: #6366F1;
outline: 2px solid rgba(99, 102, 241, 0.2);
```

---

## Icon Guidelines

### Specifications
- Base size: 24×24px grid
- Stroke weight: 2px (standard), 1.5px (small)
- Corner radius: 2px
- Export sizes: 16px, 20px, 24px, 32px, 48px

### Icon Colors
```
Default       Gray-500 (#6B7280)
Hover         Indigo-500 (#6366F1)
Active        Indigo-600 (#4F46E5)
Disabled      Gray-300 (#D1D5DB)
```

### Common Icons
- Navigation: Dashboard, Jobs, Resumes, Auto-Apply, AI Tools
- Actions: Add, Edit, Delete, Save, Share, Search
- Status: Success (✓), Warning (⚠), Error (✗), Info (i)

---

## Spacing Scale

### Consistent Spacing (8px base unit)
```
4px    (0.25rem)  Tight spacing
8px    (0.5rem)   Small spacing
12px   (0.75rem)  Compact spacing
16px   (1rem)     Base spacing
24px   (1.5rem)   Medium spacing
32px   (2rem)     Large spacing
40px   (2.5rem)   XL spacing
48px   (3rem)     XXL spacing
64px   (4rem)     Huge spacing
```

### Component Padding
```
Buttons:        12px 24px
Cards:          16px (mobile), 24px (desktop)
Containers:     20px (mobile), 40px (desktop)
Sections:       40px (mobile), 80px (desktop)
```

---

## Border Radius Scale

```
Small      4px    Small elements, badges
Default    8px    Buttons, inputs, cards
Medium     12px   Cards, modals
Large      16px   Large cards, sections
Full       9999px Circular (pills, avatars)
```

---

## File Naming Convention

### Logo Files
```
applyus-logo-[variant]-[color]-[size].[ext]

Examples:
applyus-logo-horizontal-gradient-2x.png
applyus-icon-gradient.svg
applyus-logo-dark-mode.svg
```

### Other Assets
```
[category]-[type]-[name]-[variant].[ext]

Examples:
illustration-hero-job-search.svg
icon-nav-dashboard-24.svg
pattern-dot-grid.svg
mockup-web-desktop-dashboard.png
```

---

## CSS Variables

### Light Mode
```css
:root {
  /* Colors */
  --color-primary: #6366F1;
  --color-secondary: #8B5CF6;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;

  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-tertiary: #F3F4F6;

  /* Text */
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;

  /* Borders */
  --border-primary: #E5E7EB;
  --border-secondary: #D1D5DB;
}
```

### Dark Mode
```css
.dark {
  /* Colors */
  --color-primary: #818CF8;
  --color-secondary: #A78BFA;
  --color-success: #34D399;
  --color-warning: #FBBF24;
  --color-error: #F87171;

  /* Backgrounds */
  --bg-primary: #111827;
  --bg-secondary: #1F2937;
  --bg-tertiary: #374151;

  /* Text */
  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;

  /* Borders */
  --border-primary: #374151;
  --border-secondary: #4B5563;
}
```

---

## Accessibility Checklist

### Before Publishing
- ✓ Text contrast meets WCAG AA (4.5:1 minimum)
- ✓ Color is not sole indicator of meaning
- ✓ Logo maintains aspect ratio and clear space
- ✓ Images have alt text
- ✓ Focus states are visible
- ✓ Touch targets are 44×44px minimum (mobile)
- ✓ Works on light and dark backgrounds
- ✓ Tested on actual devices

---

## Contact

**Design Team**: design@applyfor.us
**Slack**: #design-system
**Asset Requests**: #design-requests
**Brand Guidelines**: `/assets/brand/README.md`

---

**Print this page for quick reference while designing!**

Last Updated: January 2025
