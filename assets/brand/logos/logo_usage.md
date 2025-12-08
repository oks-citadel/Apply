# ApplyforUs Logo Usage Guidelines

## Table of Contents
1. [General Principles](#general-principles)
2. [Logo Variations](#logo-variations)
3. [Clear Space & Minimum Sizes](#clear-space--minimum-sizes)
4. [Color Usage](#color-usage)
5. [Background Requirements](#background-requirements)
6. [Do's and Don'ts](#dos-and-donts)
7. [Co-Branding Rules](#co-branding-rules)
8. [Social Media Guidelines](#social-media-guidelines)
9. [Special Use Cases](#special-use-cases)

---

## General Principles

### Brand Consistency
The ApplyforUs logo is the cornerstone of our visual identity. Consistent application builds recognition and trust.

**Core Rules:**
- Always use official logo files (never recreate)
- Maintain aspect ratio (never stretch or squish)
- Respect clear space requirements
- Use appropriate version for each context

### File Selection Decision Tree

```
Is it for digital use?
├─ Yes → Use SVG (vector) or PNG with transparent background
│   ├─ Is background dark (#1F2937 or darker)?
│   │   ├─ Yes → Use dark mode version
│   │   └─ No → Use standard version
│   └─ Is space limited (< 200px wide)?
│       ├─ Yes → Use icon only
│       └─ No → Use horizontal logo
└─ No (print) → Use vector (AI, EPS) or high-res PNG (@3x)
    └─ Single color only?
        ├─ Yes → Use monochrome version
        └─ No → Use full color version
```

---

## Logo Variations

### 1. Primary Horizontal Logo
**File**: `applyus-logo-horizontal-gradient.svg`

- **Use**: Default for most applications
- **Minimum Width**: 120px digital / 0.75" print
- **Composition**: Icon + full wordmark
- **Ratio**: Approximately 3.75:1 (width:height)

**Best For:**
- Website headers
- Email signatures
- Presentations
- Documents
- Marketing materials

### 2. Stacked Logo
**File**: `applyus-logo-stacked-gradient.svg`

- **Use**: Square or vertical spaces
- **Minimum Width**: 80px digital / 0.5" print
- **Composition**: Icon above wordmark
- **Ratio**: Approximately 1:1.2 (width:height)

**Best For:**
- App icons with label
- Vertical banners
- Square social media posts
- Mobile app splash screens

### 3. Icon Only
**File**: `applyus-icon-gradient.svg`

- **Use**: Established brand contexts
- **Minimum Size**: 16px digital / 0.25" print
- **Composition**: Icon mark only
- **Ratio**: 1:1 (perfect square)

**Best For:**
- Favicons
- App icons
- Social media avatars
- In-app navigation
- Watermarks

### 4. Wordmark Only
**File**: `applyus-wordmark.svg`

- **Use**: When icon appears separately
- **Minimum Width**: 100px digital / 0.625" print
- **Composition**: Text only
- **Ratio**: Approximately 4:1

**Best For:**
- Taglines alongside icon
- Footer text
- Legal documents
- Co-branding where icon conflicts

---

## Clear Space & Minimum Sizes

### Clear Space Requirements

**Measurement Unit**: Height of the letter "A" in the wordmark (denoted as "x")

#### Horizontal Logo
```
Minimum clear space: 1x on all sides
Recommended: 1.5x for optimal isolation

    1.5x
     ↓
  ┌─────────────────────┐
→ │   ┌─────────────┐   │ ←
  │   │  🅰 ApplyforUs │   │
  │   └─────────────┘   │
  └─────────────────────┘
          ↑
         1.5x
```

#### Icon Only
```
Minimum clear space: 0.5x (half icon width) on all sides

    0.5x
     ↓
  ┌─────────┐
→ │   🅰    │ ←
  └─────────┘
      ↑
     0.5x
```

### Minimum Size Specifications

| Format | Digital (Screen) | Print | Notes |
|--------|-----------------|-------|-------|
| **Horizontal Logo** | 120px wide | 0.75" wide | Below this, use icon only |
| **Stacked Logo** | 80px wide | 0.5" wide | Ideal for squares |
| **Icon Only** | 16px | 0.25" | Favicon minimum |
| **Wordmark Only** | 100px wide | 0.625" wide | Rare use case |

**Why These Minimums?**
- Maintains legibility of wordmark
- Preserves detail in icon elements
- Ensures brand recognition
- Meets accessibility standards

---

## Color Usage

### Primary Versions

#### Full Color (Gradient)
**When to Use**:
- Full brand expression
- Marketing materials
- Digital platforms
- Print with color capability

**Colors**:
- Icon: Linear gradient #6366F1 → #8B5CF6
- Wordmark: #1F2937 (light backgrounds) / #F9FAFB (dark backgrounds)

#### Solid Color
**When to Use**:
- Simplified reproduction
- Embroidery
- Screen printing (limited colors)
- Performance concerns (rare)

**Colors**:
- Icon: #6366F1 solid
- Wordmark: #1F2937 or #F9FAFB

#### Monochrome
**When to Use**:
- Single-color printing
- Fax/photocopies
- Engraving
- Specific partner requirements

**Colors**:
- All elements: #1F2937 (dark on light) or #FFFFFF (light on dark)

### Color Contrast Requirements

**Accessibility Standard**: WCAG 2.1 Level AA

| Logo Version | Background | Contrast Ratio | Pass? |
|-------------|------------|----------------|-------|
| Standard | #FFFFFF | 7.2:1 | ✓ AAA |
| Standard | #F9FAFB | 6.8:1 | ✓ AAA |
| Dark Mode | #1F2937 | 11.5:1 | ✓ AAA |
| Dark Mode | #111827 | 13.2:1 | ✓ AAA |
| Monochrome Dark | #FFFFFF | 12.6:1 | ✓ AAA |
| Monochrome Light | #1F2937 | 12.6:1 | ✓ AAA |

---

## Background Requirements

### Approved Background Colors

#### Light Backgrounds
- ✓ White (#FFFFFF)
- ✓ Gray-50 (#F9FAFB)
- ✓ Gray-100 (#F3F4F6)
- ✓ Indigo-50 (#EEF2FF) - Brand color tint

**Use**: Standard logo version

#### Dark Backgrounds
- ✓ Gray-900 (#111827)
- ✓ Gray-800 (#1F2937)
- ✓ Black (#000000)
- ✓ Indigo-900 (#312E81) - Brand color shade

**Use**: Dark mode logo version

#### Photographic Backgrounds
**Requirements**:
1. Background must be low contrast/blurred
2. Add semi-transparent overlay:
   - Light areas: rgba(255, 255, 255, 0.9)
   - Dark areas: rgba(31, 41, 55, 0.9)
3. Ensure 4.5:1 minimum contrast ratio
4. Position logo in clear, uncluttered area

**Recommended Approach**:
```css
.logo-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 12px;
}
```

### Backgrounds to Avoid
- ✗ Busy patterns
- ✗ Gradients (except approved brand gradients)
- ✗ Low contrast scenarios
- ✗ Colored backgrounds (unless brand colors)
- ✗ Over faces or important image content

---

## Do's and Don'ts

### ✓ DO

1. **Use Official Files**
   - Always download from brand portal
   - Use provided vector formats when possible
   - Use @2x or @3x for high-DPI displays

2. **Maintain Aspect Ratio**
   - Lock proportions when resizing
   - Use corner handles, not edge handles
   - Verify dimensions after resize

3. **Provide Adequate Space**
   - Follow clear space guidelines
   - Increase space when possible
   - Keep away from page edges

4. **Choose Appropriate Version**
   - Icon only for small sizes
   - Dark mode for dark backgrounds
   - Monochrome when required

5. **Ensure Visibility**
   - Test at actual size
   - Check on multiple devices
   - Verify contrast ratios

### ✗ DON'T

1. **Don't Modify the Logo**
   - ✗ Never recreate or redraw
   - ✗ Don't change colors (except approved versions)
   - ✗ Don't add effects (shadows, glows, etc.)
   - ✗ Don't outline or add strokes
   - ✗ Don't rotate or skew

2. **Don't Distort**
   - ✗ Never stretch or compress
   - ✗ Don't change aspect ratio
   - ✗ Don't resize non-proportionally

3. **Don't Crowd**
   - ✗ Never violate clear space
   - ✗ Don't place too close to edges
   - ✗ Don't overlap with other elements

4. **Don't Use Old Versions**
   - ✗ Never use deprecated logos
   - ✗ Don't use low-quality files
   - ✗ Don't screenshot or download from website

5. **Don't Make It Too Small**
   - ✗ Never go below minimum sizes
   - ✗ Don't sacrifice legibility
   - ✗ Don't assume "it's fine"

### Visual Examples of Don'ts

```
❌ WRONG                          ✅ RIGHT
┌─────────────────┐              ┌──────────────────┐
│ 🅰 ApplyforUs   │              │  🅰 ApplyforUs   │
│ (stretched)     │              │  (proportional)  │
└─────────────────┘              └──────────────────┘

❌ WRONG                          ✅ RIGHT
┌─────────────────┐              ┌──────────────────┐
│🅰 ApplyforUs    │              │                  │
│(no clear space) │              │  🅰 ApplyforUs   │
│Other content    │              │                  │
└─────────────────┘              └──────────────────┘

❌ WRONG                          ✅ RIGHT
┌─────────────────┐              ┌──────────────────┐
│  🅰              │              │  🅰 ApplyforUs   │
│  ApplyforUs     │              │                  │
│  (rearranged)   │              │  (original)      │
└─────────────────┘              └──────────────────┘
```

---

## Co-Branding Rules

### When Co-Branding is Appropriate
- Strategic partnerships
- Integration announcements
- Joint marketing campaigns
- Platform integrations
- Certification programs

### Hierarchy Rules

#### Equal Partnership
- Logos same size
- Equal spacing between
- Alphabetical order (or by agreement)
- Divider: Vertical line or "×" symbol

```
┌─────────────────────────────────┐
│  🅰 ApplyforUs  │  Partner Logo │
└─────────────────────────────────┘
```

#### ApplyforUs Primary
- ApplyforUs logo 1.5× partner size
- ApplyforUs left-aligned
- Partner logo secondary position
- Use lockup: "Powered by ApplyforUs"

```
┌────────────────────────────────┐
│  🅰 ApplyforUs                  │
│                   Partner       │
└────────────────────────────────┘
```

#### Partner Primary (Integration)
- Partner logo primary
- ApplyforUs badge/icon
- Use language: "Integrated with ApplyforUs"

```
┌─────────────────────────────────┐
│  Partner Logo    [🅰 ApplyforUs]│
└─────────────────────────────────┘
```

### Co-Branding Specifications

**Spacing Between Logos**:
- Minimum: 2x ApplyforUs clear space
- Recommended: 3x for visual separation

**Divider Style** (if used):
- Vertical line: 1px, #E5E7EB
- Symbol: "×" or "+" in #6B7280
- Or: "with", "×", "+" text

**Alignment**:
- Horizontal: Center-aligned vertically
- Stacked: Center-aligned horizontally

**File Delivery**:
- Provide both individual logos
- Partner combines per guidelines
- Offer locked composition if needed

### Approval Process
1. Partner submits co-branding proposal
2. Marketing reviews for brand alignment
3. Create lockup if approved
4. Provide guidelines to partner
5. Review all materials before publication

---

## Social Media Guidelines

### Profile Photos

#### Recommended: Icon Only
**Why**: Maximum visibility at small sizes

| Platform | Size | Format | Notes |
|----------|------|--------|-------|
| **Facebook** | 180×180px | PNG | Displays at 170×170px |
| **Twitter/X** | 400×400px | PNG | Displays at 200×200px |
| **LinkedIn** | 300×300px | PNG | Displays at 300×300px |
| **Instagram** | 320×320px | PNG | Displays at 110×110px |
| **YouTube** | 800×800px | PNG | Displays at 98×98px |
| **TikTok** | 200×200px | PNG | Circular crop |

**Specifications**:
- Use icon only version
- Centered in canvas
- 20% padding from edges
- Transparent or solid background (#6366F1)

### Cover Photos

#### Facebook
**Size**: 820×312px (displays at 820×312px desktop, 640×360px mobile)

**Layout**:
```
┌─────────────────────────────────────────────┐
│                                       Logo  │
│                                       Here  │
│  Main headline text                         │
└─────────────────────────────────────────────┘
```

**Safe Zone**: Avoid bottom 75px (mobile profile photo overlap)

#### Twitter/X Header
**Size**: 1500×500px

**Layout**:
```
┌─────────────────────────────────────────────┐
│  Logo                                       │
│  Here     Main visual or brand message     │
│                                             │
└─────────────────────────────────────────────┘
```

**Safe Zone**: Avoid left 280px (profile photo overlap)

#### LinkedIn
**Size**: 1584×396px

**Layout**:
```
┌─────────────────────────────────────────────┐
│                                             │
│                  Centered brand message     │
│                  Logo bottom-right          │
└─────────────────────────────────────────────┘
```

**Safe Zone**: Avoid bottom-left 268×268px

#### YouTube Channel Art
**Size**: 2560×1440px

**Safe Zones**:
- TV: 2560×1440px (full canvas)
- Desktop: 2560×423px (center)
- Tablet: 1855×423px (center)
- Mobile: 1546×423px (center)

**Critical Zone**: 1546×423px centered - logo must be here

```
┌───────────────────────────────────────────┐
│                                           │
│        ┌─────────────────────┐            │
│        │  Logo centered in   │            │
│        │  critical zone      │            │
│        └─────────────────────┘            │
│                                           │
└───────────────────────────────────────────┘
```

### Shared Content

#### Optimal Post Sizes

**Square (1:1)**
- Size: 1080×1080px
- Platforms: Instagram, Facebook, LinkedIn
- Logo: Bottom-right corner, 120px wide
- Padding: 40px from edges

**Landscape (1.91:1)**
- Size: 1200×628px
- Platforms: Facebook, LinkedIn, Twitter
- Logo: Top-left or bottom-right, 140px wide
- Padding: 40px from edges

**Portrait (4:5)**
- Size: 1080×1350px
- Platforms: Instagram, Facebook
- Logo: Bottom-center or top-right, 100px wide
- Padding: 40px from edges

**Story (9:16)**
- Size: 1080×1920px
- Platforms: Instagram, Facebook, LinkedIn
- Logo: Top-center, 80px wide
- Padding: 60px from top edge
- Safe Zone: Avoid bottom 250px (CTA buttons)

### Logo Placement on Social Graphics

**Priority Locations**:
1. Bottom-right (default, non-intrusive)
2. Top-left (if bottom has CTA)
3. Top-right (alternative)
4. Bottom-left (rarely)

**Logo on Social Media**:
- Size: 80-140px wide (based on image size)
- Version: Icon + wordmark or icon only
- Color: Adapt to image (use dark mode if needed)
- Overlay: Add if low contrast (see Background Requirements)

**Consistency Checklist**:
- ✓ Same logo placement across campaign
- ✓ Same size relative to canvas
- ✓ Readable at thumbnail size
- ✓ Doesn't obstruct key visual
- ✓ Passes contrast requirements

---

## Special Use Cases

### 1. Email Signatures

**Recommended Size**: 150px wide

**Example HTML**:
```html
<img src="applyus-logo-horizontal-gradient.png"
     alt="ApplyforUs"
     width="150"
     height="40"
     style="display:block; border:0;">
```

**Best Practices**:
- Use PNG with transparent background
- Include alt text
- Link to website
- Test in major email clients

### 2. Favicons

**Sizes Needed**:
- 16×16px (browser tabs)
- 32×32px (taskbar)
- 96×96px (desktop shortcuts)
- 180×180px (Apple touch icon)

**Implementation**:
```html
<link rel="icon" type="image/png" sizes="32×32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16×16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180×180" href="/apple-touch-icon.png">
```

**Design Notes**:
- Use icon only version
- Simplify if needed at 16px
- Test on various browsers

### 3. Watermarks

**Purpose**: Protect screenshots, demos, mockups

**Specifications**:
- Opacity: 10-20%
- Size: 15-20% of image width
- Position: Corner or repeated pattern
- Color: Match to preserve image quality

### 4. App Loading Screens

**Specifications**:
- Logo: Centered, 240px wide
- Animation: Optional pulse or fade-in
- Background: Solid brand color or gradient
- Duration: Minimum time visible

### 5. Print Materials

**Business Cards**:
- Size: 40-50mm wide
- Position: Front, centered or top-left
- Version: Horizontal logo
- Format: Vector (AI, EPS) for printer

**Letterhead**:
- Size: 50-60mm wide
- Position: Top-left or centered
- Version: Horizontal logo
- Clear space: 15mm from edges

**Brochures/Flyers**:
- Cover: Prominent, 60-80mm wide
- Interior: Smaller, 30-40mm wide
- Back: Footer, 40mm wide
- Format: CMYK, vector preferred

### 6. Video Content

**Intro/Outro**:
- Duration: 2-3 seconds
- Animation: Fade in, optional subtle animation
- Size: 1/3 screen width
- Position: Centered
- Background: Brand gradient or solid

**Lower Third**:
- Size: 200-300px wide
- Position: Bottom-left
- Duration: Throughout video or on appearance
- Background: Semi-transparent overlay

**Watermark** (if needed):
- Size: 80-120px wide
- Position: Top-right or bottom-right
- Opacity: 50-70%
- Persistent: Throughout video

---

## Asset Request & Approval

### How to Get Logo Files
1. Download from brand portal: [Internal Link]
2. Request via email: brand@applyfor.us
3. Slack channel: #brand-assets

### Who Can Approve Logo Usage
- **Standard Uses**: No approval needed (follow guidelines)
- **Co-Branding**: Marketing Director approval
- **Modified Versions**: Brand Manager approval
- **External Partners**: Legal + Marketing approval

### Review Timeline
- Standard requests: 1-2 business days
- Complex co-branding: 3-5 business days
- Legal review (if needed): Add 3-5 business days

---

## Questions?

For questions about logo usage:
- Email: brand@applyfor.us
- Slack: #brand-guidelines
- Documentation: [Brand Portal Link]

**Remember**: When in doubt, ask! We're here to help ensure our brand is represented consistently and professionally.
