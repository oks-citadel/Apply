# Asset Generation Workflow
## ApplyforUs Platform

---

## Overview

This document outlines the complete workflow for generating, processing, and managing AI-created assets for the ApplyforUs platform. Following this workflow ensures consistency, quality, and efficient asset management.

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Phase 1: Planning & Preparation](#phase-1-planning--preparation)
3. [Phase 2: Asset Generation](#phase-2-asset-generation)
4. [Phase 3: Quality Review](#phase-3-quality-review)
5. [Phase 4: Post-Processing](#phase-4-post-processing)
6. [Phase 5: Format Conversion](#phase-5-format-conversion)
7. [Phase 6: Asset Library Upload](#phase-6-asset-library-upload)
8. [Phase 7: Documentation](#phase-7-documentation)
9. [Tools & Resources](#tools--resources)
10. [Best Practices](#best-practices)

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ASSET GENERATION WORKFLOW                 │
└─────────────────────────────────────────────────────────────┘

1. PLANNING & PREPARATION
   ├── Define requirements
   ├── Select generation method
   ├── Prepare prompts
   └── Set success criteria
              ↓
2. ASSET GENERATION
   ├── Generate initial versions
   ├── Create variations
   ├── Iterate based on results
   └── Select best outputs
              ↓
3. QUALITY REVIEW
   ├── Technical quality check
   ├── Brand consistency review
   ├── Stakeholder approval
   └── Document feedback
              ↓
4. POST-PROCESSING
   ├── Image editing (if needed)
   ├── Color correction
   ├── Resolution optimization
   └── Background removal
              ↓
5. FORMAT CONVERSION
   ├── Export source formats
   ├── Convert to web formats
   ├── Create responsive variants
   └── Optimize file sizes
              ↓
6. ASSET LIBRARY UPLOAD
   ├── Organize in folder structure
   ├── Apply naming conventions
   ├── Tag with metadata
   └── Create access links
              ↓
7. DOCUMENTATION
   ├── Update asset inventory
   ├── Record generation details
   ├── Note usage guidelines
   └── Archive source files
```

---

## Phase 1: Planning & Preparation

### Step 1.1: Define Requirements

**Asset Requirements Document**
```markdown
ASSET REQUEST FORM

Asset Type: [Image/Video/Animation/Icon/etc.]
Purpose: [Hero image/Social post/Email header/etc.]
Target Platform: [Website/Instagram/LinkedIn/etc.]
Dimensions Required: [List all sizes needed]
File Format: [PNG/JPG/WebP/MP4/etc.]

Content Description:
[Detailed description of what the asset should depict]

Style Requirements:
- Art Style: [3D/Flat/Photo-realistic/etc.]
- Color Palette: [Specific colors with hex codes]
- Mood/Tone: [Professional/Friendly/Energetic/etc.]
- Text Overlay: [Yes/No - if yes, space needed where]

Brand Guidelines:
- Logo Inclusion: [Yes/No - where/how]
- Typography: [If applicable]
- Specific Brand Elements: [List any required elements]

Success Criteria:
[How will we know this asset is successful?]

Deadline: [Date]
Priority: [High/Medium/Low]
Requested By: [Name]
Assigned To: [Name]
```

### Step 1.2: Select Generation Method

**Decision Matrix**

| Asset Type | Best Tool | Alternative | Reason |
|------------|-----------|-------------|--------|
| Realistic photos | Midjourney | DALL-E 3 | Best photorealism |
| Illustrations | DALL-E 3 | Midjourney | Better style control |
| Icons (simple) | Figma + AI | DALL-E 3 | Precision needed |
| 3D renders | Midjourney | Stable Diffusion | Quality 3D output |
| Avatars | Midjourney | Stable Diffusion | Consistency |
| Social graphics | Canva + AI | Figma | Template efficiency |
| Videos | Runway ML | Pika Labs | Best video quality |
| Animations | After Effects | Lottie | Control & optimization |

### Step 1.3: Prepare Prompts

**Prompt Preparation Checklist**
- [ ] Review prompt library for similar assets
- [ ] Customize prompt for specific requirements
- [ ] Include all necessary technical specifications
- [ ] Specify dimensions and aspect ratio
- [ ] Define color palette with hex codes
- [ ] Describe composition and layout
- [ ] Specify mood and lighting
- [ ] Note what to avoid (negative prompts for SD)
- [ ] Add quality modifiers
- [ ] Test prompt with simple version first

**Prompt Template Structure**
```
[SUBJECT/SCENE] + [STYLE] + [COMPOSITION] + [COLORS] + [LIGHTING] +
[MOOD] + [TECHNICAL SPECS] + [QUALITY MODIFIERS]
```

### Step 1.4: Set Success Criteria

**Quality Checklist**
- [ ] Matches creative brief
- [ ] Appropriate dimensions
- [ ] Brand colors accurate
- [ ] Style consistent with brand
- [ ] Technically high quality (resolution, clarity)
- [ ] No obvious AI artifacts
- [ ] Suitable for intended use
- [ ] Approved by stakeholder

---

## Phase 2: Asset Generation

### Step 2.1: Generate Initial Versions

**Midjourney Workflow**

1. **Open Discord and navigate to Midjourney bot**
2. **Enter prompt with parameters**
   ```
   /imagine [your detailed prompt] --ar 16:9 --v 6 --style raw --s 250
   ```
3. **Wait for generation** (typically 30-60 seconds)
4. **Review 4 variations provided**
5. **Upscale preferred version(s)**
   ```
   Click U1, U2, U3, or U4 to upscale
   ```
6. **Create additional variations if needed**
   ```
   Click V1, V2, V3, or V4 for variations
   ```

**DALL-E 3 Workflow**

1. **Access via ChatGPT Plus or API**
2. **Submit detailed prompt**
   ```
   I need you to generate an image: [detailed prompt]
   ```
3. **Review generated image** (single image per prompt)
4. **Request modifications if needed**
   ```
   Make the following changes: [specific modifications]
   ```
5. **Generate multiple variations**
   ```
   Create 3 more variations with slight differences in [aspect]
   ```

**Stable Diffusion Workflow**

1. **Select appropriate model** (Realistic Vision, DreamShaper, etc.)
2. **Enter positive prompt**
3. **Enter negative prompt**
   ```
   lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit,
   fewer digits, cropped, worst quality, low quality, normal quality, jpeg
   artifacts, signature, watermark, username, blurry
   ```
4. **Set parameters**
   - Steps: 20-30
   - CFG Scale: 7-10
   - Sampler: DPM++ 2M Karras or Euler a
   - Seed: -1 for random, or specific seed for consistency
5. **Generate batch** (4-8 images)
6. **Select best outputs**
7. **Use img2img for refinements**

---

### Step 2.2: Create Variations

**Why Create Variations?**
- A/B testing opportunities
- Multiple use cases
- Different platforms/formats
- Backup options
- Client/stakeholder preferences

**Types of Variations**
1. **Composition variations**: Different layouts
2. **Color variations**: Different color schemes
3. **Style variations**: Subtle style differences
4. **Element variations**: Different props/objects
5. **Mood variations**: Different emotional tones

**How Many Variations?**
- Primary assets: 3-5 variations
- Secondary assets: 2-3 variations
- Batch/template assets: 1-2 variations

---

### Step 2.3: Iterate Based on Results

**Iteration Process**

1. **Analyze first generation**
   - What works well?
   - What needs improvement?
   - Any unexpected issues?

2. **Identify specific problems**
   - Wrong colors
   - Poor composition
   - Incorrect style
   - Missing elements
   - AI artifacts
   - Wrong mood/tone

3. **Modify prompt strategically**
   ```
   Original: "modern office workspace"
   Problem: Too cluttered, wrong colors

   Improved: "minimal modern office workspace, clean desk, MacBook,
   natural light, purple accents #8B5CF6, uncluttered, professional
   photography"
   ```

4. **Generate second version**
5. **Compare results**
6. **Repeat until satisfied** (typically 2-4 iterations)

**Iteration Log Template**
```
ASSET: [Name]
ITERATION: [Number]

Previous Issues:
- [Issue 1]
- [Issue 2]

Prompt Changes:
- [Change 1]
- [Change 2]

Results:
- [Improvement 1]
- [Remaining Issue 1]

Next Steps:
- [Action 1]
```

---

### Step 2.4: Select Best Outputs

**Selection Criteria Scorecard**

Rate each option 1-5 on:
- [ ] Matches creative brief (weight: 3x)
- [ ] Technical quality (weight: 2x)
- [ ] Brand consistency (weight: 2x)
- [ ] Visual appeal (weight: 1x)
- [ ] Usability (text space, adaptability) (weight: 1x)

**Calculate weighted score**:
```
Total Score = (Brief × 3) + (Technical × 2) + (Brand × 2) +
              (Appeal × 1) + (Usability × 1)

Maximum Score = 45
```

**Selection Decision**:
- Score 35+: Excellent, approve
- Score 25-34: Good, minor tweaks needed
- Score 15-24: Needs significant revision
- Score < 15: Start over with new approach

---

## Phase 3: Quality Review

### Step 3.1: Technical Quality Check

**Image Quality Checklist**

Resolution & Clarity
- [ ] Sufficient resolution for intended use
- [ ] Sharp focus on important elements
- [ ] No pixelation or blurriness
- [ ] Clean edges, no jagged lines

Colors
- [ ] Colors match brand palette
- [ ] Proper color balance
- [ ] No color banding
- [ ] Consistent color across image

Composition
- [ ] Clear focal point
- [ ] Good use of negative space
- [ ] Balanced composition
- [ ] Appropriate framing

Artifacts & Issues
- [ ] No obvious AI artifacts (distorted faces, hands, text)
- [ ] No unwanted watermarks or text
- [ ] No duplicate/merged elements
- [ ] No perspective issues
- [ ] No lighting inconsistencies

Technical Specs
- [ ] Correct dimensions
- [ ] Appropriate file format
- [ ] Reasonable file size
- [ ] Proper color profile (sRGB for web)

---

### Step 3.2: Brand Consistency Review

**Brand Guidelines Checklist**

Visual Identity
- [ ] Uses approved brand colors
- [ ] Matches brand art style
- [ ] Appropriate tone and mood
- [ ] Consistent with existing assets

Logo & Typography
- [ ] Logo (if included) is correct version
- [ ] Logo has proper clear space
- [ ] Logo is legible/appropriate size
- [ ] Typography follows guidelines (if applicable)

Messaging
- [ ] Aligns with brand values
- [ ] Appropriate for target audience
- [ ] Consistent with brand voice
- [ ] Culturally appropriate

Diversity & Inclusion
- [ ] Represents diverse demographics
- [ ] Avoids stereotypes
- [ ] Inclusive representation
- [ ] Accessible design choices

---

### Step 3.3: Stakeholder Approval

**Approval Process**

1. **Prepare presentation**
   - Show asset in context (mockups)
   - Display at actual size
   - Provide multiple variations if applicable
   - Include rationale for design choices

2. **Create review link/board**
   - Use Figma for interactive review
   - Or create PDF presentation
   - Include annotation capabilities
   - Set review deadline

3. **Gather feedback**
   - Structured feedback form
   - Specific, actionable comments
   - Rate satisfaction (1-5)
   - Approve/Revise/Reject decision

4. **Document decisions**
   - Record approval date
   - Save feedback comments
   - Note any requested changes
   - Track approval in project management tool

**Feedback Form Template**
```markdown
ASSET REVIEW FEEDBACK

Asset Name: [Name]
Reviewer: [Name]
Date: [Date]

Overall Rating: [ ] 1  [ ] 2  [ ] 3  [ ] 4  [ ] 5

What works well:
-
-

What needs improvement:
-
-

Specific feedback:
1. [Aspect]: [Feedback]
2. [Aspect]: [Feedback]

Decision: [ ] Approve  [ ] Approve with minor changes  [ ] Needs revision  [ ] Reject

If revision needed, priority: [ ] High  [ ] Medium  [ ] Low

Additional comments:


Signature: ________________  Date: ________
```

---

### Step 3.4: Document Feedback

**Feedback Tracking**
- Create feedback log in project management tool
- Tag feedback by category (technical, creative, brand, etc.)
- Prioritize feedback items
- Assign action items
- Set revision deadlines
- Track resolution status

---

## Phase 4: Post-Processing

### Step 4.1: Image Editing

**Common Editing Tasks**

**Adobe Photoshop**

1. **Color Correction**
   ```
   - Adjust Curves (Cmd/Ctrl + M)
   - Balance colors (Image > Adjustments > Color Balance)
   - Match brand colors precisely
   - Enhance saturation if needed (Hue/Saturation)
   ```

2. **Retouching**
   ```
   - Clone Stamp tool (S) - remove unwanted elements
   - Healing Brush (J) - fix artifacts
   - Content-Aware Fill - remove larger objects
   - Liquify - adjust shapes if needed
   ```

3. **Sharpening**
   ```
   - Filter > Sharpen > Smart Sharpen
   - Amount: 50-150%
   - Radius: 0.5-1.5px
   - Reduce Noise: 10-20%
   ```

4. **Compositing** (if needed)
   ```
   - Layer multiple elements
   - Blend seamlessly
   - Match lighting and colors
   - Add shadows/highlights for realism
   ```

---

### Step 4.2: Color Correction

**Color Correction Workflow**

1. **Check color profile**
   - Edit > Convert to Profile
   - Select sRGB IEC61966-2.1 (for web)

2. **Adjust levels**
   - Image > Adjustments > Levels (Cmd/Ctrl + L)
   - Set black point and white point
   - Adjust midtones

3. **Color balance**
   - Image > Adjustments > Color Balance (Cmd/Ctrl + B)
   - Adjust shadows, midtones, highlights
   - Remove unwanted color casts

4. **Match brand colors**
   - Use Eyedropper to sample existing color
   - Create adjustment layer (Hue/Saturation or Selective Color)
   - Shift to exact brand color (#8B5CF6, #4C1D95, etc.)

5. **Final adjustments**
   - Vibrance (subtle saturation boost)
   - Brightness/Contrast (if needed)
   - Preview in intended context

---

### Step 4.3: Resolution Optimization

**Resolution Guidelines**

**Web Images**
- Hero images: 2560x1440px (2K) and 1920x1080px (Full HD)
- Blog headers: 1200x630px
- Social media: Platform-specific sizes
- Icons: 256x256px (large), 128x128px (medium), 64x64px (small)

**Print Images**
- Minimum: 300 DPI
- Large format: 150-200 DPI acceptable
- Check final print size requirements

**Optimization Process**

1. **Start with highest quality**
   - Keep original high-res version
   - Work from source file

2. **Resize for specific uses**
   ```
   Photoshop:
   Image > Image Size
   - Uncheck "Resample" if just changing DPI
   - Check "Resample" and choose "Bicubic Sharper (reduction)"
     when downsizing
   ```

3. **Create responsive variants**
   - 2x (retina) and 1x versions
   - Different sizes for different breakpoints
   - Mobile-specific crops if needed

---

### Step 4.4: Background Removal

**When Background Removal is Needed**
- Creating transparent PNGs
- Compositing onto different backgrounds
- Product shots/avatars
- Icon creation

**Background Removal Methods**

**Method 1: Remove.bg (Quick, AI-powered)**
1. Upload image to remove.bg
2. Download result
3. Refine edges in Photoshop if needed

**Method 2: Photoshop (Precise control)**
1. Select Subject (Select > Subject) - AI-powered
2. Refine Edge (Select and Mask)
   - Adjust edge detection
   - Smooth edges
   - Feather if needed (0.5-2px)
3. Create layer mask
4. Paint refinements manually if needed
5. Export as PNG with transparency

**Method 3: Pen Tool (Most precise)**
1. Use Pen Tool (P) to create precise path
2. Convert path to selection
3. Create layer mask
4. Refine edges as above

**Quality Check**
- Zoom to 100% and check edges
- Look for halos or rough edges
- Test on different backgrounds
- Ensure transparency is clean

---

## Phase 5: Format Conversion

### Step 5.1: Export Source Formats

**Keep Master Files**

Always save and archive:
- **PSD** (Photoshop): Layered source files
- **AI** (Illustrator): Vector source files
- **AEP** (After Effects): Animation source files
- **FIG** (Figma): Design source files

**Naming Convention for Sources**
```
source_[asset-name]_[version]_[date].psd

Example:
source_hero-homepage_v3_20251208.psd
```

**Organization**
```
/asset-sources
  /images
    /heroes
    /social
    /avatars
  /animations
  /videos
  /icons
```

---

### Step 5.2: Convert to Web Formats

**Format Decision Matrix**

| Use Case | Primary Format | Fallback | Notes |
|----------|----------------|----------|-------|
| Photos/Complex images | WebP | JPG | 25-35% smaller than JPG |
| Graphics with transparency | PNG | PNG | No WebP for critical transparency |
| Simple graphics | SVG | PNG | Scalable, tiny file size |
| Animations | Lottie (JSON) | GIF/WebP | 10x smaller than GIF |
| Videos | MP4 (H.264) | WebM | Best compatibility |
| Icons | SVG | PNG | Prefer SVG whenever possible |

---

**WebP Export (Photoshop)**

1. **Install WebP plugin** (if not already)
2. **File > Export > Save for Web (Legacy)**
3. **Select format**: WebP
4. **Quality**: 80-85 (good balance)
5. **Preview file size**
6. **Save**

**Or use online converter**: Squoosh.app (excellent control)

---

**JPG Export (Photoshop)**

1. **File > Export > Export As**
2. **Format**: JPG
3. **Quality**: 80-85% (8-9 out of 12)
4. **Convert to sRGB**: Checked
5. **Metadata**: Copyright only
6. **Export**

---

**PNG Export (Photoshop)**

1. **File > Export > Export As**
2. **Format**: PNG
3. **Transparency**: Checked (if needed)
4. **Optimize**: Checked
5. **Interlaced**: Unchecked (for web)
6. **Export**

Then compress with TinyPNG or similar

---

**SVG Export (Illustrator/Figma)**

**Illustrator**:
1. **File > Export > Export As**
2. **Format**: SVG
3. **Styling**: Presentation Attributes
4. **Font**: Convert to outlines (if text present)
5. **Images**: Link (or embed if small)
6. **Object IDs**: Layer Names
7. **Decimal**: 2
8. **Minify**: Checked
9. **Responsive**: Checked

**Figma**:
1. Select layer/frame
2. Export settings (right panel)
3. Format: SVG
4. Outline stroke (if needed)
5. Export

Then optimize with SVGOMG.firebaseapp.com

---

### Step 5.3: Create Responsive Variants

**Responsive Image Strategy**

**Desktop**
- 2560x1440px (2x for 1280x720 display)
- 1920x1080px (2x for 960x540 display)

**Tablet**
- 1536x1024px (2x for 768x512 display)
- 1024x768px (1x)

**Mobile**
- 1242x2688px (3x for 414x896 display, iPhone)
- 750x1334px (2x for 375x667 display)

**Automated Resizing**

**Photoshop Action** (create once, use repeatedly):
```
1. Record Action: "Resize for Mobile"
2. Image > Image Size > 750x1334px, Bicubic Sharper
3. File > Export > Export As > WebP, 80%
4. Stop Recording

Usage: Select multiple files, Batch process action
```

**Node.js Script** (Sharp library):
```javascript
const sharp = require('sharp');

const sizes = [
  { width: 2560, height: 1440, suffix: '_2560' },
  { width: 1920, height: 1080, suffix: '_1920' },
  { width: 1024, height: 768, suffix: '_1024' },
  { width: 750, height: 1334, suffix: '_750' }
];

sizes.forEach(size => {
  sharp('input.png')
    .resize(size.width, size.height, { fit: 'cover' })
    .toFile(`output${size.suffix}.webp`);
});
```

---

### Step 5.4: Optimize File Sizes

**Optimization Targets**

- Hero images: < 500KB (WebP), < 800KB (JPG)
- Social images: < 300KB
- Thumbnails: < 100KB
- Icons: < 50KB (PNG), < 10KB (SVG)
- Animations: < 200KB (Lottie), < 500KB (video)

**Optimization Tools**

**Images**
1. **TinyPNG/TinyJPG** (https://tinypng.com)
   - Drag and drop
   - Lossy compression, visually lossless
   - Batch processing available

2. **Squoosh** (https://squoosh.app)
   - Advanced controls
   - Real-time preview
   - Multiple format options
   - WebP, AVIF support

3. **ImageOptim** (Mac app)
   - Batch optimization
   - Multiple algorithms
   - Lossless and lossy options

**SVGs**
1. **SVGOMG** (https://jakearchibald.github.io/svgomg/)
   - Visual interface
   - Real-time preview
   - Lots of optimization options

2. **SVGO** (Command line)
   ```bash
   npm install -g svgo
   svgo input.svg -o output.svg
   ```

**Videos**
1. **HandBrake** (Free, cross-platform)
   - H.264 codec
   - Web optimized preset
   - Target bitrate: 2-5 Mbps

2. **FFmpeg** (Command line)
   ```bash
   ffmpeg -i input.mp4 -vcodec h264 -acodec aac -crf 23 output.mp4
   ```

---

## Phase 6: Asset Library Upload

### Step 6.1: Organize in Folder Structure

**Recommended Structure**

```
/assets
  /images
    /heroes
      /homepage
        - hero_homepage_desktop_2560.webp
        - hero_homepage_desktop_1920.webp
        - hero_homepage_mobile_750.webp
      /features
    /social
      /instagram
        - social_instagram_post_success_20251208.png
      /linkedin
      /twitter
    /avatars
      /professional
      /ai-assistant
    /blog-headers
    /email-headers
  /videos
    /promo
      - video_promo_30s_v2_20251208.mp4
    /explainer
    /testimonials
  /animations
    /lottie
      - motion_logo_intro.json
      - motion_loader_spinner.json
    /gif
  /icons
    /line
    /filled
    /3d
  /sources
    /psd
    /ai
    /aep
```

---

### Step 6.2: Apply Naming Conventions

**Comprehensive Naming Convention**

```
[type]_[category]_[description]_[variant]_[size]_[date].[ext]

Components:
- type: hero, social, avatar, icon, video, motion
- category: homepage, instagram, professional, line
- description: brief descriptive name (kebab-case)
- variant: v1, v2, alt, dark (optional)
- size: 2560, 1920, 1080 (for images)
- date: YYYYMMDD (for version tracking)
- ext: webp, jpg, png, mp4, json, svg

Examples:
hero_homepage_professional-working_v2_2560_20251208.webp
social_instagram_success-story_square_1080_20251208.png
avatar_professional_youngfemale_smiling_1024_20251208.png
icon_line_briefcase_purple_64_20251208.svg
video_promo_30s_v3_20251208.mp4
motion_logo_fullintro_20251208.json
```

**Consistency Rules**
- Always lowercase
- Use hyphens for spaces in descriptions
- Use underscores to separate components
- Be descriptive but concise
- Include date for tracking versions

---

### Step 6.3: Tag with Metadata

**Image Metadata (IPTC/EXIF)**

**Using Photoshop**:
1. File > File Info (Cmd/Ctrl + Opt/Alt + Shift + I)
2. Fill in fields:
   - **Title**: Descriptive title
   - **Description**: Detailed description
   - **Keywords**: Comma-separated tags
   - **Copyright**: © 2025 ApplyforUs
   - **Creator**: Designer name or "ApplyforUs Team"
   - **Usage Terms**: Internal use only / Licensed for commercial use

**Using ExifTool** (batch processing):
```bash
exiftool -Title="Homepage Hero" -Description="Modern professional at desk"
-Keywords="hero, homepage, professional" -Copyright="© 2025 ApplyforUs"
hero_homepage.jpg
```

**Recommended Tags**

By Purpose:
- hero, feature, social, email, blog, avatar, icon, background

By Platform:
- web, instagram, linkedin, twitter, email, print

By Style:
- photo, illustration, 3d, flat, abstract, realistic

By Content:
- person, workspace, technology, success, celebration, collaborative

By Color:
- purple, indigo, blue, green, gradient, colorful, monochrome

By Topic:
- job-search, ai-technology, career-growth, interview, resume, automation

---

### Step 6.4: Create Access Links

**Cloud Storage Setup**

**Option 1: Google Drive**
1. Upload assets to organized folder structure
2. Set sharing permissions:
   - Team: Edit access
   - Stakeholders: View access
   - Public: No access (keep private)
3. Create shareable links for specific folders
4. Document links in central doc

**Option 2: Dropbox**
- Similar process to Google Drive
- Better for large files
- Good version history

**Option 3: AWS S3 + CloudFront** (recommended for production)
- Upload to S3 bucket
- Set up CloudFront CDN
- Configure caching
- Generate public URLs for web use

**Option 4: Digital Asset Management (DAM) System**
- Bynder, Brandfolder, or similar
- Centralized asset library
- Advanced search and filtering
- Usage tracking and analytics
- Access controls and permissions

**Asset URL Structure**
```
Production:
https://cdn.applyfor.us/assets/images/heroes/hero_homepage_2560.webp

Development:
https://dev-cdn.applyfor.us/assets/images/heroes/hero_homepage_2560.webp
```

---

## Phase 7: Documentation

### Step 7.1: Update Asset Inventory

**Asset Inventory Spreadsheet**

Create master spreadsheet (Google Sheets/Excel) with columns:

| Column | Description | Example |
|--------|-------------|---------|
| Asset ID | Unique identifier | IMG-2025-001 |
| Asset Name | Descriptive name | Homepage Hero - Professional |
| Type | Category | Hero Image |
| File Name | Actual file name | hero_homepage_professional_2560.webp |
| Dimensions | Size(s) | 2560x1440, 1920x1080, 750x1334 |
| Format(s) | File formats | WebP, JPG |
| Location | Folder path | /assets/images/heroes/homepage/ |
| URL | CDN/access link | https://cdn.applyfor.us/... |
| Status | Current status | Active / Archived / Deprecated |
| Created Date | Date created | 2025-12-08 |
| Created By | Creator | Jane Doe |
| Last Modified | Last update date | 2025-12-08 |
| Version | Version number | v2 |
| Usage | Where used | Homepage, About page |
| License | Usage rights | Internal use |
| Tags | Searchable tags | hero, professional, purple, modern |
| Notes | Additional info | Updated Dec 2025, replaced v1 |

**Maintain Regularly**
- Update when new assets added
- Mark deprecated assets
- Track usage changes
- Note version updates

---

### Step 7.2: Record Generation Details

**Asset Generation Log**

For each asset, document:

```markdown
ASSET GENERATION RECORD

Asset ID: IMG-2025-001
Asset Name: Homepage Hero - Professional Working

GENERATION DETAILS
Tool Used: Midjourney v6
Prompt: "modern professional workspace, laptop on minimal desk, natural window
light, purple accents #8B5CF6, professional photography style, shallow depth
of field, bright airy atmosphere --ar 16:9 --v 6 --style raw --s 250"
Seed: 123456789 (if applicable for reproducibility)
Generation Date: 2025-12-08
Iterations: 3
Selected Variation: U2 (upscale 2)

POST-PROCESSING
- Color correction in Photoshop (matched brand purple exactly)
- Sharpened with Smart Sharpen (80%, 1.0px)
- Exported in multiple sizes (2560, 1920, 1024, 750)
- Converted to WebP (80% quality)

APPROVALS
Reviewed By: John Smith
Approved Date: 2025-12-08
Approval Status: Approved with minor color adjustment

COST
Generation: $0.00 (included in Midjourney subscription)
Processing Time: 2 hours
Approval Rounds: 1

SOURCE FILES
PSD: /sources/psd/hero_homepage_professional_source.psd
Original AI Output: /sources/ai-outputs/midjourney_hero_homepage_raw.png
```

**Why Document Generation Details?**
- Reproduce similar assets in future
- Track what works well
- Audit trail for licensing
- Training for team members
- Continuous improvement

---

### Step 7.3: Note Usage Guidelines

**Usage Guidelines Document**

For each asset or asset category:

```markdown
ASSET USAGE GUIDELINES

Asset: Homepage Hero - Professional Working
Asset ID: IMG-2025-001

APPROVED USES
✓ Homepage hero section
✓ About page background
✓ Marketing presentations
✓ Social media posts (with proper cropping)

RESTRICTIONS
✗ Do not use on competitor pages
✗ Do not heavily filter or distort
✗ Do not crop out brand elements
✗ Do not overlay with unreadable text

TEXT OVERLAY GUIDELINES
- Safe zone for text: Right third of image
- Recommended text color: White with subtle shadow
- Max text overlay: 40% of image
- Maintain readability

RESPONSIVE BEHAVIOR
- Desktop (1920+): Full image, text overlay right
- Tablet (768-1919): Reframe to center subject
- Mobile (< 768): Use mobile-specific crop (vertical)

ACCESSIBILITY
- Alt text: "Professional working on laptop in modern workspace with
  natural lighting and purple accents"
- Ensure sufficient contrast for any text overlay (4.5:1 minimum)

REFRESH SCHEDULE
- Review annually or when rebrand occurs
- Currently set to refresh: 2026-12-01

LICENSING NOTES
- AI-generated via Midjourney (commercial license included)
- Post-processed by internal team
- Full commercial rights for ApplyforUs use
```

---

### Step 7.4: Archive Source Files

**Archival Strategy**

**What to Archive**
- Original AI-generated outputs (before any editing)
- Layered source files (PSD, AI, AEP)
- Alternative versions not selected
- Iteration examples
- Prompt texts and settings
- Approval documentation

**Where to Archive**
- Primary: Cloud storage (Google Drive, Dropbox, S3)
- Backup: External hard drive (quarterly backup)
- Long-term: Cold storage or archival service

**Organization**
```
/archives
  /2025
    /12-december
      /IMG-2025-001_homepage-hero
        /ai-outputs
          - midjourney_raw_v1.png
          - midjourney_raw_v2.png
          - midjourney_raw_v3.png
        /sources
          - hero_homepage_professional_source.psd
        /alternatives
          - alternative_01.png
          - alternative_02.png
        /documentation
          - generation_log.md
          - approval_email.pdf
          - usage_guidelines.md
```

**Retention Policy**
- Active assets: Indefinite
- Deprecated assets: 2 years after deprecation
- Alternative versions: 1 year
- AI outputs (raw): 1 year
- Source files: Indefinite (or minimum 3 years)

---

## Tools & Resources

### AI Generation Tools

**Image Generation**
| Tool | Cost | Best For | Link |
|------|------|----------|------|
| Midjourney | $10-60/mo | Photorealism, 3D | midjourney.com |
| DALL-E 3 | $20/mo (ChatGPT+) | Illustrations | openai.com |
| Stable Diffusion | Free (self-host) | Customization | stability.ai |
| Leonardo AI | Free tier + paid | Consistency | leonardo.ai |
| Adobe Firefly | Incl. in Creative Cloud | Integration | adobe.com/firefly |

**Video Generation**
| Tool | Cost | Best For |
|------|------|----------|
| Runway ML | $12-76/mo | Short clips |
| Pika Labs | Beta (free-paid) | Text-to-video |
| Synthesia | $30-custom | AI avatars |

**Animation**
| Tool | Cost | Best For |
|------|------|----------|
| After Effects | $22.99/mo | Full control |
| Lottie | Free | Web animations |

---

### Post-Processing Tools

**Image Editing**
- Adobe Photoshop ($22.99/mo)
- GIMP (Free alternative)
- Affinity Photo ($70 one-time)
- Photopea (Free, web-based)

**Compression & Optimization**
- TinyPNG (Free + paid)
- Squoosh (Free, web)
- ImageOptim (Free, Mac)
- Compressor.io (Free, web)

**Background Removal**
- Remove.bg (Free tier + paid)
- Photoshop (included)
- Clipdrop (Free + paid)

**Format Conversion**
- CloudConvert (Free + paid)
- FFmpeg (Free, command line)
- HandBrake (Free, video)

---

### Organization & Management

**Project Management**
- Asana
- Trello
- Monday.com
- ClickUp

**Digital Asset Management**
- Bynder (Enterprise)
- Brandfolder (Enterprise)
- Cloudinary (Developer-friendly)
- Dropbox / Google Drive (Simple)

**Version Control**
- Abstract (Design files)
- Git LFS (Large files)
- Dropbox (Built-in)

---

## Best Practices

### Do's

✓ **Start with high quality**
- Generate at highest possible resolution
- Use quality settings in AI tools
- Keep source files

✓ **Be specific in prompts**
- Include hex codes for colors
- Specify exact dimensions
- Describe style in detail
- Reference examples when possible

✓ **Iterate thoughtfully**
- Analyze what works and what doesn't
- Make targeted improvements
- Don't iterate indefinitely (diminishing returns)

✓ **Optimize for web**
- Use modern formats (WebP, AVIF)
- Create responsive variants
- Compress appropriately
- Test loading performance

✓ **Document everything**
- Keep generation logs
- Save prompts
- Track approvals
- Maintain asset inventory

✓ **Follow brand guidelines**
- Use exact brand colors
- Match established style
- Maintain consistency
- Get approvals

✓ **Plan for accessibility**
- Ensure good contrast
- Provide alt text
- Consider reduced motion
- Test with assistive tech

---

### Don'ts

✗ **Don't skip quality checks**
- Always review at 100% zoom
- Check for AI artifacts
- Test in intended context

✗ **Don't ignore file size**
- Large files hurt performance
- Users may abandon slow-loading pages
- Mobile data is expensive

✗ **Don't lose source files**
- Always archive originals
- Keep layered files
- Document where files are stored

✗ **Don't over-process**
- Maintain natural appearance
- Don't over-sharpen
- Avoid excessive filters
- Keep it authentic

✗ **Don't forget licensing**
- Verify commercial use rights
- Document AI tool used
- Check terms of service
- Keep proof of licensing

✗ **Don't reinvent the wheel**
- Use templates when appropriate
- Maintain style libraries
- Document successful prompts
- Share learnings with team

✗ **Don't ignore feedback**
- Stakeholder input is valuable
- User testing reveals issues
- Iterate based on data
- Be open to revision

---

## Continuous Improvement

### Metrics to Track
- Generation success rate (% approved on first try)
- Average iterations required
- Time from request to delivery
- File size averages (monitor bloat)
- Usage/performance of assets
- Cost per asset
- Team satisfaction scores

### Regular Reviews
- Monthly: Review asset inventory, archive unused
- Quarterly: Assess workflow efficiency, update tools
- Annually: Refresh brand assets, audit usage

### Team Training
- Share successful prompts library
- Document new techniques discovered
- Cross-train on tools and processes
- Stay updated on AI tool improvements

---

## Troubleshooting Common Issues

### Issue: AI artifacts (distorted faces, hands, text)

**Solutions**:
- Specify "high quality, professional" in prompt
- Avoid complex poses or scenarios
- Generate multiple variations, select best
- Use img2img refinement
- Manual Photoshop fix for small issues
- Use different AI tool if persistent

---

### Issue: Wrong colors/doesn't match brand

**Solutions**:
- Include exact hex codes in prompt
- Use Photoshop color replacement
- Create color lookup table (LUT) for batch processing
- Consider "color grading" in prompt
- Use Hue/Saturation adjustments layer

---

### Issue: File sizes too large

**Solutions**:
- Use WebP instead of PNG/JPG
- Reduce quality slightly (80% vs 100%)
- Resize appropriately (don't use 4K for thumbnails)
- Use optimization tools (TinyPNG, Squoosh)
- Consider SVG for simple graphics
- Lazy load images

---

### Issue: Generated image doesn't match vision

**Solutions**:
- Break complex requests into simpler prompts
- Use reference images if tool supports (img2img)
- Be more specific in prompt (add details)
- Try different AI tool
- Consider commissioning custom illustration
- Composite multiple generated elements

---

### Issue: Inconsistent style across assets

**Solutions**:
- Use same AI tool and settings
- Save and reuse successful prompts as templates
- Use seed numbers for consistency (when available)
- Create style guide with reference images
- Batch generate related assets together
- Post-process with same filters/adjustments

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-08 | 1.0 | Initial workflow documentation |

---

## Appendix: Quick Reference Checklists

### New Asset Request Checklist
- [ ] Requirements documented
- [ ] Dimensions specified
- [ ] Use case defined
- [ ] Deadline set
- [ ] Budget approved
- [ ] Tool selected
- [ ] Prompt prepared

### Pre-Generation Checklist
- [ ] Prompt reviewed and optimized
- [ ] Reference images collected (if applicable)
- [ ] Success criteria defined
- [ ] Generation tool accessed
- [ ] Time allocated

### Post-Generation Checklist
- [ ] Quality review completed
- [ ] Edits made (if needed)
- [ ] Optimized for web
- [ ] Multiple formats exported
- [ ] Responsive variants created
- [ ] Files properly named
- [ ] Uploaded to asset library
- [ ] Metadata added
- [ ] Inventory updated
- [ ] Documentation completed
- [ ] Source files archived
- [ ] Stakeholders notified

---

**This workflow ensures high-quality, consistent, and well-managed AI-generated assets for the ApplyforUs platform. Follow these processes for efficient creative production and excellent results.**
