# ApplyforUs Brand Quick Reference

**One-page cheat sheet for designers, developers, and content creators**

## Brand Name
✅ **ApplyforUs** (single word, capital A, F, U)
❌ Never: Apply For Us, Applyforus, apply4us

## Tagline
**"Apply Smarter, Not Harder"**

## Color Palette

### Primary Colors (Use Most Often)
```
Primary Blue:    #4F46E5  (Trust, main brand color, primary CTAs)
Primary Purple:  #7C3AED  (Innovation, AI features, secondary CTAs)
Primary Indigo:  #312E81  (Depth, headers, dark UI elements)
```

### Semantic Colors
```
Success Green:   #10B981  (Success states, completed actions)
Warning Amber:   #F59E0B  (Warnings, pending states)
Error Red:       #EF4444  (Errors, destructive actions)
```

### Neutral Colors
```
Neutral Dark:    #0F172A  (Primary text, headers)
Neutral Slate:   #475569  (Secondary text, labels)
Neutral Gray:    #94A3B8  (Tertiary text, placeholders)
Neutral Light:   #E2E8F0  (Borders, dividers)
Neutral Lighter: #F8FAFC  (Backgrounds, off-white)
Pure White:      #FFFFFF  (Primary backgrounds)
```

### Accent Colors (Use Sparingly)
```
Accent Cyan:     #06B6D4  (Data visualization, highlights)
Accent Rose:     #F43F5E  (Emphasis, special promotions)
Accent Emerald:  #059669  (Growth metrics, achievements)
```

## Typography

### Font Families
```css
Primary:   'Inter', sans-serif
           Weights: 400, 500, 600, 700, 800

Monospace: 'JetBrains Mono', monospace
           Weights: 400, 500, 700
```

### Font Sizes (Desktop)
```
Display 1:   60px / 3.75rem   (Hero headlines)
Display 2:   48px / 3rem      (Section heroes)
H1:          36px / 2.25rem   (Page titles)
H2:          30px / 1.875rem  (Major sections)
H3:          24px / 1.5rem    (Subsections)
H4:          20px / 1.25rem   (Small headers)
H5:          18px / 1.125rem  (Labels)
H6:          16px / 1rem      (Overlines, uppercase)

Body Large:  18px / 1.125rem  (Lead paragraphs)
Body:        16px / 1rem      (Standard text)
Body Small:  14px / 0.875rem  (Captions)
Body XSmall: 12px / 0.75rem   (Fine print)
```

### Font Weights
```
Regular:    400  (Body text)
Medium:     500  (Emphasis, labels)
SemiBold:   600  (Subheadings, buttons)
Bold:       700  (Headings)
ExtraBold:  800  (Display text only)
```

### Line Heights
```
Display text:  1.1 - 1.2
Headings:      1.3 - 1.5
Body text:     1.6 - 1.7
UI elements:   1.0 - 1.5
```

## Spacing System
**Base unit: 4px**

```
space-1:   4px    space-8:   32px
space-2:   8px    space-10:  40px
space-3:   12px   space-12:  48px
space-4:   16px   space-16:  64px
space-5:   20px   space-20:  80px
space-6:   24px   space-24:  96px
```

### Common Usage
```
Card padding:           24px
Button padding:         10px 20px (medium)
Form label spacing:     8px
Input to input:         16px
Paragraph margin:       16px
Section margin:         48px
Page padding (mobile):  24px
Page padding (desktop): 48px
```

## Component Specs

### Buttons
```css
/* Medium (Default) */
font-size: 16px;
font-weight: 600;
padding: 10px 20px;
border-radius: 8px;
line-height: 1;

/* Large */
font-size: 18px;
padding: 12px 24px;
border-radius: 10px;

/* Small */
font-size: 14px;
padding: 8px 16px;
border-radius: 6px;
```

**Button Colors:**
- Primary: White text on Primary Blue (#4F46E5)
- Secondary: Primary Blue text, Primary Blue border
- Success: White text on Success Green (#10B981)
- Danger: White text on Error Red (#EF4444)

### Cards
```css
background: #FFFFFF;
border-radius: 12px;
padding: 24px;
box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.1);
```

### Inputs
```css
font-size: 16px;
padding: 10px 16px;
border: 1px solid #E2E8F0;
border-radius: 8px;
line-height: 1.5;

/* Focus state */
border-color: #4F46E5;
outline: 2px solid #4F46E5;
outline-offset: 2px;
```

### Border Radius
```
Buttons:  8px
Cards:    12px
Inputs:   8px
Modals:   16px
Badges:   9999px (fully rounded)
Images:   12px
```

## Logo Usage

### Minimum Sizes
```
Horizontal logo:  120px width (digital) / 1.5" (print)
Stacked logo:     60px width (digital) / 0.75" (print)
Icon only:        16×16px (digital) / 0.25" (print)
```

### Clear Space
**Minimum clear space on all sides = height of "A" in wordmark**

### Variations
1. Horizontal color (default)
2. Stacked color (square spaces)
3. Icon only (favicons, apps)
4. White on color (dark backgrounds)
5. Monochrome dark (print)

## CSS Quick Setup

```css
/* Import Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

/* Variables */
:root {
  /* Colors */
  --primary-blue: #4F46E5;
  --primary-purple: #7C3AED;
  --primary-indigo: #312E81;
  --success-green: #10B981;
  --warning-amber: #F59E0B;
  --error-red: #EF4444;
  --neutral-dark: #0F172A;
  --neutral-slate: #475569;
  --neutral-gray: #94A3B8;
  --neutral-light: #E2E8F0;
  --neutral-lighter: #F8FAFC;

  /* Typography */
  --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', Courier, monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

/* Base Styles */
body {
  font-family: var(--font-primary);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--neutral-dark);
  background: #FFFFFF;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  color: var(--neutral-dark);
  margin-bottom: 1rem;
}

a {
  color: var(--primary-blue);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

a:hover {
  color: var(--primary-purple);
}
```

## Brand Voice Checklist

### Do's ✅
- Be direct and clear
- Use active voice
- Address users as "you"
- Lead with benefits
- Use contractions (you're, we'll)
- Keep sentences under 25 words
- Break up text with bullets
- Use specific numbers

### Don'ts ❌
- Avoid corporate jargon
- Don't use passive voice
- No all caps (except acronyms)
- No excessive punctuation!!!
- Don't overpromise
- Avoid buzzwords (disrupt, revolutionary)
- Don't use memes or slang
- No walls of text

## Common Messaging

### Value Proposition
"Save hours on every job application while improving quality and personalization through intelligent AI automation."

### Elevator Pitch (30s)
"ApplyforUs is an AI-powered platform that automates job applications without sacrificing quality. Instead of spending hours copying information into forms, you set your preferences and our AI handles the tedious work—tailoring each application to the specific role. Most users save 10+ hours per week and apply to 5-10x more opportunities."

### Key Benefits
1. Save 10+ hours per week on applications
2. Apply to 5-10x more positions
3. Maintain quality through AI personalization
4. Stay in control - review before sending
5. Track everything in one dashboard

## Accessibility Requirements

### Minimum Standards
- Text contrast: 4.5:1 (normal), 3:1 (large text 18px+)
- Touch targets: 44×44px minimum
- Focus indicators: 2px solid Primary Blue, 2px offset
- Text size: 16px minimum for body text
- Line height: 1.5× minimum for body text
- Never use color alone to convey information

### Testing
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Verify keyboard navigation works
- Check at 200% zoom
- Use automated tools (aXe, WAVE)

## Common Mistakes to Avoid

### Typography
❌ Using font sizes not in the scale
❌ Line heights too tight (< 1.2 for headings, < 1.5 for body)
❌ Lines longer than 90 characters
❌ All caps for long text
❌ Poor contrast (light gray on white)

### Colors
❌ Using colors not in the palette
❌ Low contrast combinations
❌ Color as sole indicator of meaning
❌ Too many colors competing
❌ Inconsistent button colors

### Spacing
❌ Spacing not in multiples of 4px
❌ Inconsistent card padding
❌ Cramped UI (insufficient breathing room)
❌ Excessive spacing that breaks relationships

### Logo
❌ Stretching or distorting the logo
❌ Using wrong color variations
❌ Logo too small to read
❌ Insufficient clear space
❌ Placing on busy backgrounds

## Resources

### Fonts
- Inter: https://fonts.google.com/specimen/Inter
- JetBrains Mono: https://fonts.google.com/specimen/JetBrains+Mono

### Tools
- Contrast Checker: https://webaim.org/resources/contrastchecker/
- Color Converter: https://htmlcolorcodes.com/
- Type Scale Calculator: https://type-scale.com/

### Full Documentation
- Brand Story: `applyforus_brand_story.md`
- Messaging Framework: `applyforus_messaging_framework.md`
- Visual Identity: `visual_identity_guide.md`
- Typography System: `typography_palette_system.md`

---

**Last Updated**: December 2025 | **Version**: 1.0
