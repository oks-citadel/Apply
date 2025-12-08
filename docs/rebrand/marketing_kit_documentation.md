# ApplyforUs Marketing Kit Documentation

Version 1.0 | Last Updated: December 2025

## Overview

This document provides comprehensive information about the ApplyforUs marketing assets, including asset inventory, usage guidelines, download locations, and licensing information.

## Table of Contents

1. [Asset Inventory](#asset-inventory)
2. [Logo Assets](#logo-assets)
3. [Color Palette](#color-palette)
4. [Typography Assets](#typography-assets)
5. [Icon Library](#icon-library)
6. [Photography & Images](#photography--images)
7. [Social Media Assets](#social-media-assets)
8. [Email Templates](#email-templates)
9. [Presentation Templates](#presentation-templates)
10. [Print Materials](#print-materials)
11. [Usage Rights](#usage-rights)
12. [Download Links](#download-links)

---

## Asset Inventory

### Complete Asset List

| Category | Assets | Formats | Location |
|----------|--------|---------|----------|
| Logos | 15 variations | SVG, PNG, JPG | `/brand/logo/` |
| Icons | 50+ icons | SVG, PNG | `/brand/icons/` |
| Colors | Full palette | CSS, JSON, ASE | `/brand/colors/` |
| Typography | Font files | WOFF2, TTF | `/brand/fonts/` |
| Images | Stock photos | JPG, PNG | `/brand/images/` |
| Social Media | Templates | PNG, PSD, Figma | `/brand/social/` |
| Email | Templates | HTML, Figma | `/brand/email/` |
| Presentations | Templates | PPT, Google Slides | `/brand/presentations/` |
| Print | Business cards, etc. | PDF, AI | `/brand/print/` |

---

## Logo Assets

### Primary Logo Files

**Horizontal Logo:**
```
brand/logo/
├── applyforus-logo-horizontal.svg          (Primary - Vector)
├── applyforus-logo-horizontal.png          (4000x1000px - Large)
├── applyforus-logo-horizontal@2x.png       (2000x500px - Retina)
├── applyforus-logo-horizontal.jpg          (4000x1000px - JPEG)
└── applyforus-logo-horizontal-compressed.png (800x200px - Web)
```

**Vertical Logo:**
```
brand/logo/
├── applyforus-logo-vertical.svg
├── applyforus-logo-vertical.png            (2000x2000px)
├── applyforus-logo-vertical@2x.png         (1000x1000px)
└── applyforus-logo-vertical-compressed.png (400x400px)
```

**Icon/Symbol Only:**
```
brand/logo/
├── applyforus-icon.svg
├── applyforus-icon.png                     (512x512px)
├── applyforus-icon@2x.png                  (256x256px)
├── applyforus-icon@3x.png                  (128x128px)
└── applyforus-icon-rounded.png             (512x512px with rounded corners)
```

### Color Variations

**Light Backgrounds:**
```
brand/logo/light-bg/
├── applyforus-logo-blue.svg                (Primary blue on white)
├── applyforus-logo-blue.png
├── applyforus-logo-black.svg               (Black on white)
└── applyforus-logo-black.png
```

**Dark Backgrounds:**
```
brand/logo/dark-bg/
├── applyforus-logo-white.svg               (White on dark)
├── applyforus-logo-white.png
└── applyforus-logo-light-blue.svg          (Light blue on dark)
```

**Monochrome:**
```
brand/logo/monochrome/
├── applyforus-logo-mono-black.svg
├── applyforus-logo-mono-white.svg
└── applyforus-logo-mono-gray.svg
```

### Usage Guidelines

**When to use each variation:**

| Context | Logo Variation | Background |
|---------|---------------|------------|
| Website Header | Horizontal Blue | White |
| Website Footer | Horizontal White | Dark Blue |
| Social Media Profile | Icon Rounded | Any |
| Email Header | Horizontal Blue | White |
| Presentation Title | Horizontal Blue | White |
| Business Card | Vertical Blue | White |
| T-shirts | Icon White | Colored fabric |
| Documents | Horizontal Black | White |

### Minimum Sizes

**Digital:**
- Horizontal: 120px width minimum
- Vertical: 80px width minimum
- Icon: 24px minimum

**Print:**
- Horizontal: 1 inch width minimum
- Vertical: 0.75 inch width minimum
- Icon: 0.25 inch minimum

### Don'ts

❌ **Don't:**
- Change logo colors outside approved palette
- Rotate or skew the logo
- Add effects (shadows, glows, bevels)
- Stretch or distort proportions
- Place on busy backgrounds without proper contrast
- Recreate or modify the logo
- Use low-resolution versions for print

---

## Color Palette

### Digital Color Files

**CSS Variables:**
```css
/* brand/colors/colors.css */
:root {
  /* Primary */
  --brand-blue: #3B82F6;
  --brand-blue-light: #60A5FA;
  --brand-blue-dark: #2563EB;

  /* Neutrals */
  --brand-white: #FFFFFF;
  --brand-black: #000000;
  --brand-gray-50: #F9FAFB;
  --brand-gray-100: #F3F4F6;
  --brand-gray-500: #6B7280;
  --brand-gray-900: #111827;

  /* Semantic */
  --brand-success: #10B981;
  --brand-warning: #F59E0B;
  --brand-error: #EF4444;
}
```

**JSON Format:**
```json
{
  "brand": {
    "primary": {
      "blue": "#3B82F6",
      "blue-light": "#60A5FA",
      "blue-dark": "#2563EB"
    },
    "neutral": {
      "white": "#FFFFFF",
      "black": "#000000",
      "gray": {
        "50": "#F9FAFB",
        "100": "#F3F4F6",
        "500": "#6B7280",
        "900": "#111827"
      }
    },
    "semantic": {
      "success": "#10B981",
      "warning": "#F59E0B",
      "error": "#EF4444"
    }
  }
}
```

**Adobe Swatch Exchange (.ASE):**
```
brand/colors/applyforus-colors.ase
```

### Color Usage Guide

**Primary Blue (#3B82F6):**
- Primary CTAs
- Links
- Brand elements
- Interactive elements
- Hover states

**Success Green (#10B981):**
- Success messages
- Confirmations
- Positive metrics
- Completed states

**Warning Orange (#F59E0B):**
- Warnings
- Important notices
- Pending states
- Attention items

**Error Red (#EF4444):**
- Errors
- Destructive actions
- Alerts
- Failed states

---

## Typography Assets

### Font Files

```
brand/fonts/
├── Inter/
│   ├── Inter-Regular.woff2
│   ├── Inter-Medium.woff2
│   ├── Inter-SemiBold.woff2
│   ├── Inter-Bold.woff2
│   ├── Inter-ExtraBold.woff2
│   ├── Inter-Regular.ttf
│   ├── Inter-Medium.ttf
│   ├── Inter-SemiBold.ttf
│   ├── Inter-Bold.ttf
│   └── Inter-ExtraBold.ttf
└── LICENSE.txt
```

### Web Font Implementation

```html
<!-- Google Fonts (Recommended) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

```css
/* Self-hosted implementation */
@font-face {
  font-family: 'Inter';
  src: url('/brand/fonts/Inter/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/brand/fonts/Inter/Inter-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

/* Add other weights as needed */
```

### Typography Scale Reference

```
brand/typography/
├── typography-scale.pdf          (Visual reference)
├── typography-scale.svg          (Editable vector)
└── typography-examples.html      (Live examples)
```

---

## Icon Library

### Icon Package

```
brand/icons/
├── system/                       (UI icons)
│   ├── check.svg
│   ├── close.svg
│   ├── arrow-right.svg
│   ├── chevron-down.svg
│   └── ... (50+ icons)
├── features/                     (Feature icons)
│   ├── ai.svg
│   ├── automation.svg
│   ├── resume.svg
│   └── analytics.svg
├── social/                       (Social media icons)
│   ├── twitter.svg
│   ├── linkedin.svg
│   ├── facebook.svg
│   └── instagram.svg
└── favicon/                      (Favicons)
    ├── favicon.ico
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── apple-touch-icon.png
    ├── android-chrome-192x192.png
    └── android-chrome-512x512.png
```

### Icon Specifications

- **Style:** Outlined, 2px stroke
- **Size:** 24x24px base size
- **Format:** SVG (scalable)
- **Color:** Inherits from parent (currentColor)

### Usage Example

```html
<!-- Inline SVG (recommended) -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M5 12h14M12 5l7 7-7 7"/>
</svg>

<!-- As image -->
<img src="/brand/icons/system/check.svg" alt="Check" width="24" height="24">
```

---

## Photography & Images

### Stock Photo Library

```
brand/images/
├── heroes/                       (Hero images)
│   ├── hero-home.jpg            (1920x1080)
│   ├── hero-features.jpg
│   └── hero-about.jpg
├── features/                     (Feature images)
│   ├── ai-automation.jpg        (1200x800)
│   ├── resume-builder.jpg
│   └── job-matching.jpg
├── team/                         (Team photos)
│   ├── team-1.jpg               (800x800)
│   └── team-2.jpg
└── backgrounds/                  (Background patterns)
    ├── pattern-blue.svg
    └── gradient-blue.svg
```

### Image Guidelines

**Photography Style:**
- Authentic, not overly staged
- Diverse and inclusive representation
- Modern work environments
- Natural lighting
- Professional yet approachable

**Technical Specs:**
- Format: JPG (photos), PNG (with transparency)
- Color Space: sRGB
- Resolution: 72 DPI (web), 300 DPI (print)
- Compression: Optimized for web

---

## Social Media Assets

### Profile Images

```
brand/social/profiles/
├── twitter-profile.png           (400x400)
├── linkedin-profile.png          (400x400)
├── facebook-profile.png          (180x180)
└── instagram-profile.png         (320x320)
```

### Cover Images

```
brand/social/covers/
├── twitter-cover.png             (1500x500)
├── linkedin-cover.png            (1584x396)
├── facebook-cover.png            (820x312)
└── youtube-cover.png             (2560x1440)
```

### Post Templates

```
brand/social/templates/
├── instagram-post.psd            (1080x1080)
├── twitter-post.psd              (1200x675)
├── linkedin-post.psd             (1200x627)
└── facebook-post.psd             (1200x630)
```

### Figma Templates

**Social Media Kit:** `brand/social/ApplyforUs-Social-Kit.fig`

Includes:
- Instagram post templates
- Instagram story templates
- Twitter/X post templates
- LinkedIn post templates
- Facebook post templates
- All in brand colors with logo placement

---

## Email Templates

### HTML Email Templates

```
brand/email/templates/
├── welcome.html
├── application-confirmation.html
├── weekly-digest.html
├── password-reset.html
├── newsletter.html
└── promotional.html
```

### Email Signature

```html
<!-- Email Signature -->
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="padding-right: 15px;">
      <img src="https://applyforus.com/brand/logo/applyforus-icon.png"
           alt="ApplyforUs"
           width="60"
           height="60">
    </td>
    <td>
      <strong style="color: #111827; font-size: 16px;">Your Name</strong><br>
      <span style="color: #6B7280; font-size: 14px;">Title</span><br>
      <span style="color: #6B7280; font-size: 14px;">ApplyforUs</span><br>
      <a href="mailto:name@applyforus.com" style="color: #3B82F6; text-decoration: none;">name@applyforus.com</a><br>
      <a href="https://applyforus.com" style="color: #3B82F6; text-decoration: none;">applyforus.com</a>
    </td>
  </tr>
</table>
```

### Figma Email Templates

**Email Design Kit:** `brand/email/ApplyforUs-Email-Kit.fig`

---

## Presentation Templates

### PowerPoint Template

```
brand/presentations/
├── ApplyforUs-Template.pptx      (PowerPoint)
├── ApplyforUs-Template.key       (Keynote)
└── ApplyforUs-Template-GSlides   (Google Slides link)
```

**Includes:**
- Title slide
- Section divider slides
- Content slides (text, images, charts)
- Thank you slide
- Contact slide

### Slide Master

**Brand elements on every slide:**
- Logo in footer (small)
- Brand colors for accents
- Typography styles
- Slide numbers
- Consistent spacing

---

## Print Materials

### Business Cards

```
brand/print/business-cards/
├── business-card-front.pdf       (3.5" x 2")
├── business-card-back.pdf
├── business-card-front.ai        (Adobe Illustrator)
└── business-card-specs.pdf       (Print specifications)
```

**Specifications:**
- Size: 3.5" x 2" (standard US)
- Bleed: 0.125"
- Safe zone: 0.25" from edge
- Color mode: CMYK
- Resolution: 300 DPI
- Finish: Matte or Gloss

### Letterhead

```
brand/print/letterhead/
├── letterhead.pdf
├── letterhead.docx
└── letterhead.ai
```

### Marketing Collateral

```
brand/print/collateral/
├── brochure-trifold.pdf
├── flyer-8.5x11.pdf
├── poster-18x24.pdf
└── banner-roll-up.pdf
```

---

## Usage Rights

### Logo Usage

**✓ You may:**
- Use the logo to promote ApplyforUs
- Use the logo in partnership materials (with approval)
- Link the logo to applyforus.com
- Use provided color variations

**✗ You may not:**
- Modify, edit, or alter the logo
- Use the logo as your primary branding
- Imply endorsement without permission
- Use the logo in a misleading way
- Sell or distribute the logo

### Photography Usage

**Stock Photos:**
- Licensed through Unsplash (free to use)
- No attribution required
- Can be used for commercial purposes
- Cannot be sold as-is

**Custom Photography:**
- Property of ApplyforUs
- Requires written permission for external use
- Contact: marketing@applyforus.com

### Attribution Requirements

**Required attribution:**
- "Powered by ApplyforUs" (for integrations)
- Link back to applyforus.com
- Use official logo files

**Optional attribution:**
- Social media mentions
- Blog post references
- Case studies

---

## Download Links

### Brand Asset Portal

**Main Portal:** https://brand.applyforus.com

**Direct Downloads:**
- Logo Package: https://brand.applyforus.com/download/logos.zip
- Color Palette: https://brand.applyforus.com/download/colors.zip
- Typography: https://brand.applyforus.com/download/fonts.zip
- Icons: https://brand.applyforus.com/download/icons.zip
- Social Media: https://brand.applyforus.com/download/social.zip
- Email Templates: https://brand.applyforus.com/download/email.zip
- Presentations: https://brand.applyforus.com/download/presentations.zip
- Print Files: https://brand.applyforus.com/download/print.zip

### Cloud Storage

**Google Drive:** https://drive.google.com/drive/folders/xxx
**Dropbox:** https://www.dropbox.com/sh/xxx

**Access:**
- Public (view-only)
- Partners: Request access via marketing@applyforus.com
- Internal team: Full access

---

## Press Kit

### Media Resources

```
brand/press-kit/
├── company-overview.pdf
├── fact-sheet.pdf
├── executive-bios.pdf
├── product-screenshots/
├── high-res-logos/
└── press-releases/
```

**Press Contact:**
- **Email:** press@applyforus.com
- **Phone:** +1-555-123-4567
- **Website:** https://applyforus.com/press

### Company Boilerplate

**Short (50 words):**
> ApplyforUs is an AI-powered job application automation platform that helps job seekers apply smarter, not harder. Our intelligent platform automates repetitive application tasks while maintaining quality and personalization, giving users more time to focus on finding the right opportunities.

**Long (100 words):**
> ApplyforUs is a cutting-edge job application automation platform that combines artificial intelligence with intelligent automation to transform the job search experience. Founded in 2024, ApplyforUs helps job seekers save time, improve application quality, and increase their chances of landing their dream jobs. The platform offers AI-powered resume optimization, smart job matching, automated application submission, and comprehensive analytics. With a focus on quality over quantity, ApplyforUs ensures every application is personalized and optimized while giving users complete control over their job search journey. Learn more at applyforus.com.

---

## Asset Request Process

### For Partners

1. **Submit Request**
   - Email: partnerships@applyforus.com
   - Include: Use case, timeline, distribution plan

2. **Review & Approval**
   - Marketing team reviews request
   - Response within 2-3 business days

3. **Asset Delivery**
   - Assets delivered via secure link
   - Custom assets created if needed

### For Media

1. **Press Inquiry**
   - Email: press@applyforus.com
   - Press kit automatically provided

2. **Custom Assets**
   - High-res photos available
   - Executive headshots
   - Product screenshots
   - Logo variations

---

## Brand Guidelines Reference

For complete brand guidelines including voice, tone, and messaging:
- **Full Guidelines:** https://brand.applyforus.com/guidelines
- **Document:** `/docs/rebrand/full_brand_guidelines.md`

For technical implementation:
- **Developer Handoff:** `/docs/rebrand/developer_handoff.md`

---

## Support & Questions

**Brand Team:** brand@applyforus.com
**Marketing Team:** marketing@applyforus.com
**Design Team:** design@applyforus.com
**Partnerships:** partnerships@applyforus.com
**Press Inquiries:** press@applyforus.com

**Office Hours:**
- Tuesday & Thursday, 2-3 PM EST
- Zoom: https://zoom.us/j/applyforus-brand

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Next Review:** June 2026

© 2025 ApplyforUs. All rights reserved.
