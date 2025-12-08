# ApplyforUs Typography Palette System

## Philosophy

The ApplyforUs typography system balances professional credibility with modern approachability. We use a single font family (Inter) across the platform for consistency, performance, and cohesion, varying weights and sizes to create clear hierarchy and visual interest.

**Core Principles:**
1. **Clarity First**: Every typographic choice prioritizes readability
2. **Systematic Scale**: Consistent sizing ratios create visual harmony
3. **Accessible by Default**: All type meets or exceeds WCAG AA standards
4. **Performance Conscious**: Single font family reduces load times
5. **Responsive**: Typography adapts gracefully across devices

## Font Families

### Primary: Inter (Universal)

**Family**: Inter
**Designer**: Rasmus Andersson
**License**: SIL Open Font License 1.1
**Source**: Google Fonts

**Why Inter?**
- Exceptional clarity at all sizes
- Designed specifically for digital screens
- Extensive character set (supports 200+ languages)
- Open source and free
- Excellent hinting and rendering across platforms
- Professional yet approachable personality

**Weights Available:**
- 100 (Thin) - Not used
- 200 (ExtraLight) - Not used
- 300 (Light) - Not used
- **400 (Regular)** - Body text, standard usage
- **500 (Medium)** - Emphasized body text, labels
- **600 (SemiBold)** - Subheadings, buttons, strong emphasis
- **700 (Bold)** - Headings, high emphasis
- **800 (ExtraBold)** - Display headings, hero text
- 900 (Black) - Not used (too heavy for digital)

**Load Strategy:**
```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

**CSS Variable:**
```css
--font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

### Code/Technical: JetBrains Mono

**Family**: JetBrains Mono
**Designer**: JetBrains
**License**: SIL Open Font License 1.1
**Source**: Google Fonts

**Why JetBrains Mono?**
- Designed for code readability
- Increased height for better glyph distinction
- Ligature support for common code patterns
- Clear distinction between similar characters (0/O, 1/l/I)
- Modern, approachable personality

**Weights Available:**
- **400 (Regular)** - Code snippets, data
- **500 (Medium)** - Emphasized code
- **700 (Bold)** - Code headings

**Load Strategy:**
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

**CSS Variable:**
```css
--font-family-mono: 'JetBrains Mono', 'Courier New', Courier, monospace;
```

## Typography Scale

### Desktop Scale (Base: 16px / 1rem)

Built on a modular scale with ratio of 1.25 (major third) for harmonious sizing.

#### Display Typography

**Display 1 (Hero)**
```css
font-size: 60px (3.75rem);
font-weight: 800;
line-height: 1.1;
letter-spacing: -0.02em;
color: var(--neutral-dark);
```
**Usage**: Landing page hero headlines, major announcements
**Max width**: 20 characters per line
**Mobile**: 48px (3rem)

**Display 2**
```css
font-size: 48px (3rem);
font-weight: 700;
line-height: 1.2;
letter-spacing: -0.01em;
color: var(--neutral-dark);
```
**Usage**: Section heroes, feature headlines
**Max width**: 25 characters per line
**Mobile**: 36px (2.25rem)

#### Heading Typography

**H1**
```css
font-size: 36px (2.25rem);
font-weight: 700;
line-height: 1.3;
letter-spacing: 0;
color: var(--neutral-dark);
margin-bottom: 24px;
```
**Usage**: Page titles, main section headers
**Mobile**: 30px (1.875rem)

**H2**
```css
font-size: 30px (1.875rem);
font-weight: 600;
line-height: 1.4;
letter-spacing: 0;
color: var(--neutral-dark);
margin-bottom: 20px;
```
**Usage**: Major subsection headers
**Mobile**: 24px (1.5rem)

**H3**
```css
font-size: 24px (1.5rem);
font-weight: 600;
line-height: 1.4;
letter-spacing: 0;
color: var(--neutral-dark);
margin-bottom: 16px;
```
**Usage**: Card headers, modal titles
**Mobile**: 20px (1.25rem)

**H4**
```css
font-size: 20px (1.25rem);
font-weight: 600;
line-height: 1.5;
letter-spacing: 0;
color: var(--neutral-dark);
margin-bottom: 12px;
```
**Usage**: Small section headers, list titles
**Mobile**: 18px (1.125rem)

**H5**
```css
font-size: 18px (1.125rem);
font-weight: 600;
line-height: 1.5;
letter-spacing: 0;
color: var(--neutral-slate);
margin-bottom: 12px;
```
**Usage**: Subsection labels, emphasized labels
**Mobile**: 16px (1rem)

**H6**
```css
font-size: 16px (1rem);
font-weight: 600;
line-height: 1.5;
letter-spacing: 0.01em;
color: var(--neutral-slate);
margin-bottom: 8px;
text-transform: uppercase;
```
**Usage**: Overline labels, category headers
**Mobile**: 14px (0.875rem)

#### Body Typography

**Body Large (Lead)**
```css
font-size: 18px (1.125rem);
font-weight: 400;
line-height: 1.7;
letter-spacing: 0;
color: var(--neutral-dark);
margin-bottom: 16px;
```
**Usage**: Lead paragraphs, important descriptions
**Max width**: 65 characters per line

**Body Regular (Default)**
```css
font-size: 16px (1rem);
font-weight: 400;
line-height: 1.6;
letter-spacing: 0;
color: var(--neutral-dark);
margin-bottom: 16px;
```
**Usage**: Standard body text, descriptions
**Max width**: 75 characters per line

**Body Medium (Emphasis)**
```css
font-size: 16px (1rem);
font-weight: 500;
line-height: 1.6;
letter-spacing: 0;
color: var(--neutral-dark);
```
**Usage**: Emphasized body text, important notes

**Body Small**
```css
font-size: 14px (0.875rem);
font-weight: 400;
line-height: 1.5;
letter-spacing: 0;
color: var(--neutral-slate);
margin-bottom: 12px;
```
**Usage**: Supporting text, captions, helper text
**Max width**: 80 characters per line

**Body Extra Small**
```css
font-size: 12px (0.75rem);
font-weight: 500;
line-height: 1.4;
letter-spacing: 0.01em;
color: var(--neutral-gray);
```
**Usage**: Fine print, labels, metadata
**Max width**: 90 characters per line

#### UI Element Typography

**Button Large**
```css
font-size: 18px (1.125rem);
font-weight: 600;
line-height: 1;
letter-spacing: 0;
```

**Button Medium (Default)**
```css
font-size: 16px (1rem);
font-weight: 600;
line-height: 1;
letter-spacing: 0;
```

**Button Small**
```css
font-size: 14px (0.875rem);
font-weight: 600;
line-height: 1;
letter-spacing: 0;
```

**Label**
```css
font-size: 14px (0.875rem);
font-weight: 500;
line-height: 1.4;
letter-spacing: 0;
color: var(--neutral-dark);
```

**Input Text**
```css
font-size: 16px (1rem);
font-weight: 400;
line-height: 1.5;
letter-spacing: 0;
color: var(--neutral-dark);
```

**Input Placeholder**
```css
font-size: 16px (1rem);
font-weight: 400;
line-height: 1.5;
letter-spacing: 0;
color: var(--neutral-gray);
```

**Helper Text**
```css
font-size: 13px (0.8125rem);
font-weight: 400;
line-height: 1.4;
letter-spacing: 0;
color: var(--neutral-slate);
```

**Badge/Tag**
```css
font-size: 12px (0.75rem);
font-weight: 600;
line-height: 1;
letter-spacing: 0.02em;
text-transform: uppercase;
```

**Navigation Link**
```css
font-size: 15px (0.9375rem);
font-weight: 500;
line-height: 1.5;
letter-spacing: 0;
```

**Table Header**
```css
font-size: 13px (0.8125rem);
font-weight: 600;
line-height: 1.4;
letter-spacing: 0.02em;
text-transform: uppercase;
color: var(--neutral-slate);
```

**Table Cell**
```css
font-size: 14px (0.875rem);
font-weight: 400;
line-height: 1.5;
letter-spacing: 0;
color: var(--neutral-dark);
```

#### Code Typography

**Code Block**
```css
font-family: var(--font-family-mono);
font-size: 14px (0.875rem);
font-weight: 400;
line-height: 1.7;
letter-spacing: 0;
```

**Inline Code**
```css
font-family: var(--font-family-mono);
font-size: 0.9em (relative to parent);
font-weight: 400;
letter-spacing: 0;
padding: 2px 6px;
background: var(--neutral-lighter);
border-radius: 4px;
```

**Code Comment**
```css
font-family: var(--font-family-mono);
font-size: 14px (0.875rem);
font-weight: 400;
font-style: italic;
color: var(--neutral-gray);
```

## Mobile Typography Scale

### Scaling Strategy
Mobile typography uses a slightly compressed scale to accommodate smaller screens while maintaining readability.

**Scaling Ratios:**
- Display text: 75-80% of desktop
- Headings (H1-H3): 80-85% of desktop
- Headings (H4-H6): 90-95% of desktop
- Body text: 100% (same as desktop, minimum 16px)
- UI elements: 100% (consistent across devices)

### Mobile Breakpoints

```css
/* Mobile First */
@media (max-width: 640px) {
  /* Mobile typography */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Tablet typography (blend between mobile and desktop) */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full desktop typography */
}
```

## Typography Utilities

### CSS Custom Properties

```css
:root {
  /* Font Families */
  --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Courier New', Courier, monospace;

  /* Font Weights */
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  --text-4xl: 2.25rem;     /* 36px */
  --text-5xl: 3rem;        /* 48px */
  --text-6xl: 3.75rem;     /* 60px */

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.1;
  --leading-snug: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1.6;
  --leading-loose: 1.7;

  /* Letter Spacing */
  --tracking-tighter: -0.02em;
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.01em;
  --tracking-wider: 0.02em;
}
```

### Utility Classes

```css
/* Font Families */
.font-primary { font-family: var(--font-family-primary); }
.font-mono { font-family: var(--font-family-mono); }

/* Font Weights */
.font-regular { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }

/* Font Sizes */
.text-xs { font-size: var(--text-xs); }
.text-sm { font-size: var(--text-sm); }
.text-base { font-size: var(--text-base); }
.text-lg { font-size: var(--text-lg); }
.text-xl { font-size: var(--text-xl); }
.text-2xl { font-size: var(--text-2xl); }
.text-3xl { font-size: var(--text-3xl); }
.text-4xl { font-size: var(--text-4xl); }
.text-5xl { font-size: var(--text-5xl); }
.text-6xl { font-size: var(--text-6xl); }

/* Line Heights */
.leading-none { line-height: 1; }
.leading-tight { line-height: 1.1; }
.leading-snug { line-height: 1.3; }
.leading-normal { line-height: 1.5; }
.leading-relaxed { line-height: 1.6; }
.leading-loose { line-height: 1.7; }

/* Letter Spacing */
.tracking-tighter { letter-spacing: -0.02em; }
.tracking-tight { letter-spacing: -0.01em; }
.tracking-normal { letter-spacing: 0; }
.tracking-wide { letter-spacing: 0.01em; }
.tracking-wider { letter-spacing: 0.02em; }

/* Text Transform */
.uppercase { text-transform: uppercase; }
.lowercase { text-transform: lowercase; }
.capitalize { text-transform: capitalize; }
.normal-case { text-transform: none; }

/* Text Decoration */
.underline { text-decoration: underline; }
.line-through { text-decoration: line-through; }
.no-underline { text-decoration: none; }

/* Text Alignment */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }
```

## Typography Components

### Link Styles

**Default Link**
```css
.link {
  color: var(--primary-blue);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.link:hover {
  color: var(--primary-purple);
  text-decoration: underline;
}

.link:focus {
  outline: 2px solid var(--primary-blue);
  outline-offset: 2px;
  border-radius: 2px;
}
```

**Subtle Link**
```css
.link-subtle {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: var(--neutral-light);
  transition: text-decoration-color 0.15s ease;
}

.link-subtle:hover {
  text-decoration-color: var(--primary-blue);
}
```

**Nav Link**
```css
.nav-link {
  font-size: 15px;
  font-weight: 500;
  color: var(--neutral-slate);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.nav-link:hover {
  color: var(--primary-blue);
  background: var(--neutral-lighter);
}

.nav-link.active {
  color: var(--primary-blue);
  font-weight: 600;
}
```

### List Styles

**Unordered List**
```css
.list-default {
  list-style-type: disc;
  padding-left: 24px;
  margin-bottom: 16px;
}

.list-default li {
  margin-bottom: 8px;
  padding-left: 8px;
}
```

**Ordered List**
```css
.list-ordered {
  list-style-type: decimal;
  padding-left: 24px;
  margin-bottom: 16px;
}

.list-ordered li {
  margin-bottom: 8px;
  padding-left: 8px;
}
```

**Custom Bullet List**
```css
.list-custom {
  list-style: none;
  padding-left: 0;
}

.list-custom li {
  position: relative;
  padding-left: 28px;
  margin-bottom: 12px;
}

.list-custom li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  width: 16px;
  height: 16px;
  background: var(--primary-blue);
  border-radius: 50%;
}
```

### Quote Styles

**Blockquote**
```css
.blockquote {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.7;
  color: var(--neutral-slate);
  font-style: italic;
  border-left: 4px solid var(--primary-blue);
  padding-left: 24px;
  margin: 32px 0;
}

.blockquote-attribution {
  font-size: 14px;
  font-weight: 600;
  font-style: normal;
  color: var(--neutral-dark);
  margin-top: 12px;
}
```

**Pull Quote**
```css
.pull-quote {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--primary-blue);
  text-align: center;
  margin: 48px auto;
  max-width: 600px;
}
```

## Accessibility Considerations

### Minimum Requirements

**Text Size:**
- Body text: Minimum 16px (1rem)
- Small text: Minimum 14px (0.875rem), used sparingly
- Extra small text: Minimum 12px (0.75rem), only for metadata

**Line Height:**
- Body text: Minimum 1.5× font size
- Headings: Minimum 1.2× font size
- Tight leading (1.1) only for large display text (48px+)

**Line Length:**
- Optimal: 50-75 characters per line
- Maximum: 90 characters per line
- Narrow content: 45-60 characters per line

**Contrast Ratios (WCAG AA):**
- Normal text (< 18px): Minimum 4.5:1
- Large text (≥ 18px or ≥ 14px bold): Minimum 3:1
- UI elements: Minimum 3:1

**Color Independence:**
- Never use color alone to convey meaning
- Combine color with weight, size, or icons
- Test in grayscale mode

### Font Loading Strategy

**Performance Best Practices:**
```html
<!-- Preconnect to Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Load fonts with font-display: swap -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

**CSS Font Loading:**
```css
/* Define font-display */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('inter-v12-latin-regular.woff2') format('woff2');
}
```

**Fallback Font Stack:**
```css
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}
```

### Responsive Typography

**Fluid Typography (Optional Enhancement):**
```css
/* Fluid heading sizes using clamp() */
h1 {
  font-size: clamp(30px, 5vw, 60px);
}

h2 {
  font-size: clamp(24px, 4vw, 48px);
}

h3 {
  font-size: clamp(20px, 3vw, 36px);
}
```

**Container Query Typography (Future):**
```css
/* When container queries are widely supported */
@container (min-width: 700px) {
  .card h2 {
    font-size: 24px;
  }
}
```

## Testing Checklist

### Before Launch

- [ ] All fonts load correctly across browsers
- [ ] Fallback fonts are acceptable
- [ ] Text meets WCAG AA contrast requirements
- [ ] Line lengths are within optimal ranges
- [ ] Typography scales appropriately on mobile
- [ ] No text is cut off or overflowing
- [ ] Focus states are visible on all interactive text
- [ ] Print styles are defined for text
- [ ] Text remains readable at 200% zoom
- [ ] Screen readers pronounce all text correctly

### Cross-Browser Testing

Test typography in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Device Testing

Test on:
- [ ] Desktop (1920×1080, 1366×768)
- [ ] Laptop (1440×900)
- [ ] Tablet landscape (1024×768)
- [ ] Tablet portrait (768×1024)
- [ ] Mobile large (414×896)
- [ ] Mobile small (375×667)

---

*Last Updated: December 2025*
*Version: 1.0*
