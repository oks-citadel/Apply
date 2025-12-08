# ApplyforUs Social Media Templates

## Overview
Social media templates ensure consistent, professional brand presence across all platforms. These specifications cover optimal sizes, safe zones, and design guidelines for maximum engagement.

---

## General Design Principles

### 1. Brand Consistency
- Use official logo files only
- Stick to brand color palette
- Maintain typography hierarchy
- Follow illustration style guide

### 2. Platform Optimization
- Design for each platform's unique format
- Consider mobile viewing (80%+ of social traffic)
- Test on actual devices, not just design tools
- Account for profile picture overlaps

### 3. Engagement-Focused
- Clear, compelling headlines
- High-contrast text for readability
- Strong calls-to-action
- Eye-catching visuals without being cluttered

### 4. Accessibility
- Minimum 4.5:1 contrast ratio for text
- Don't rely on color alone to convey meaning
- Include alt text for all images
- Captions for video content

---

## Platform Specifications

## LinkedIn

### 1. Profile Photo
**Dimensions**: 400×400px (displays at 300×300px)
**Format**: PNG with transparent background
**Safe Area**: 360×360px centered (avoid 20px border)

**Design Guidelines**:
- Use ApplyforUs icon only (not full logo)
- Center icon in canvas
- Background: Transparent or solid brand color (#6366F1)
- 15% padding from edges

**File**: `applyus-linkedin-profile-400x400.png`

### 2. Cover Photo (Banner)
**Dimensions**: 1584×396px
**Format**: JPG or PNG
**Safe Area**: Avoid bottom-left 268×268px (profile photo overlap)
**File Size**: < 8MB

**Layout**:
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  Main Message Centered                    Logo │
│  Subtitle Text                            Here │
│  ⚠ Avoid this corner                           │
└─────────────────────────────────────────────────┘
    268×268px safe zone
```

**Design Guidelines**:
- Main headline: 48-64px bold text
- Subtitle: 24-32px regular text
- Logo: 120-140px wide, bottom-right corner
- Padding: 40px from all edges
- Background: Brand gradient or solid with pattern

**Use Cases**:
- Company milestone announcements
- Feature launches
- Hiring/team announcements
- Branded company presence

**File**: `applyus-linkedin-cover-1584x396.jpg`

### 3. Shared Content (Link Preview)
**Dimensions**: 1200×627px (1.91:1 ratio)
**Format**: JPG or PNG
**File Size**: < 5MB

**Layout**:
```
┌──────────────────────────────────────┐
│  🅰 Logo                              │
│                                      │
│          Main Headline               │
│          Supporting Text             │
│                                      │
│                        [CTA Button]  │
└──────────────────────────────────────┘
```

**Design Guidelines**:
- Logo: 100px wide, top-left corner
- Headline: 36-48px bold, centered or left-aligned
- Body text: 20-24px, max 2 lines
- CTA: Optional, bottom-right
- Padding: 40px from edges
- Readable on mobile thumbnails (test at 360px wide)

**Content Types**:
- Blog post previews
- Feature announcements
- Company news
- Event promotions
- Case studies

**File**: `applyus-linkedin-post-1200x627.jpg`

### 4. Shared Content (Square)
**Dimensions**: 1200×1200px (1:1 ratio)
**Format**: JPG or PNG
**File Size**: < 5MB

**Layout**:
```
┌────────────────────────────┐
│                            │
│      Main Visual or        │
│      Illustration          │
│                            │
│    Headline Text Here      │
│    applyfor.us       🅰    │
└────────────────────────────┘
```

**Design Guidelines**:
- Visual: Top 60-70% of canvas
- Text: Bottom 30-40%
- Logo: 80px wide, bottom-right
- Works well for: Stats, quotes, tips, achievements

**File**: `applyus-linkedin-post-1200x1200.jpg`

---

## Twitter / X

### 1. Profile Photo
**Dimensions**: 400×400px (displays at 200×200px)
**Format**: PNG with transparent background
**Circular Crop**: Design will be cropped to circle

**Design Guidelines**:
- Use ApplyforUs icon only
- Center with 18% padding (circular safe area)
- Background: Transparent or solid brand color
- Ensure icon reads well in circular crop

**File**: `applyus-twitter-profile-400x400.png`

### 2. Header Image
**Dimensions**: 1500×500px (3:1 ratio)
**Format**: JPG or PNG
**Safe Area**: Avoid left 280px where profile overlaps
**File Size**: < 5MB

**Layout**:
```
┌─────────────────────────────────────────┐
│ ⚠ Profile │  Main Headline        Logo │
│  overlap  │  Tagline or Message   Here │
│           │                             │
└─────────────────────────────────────────┘
   280px        Safe area for content
```

**Design Guidelines**:
- Main text: Right of 300px mark
- Logo: 120px wide, right side
- Headline: 48-60px bold
- Keep important content right-aligned
- Background: Brand gradient, pattern, or image

**File**: `applyus-twitter-header-1500x500.jpg`

### 3. In-Feed Image Post
**Dimensions**: 1200×675px (16:9 ratio)
**Format**: JPG or PNG
**File Size**: < 5MB
**Alternative**: 1200×1200px (square) also supported

**Layout**:
```
┌──────────────────────────────────────┐
│  🅰                                   │
│                                      │
│      Main Message or Visual          │
│      Attention-Grabbing Content      │
│                                      │
└──────────────────────────────────────┘
```

**Design Guidelines**:
- Logo: 80px wide, top-left or bottom-right
- Headline: 40-56px bold
- Body text: 20-28px
- High contrast for timeline scanning
- Mobile-first: Test at 320px width

**Content Types**:
- Product updates
- Tips and insights
- Quick stats
- Quotes
- Announcements

**File**: `applyus-twitter-post-1200x675.jpg`

### 4. Twitter Card (Link Preview)
**Dimensions**: 1200×628px
**Format**: JPG or PNG
**File Size**: < 5MB

**Implementation**:
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@applyfor_us">
<meta name="twitter:title" content="Your Title Here">
<meta name="twitter:description" content="Description text">
<meta name="twitter:image" content="https://applyfor.us/image.jpg">
```

**Design Guidelines**:
- Clear, bold headline
- Logo in corner (80-100px)
- CTA or key benefit
- Not too text-heavy (Twitter adds title/description)

**File**: `applyus-twitter-card-1200x628.jpg`

---

## Facebook

### 1. Profile Photo
**Dimensions**: 180×180px (displays at 170×170px)
**Format**: PNG with transparent background
**Circular Crop**: Displayed as circle

**Design Guidelines**:
- Use ApplyforUs icon only
- 20% padding for circular crop
- Background: Transparent or brand color

**File**: `applyus-facebook-profile-180x180.png`

### 2. Cover Photo
**Dimensions**: 820×312px
**Format**: JPG or PNG
**Safe Area**: Avoid bottom 75px (mobile profile overlap)
**File Size**: < 100KB (recommended)

**Layout**:
```
┌─────────────────────────────────────────┐
│                                    Logo │
│  Main Headline Text                     │
│  Supporting Message                     │
│  ⚠ Avoid bottom area on mobile          │
└─────────────────────────────────────────┘
```

**Design Guidelines**:
- Keep critical content in top 237px
- Logo: 120px wide, top-right
- Headline: 36-48px
- Test on both desktop (820×312) and mobile (640×360)

**File**: `applyus-facebook-cover-820x312.jpg`

### 3. Shared Link (Feed)
**Dimensions**: 1200×630px (1.91:1 ratio)
**Format**: JPG or PNG
**File Size**: < 8MB

**Implementation**:
```html
<meta property="og:image" content="https://applyfor.us/image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:title" content="Your Title">
<meta property="og:description" content="Description">
```

**Design Guidelines**:
- Logo: 100px wide
- Headline: 36-48px bold
- Supporting text: 20-24px
- Facebook adds title/description, so image should be visual/conceptual

**File**: `applyus-facebook-link-1200x630.jpg`

### 4. Image Post (Square)
**Dimensions**: 1200×1200px (1:1 ratio)
**Format**: JPG or PNG
**File Size**: < 10MB

**Design Guidelines**:
- Most versatile format
- Works in feed and stories
- Logo: 80-100px
- High contrast for mobile

**File**: `applyus-facebook-post-1200x1200.jpg`

---

## Instagram

### 1. Profile Photo
**Dimensions**: 320×320px (displays at 110×110px)
**Format**: PNG with transparent background
**Circular Crop**: Always displayed as circle

**Design Guidelines**:
- Use icon only (simple, recognizable)
- 20% padding for circular safe area
- High contrast (small display size)
- Test at 110px to ensure readability

**File**: `applyus-instagram-profile-320x320.png`

### 2. Feed Post (Square)
**Dimensions**: 1080×1080px (1:1 ratio)
**Format**: JPG or PNG
**File Size**: < 30MB (< 5MB recommended)

**Layout**:
```
┌────────────────────────────┐
│                            │
│      Visual Content        │
│      or Illustration       │
│                            │
│    Text Overlay (opt.)     │
│    Logo    applyfor.us     │
└────────────────────────────┘
```

**Design Guidelines**:
- Logo: 80px wide, bottom-right (or omit if in caption)
- Minimal text (caption tells story)
- High-quality images/illustrations
- Consistent aesthetic across posts
- Padding: 40px from edges

**Content Types**:
- Feature highlights
- User testimonials
- Tips and insights
- Behind-the-scenes
- Team announcements

**File**: `applyus-instagram-post-1080x1080.jpg`

### 3. Feed Post (Portrait)
**Dimensions**: 1080×1350px (4:5 ratio)
**Format**: JPG or PNG
**File Size**: < 30MB

**Design Guidelines**:
- Taller format for more prominence in feed
- Logo: Bottom-right or top-right
- More space for vertical content
- Ideal for infographics, step-by-step guides

**File**: `applyus-instagram-portrait-1080x1350.jpg`

### 4. Story / Reels
**Dimensions**: 1080×1920px (9:16 ratio)
**Format**: JPG, PNG, MP4
**File Size**: < 30MB
**Duration**: 15-60 seconds (video)

**Layout**:
```
┌─────────────┐
│             │ ← Top 250px: Profile & controls
│   Safe      │
│   Area      │
│   Content   │
│   Here      │
│             │
│   🅰 Logo   │ ← Bottom 250px: CTA buttons
└─────────────┘
```

**Safe Areas**:
- Top 250px: Avoid (profile info, exit button)
- Bottom 250px: Avoid (swipe up, share buttons)
- Content area: 1080×1420px centered

**Design Guidelines**:
- Logo: 60-80px, safe area
- Large text: 60-80px (mobile viewing)
- Vertical orientation
- High contrast
- Motion/video preferred over static

**Content Types**:
- Quick tips
- Feature demos
- Behind-the-scenes
- User stories
- Announcements

**File**: `applyus-instagram-story-1080x1920.jpg` or `.mp4`

---

## YouTube

### 1. Profile Photo
**Dimensions**: 800×800px (displays at 98×98px)
**Format**: PNG with transparent background
**Circular Crop**: Displayed as circle

**Design Guidelines**:
- Use icon only
- 18% padding for circular crop
- Simple, recognizable at small size

**File**: `applyus-youtube-profile-800x800.png`

### 2. Channel Art (Banner)
**Dimensions**: 2560×1440px
**Format**: JPG or PNG
**File Size**: < 6MB

**Safe Areas** (critical for responsive display):
```
┌─────────────────────────────────────────────────┐
│ TV (2560×1440) - Full canvas                    │
│   ┌─────────────────────────────────────┐       │
│   │ Desktop (2560×423) - Center strip   │       │
│   │  ┌───────────────────────────┐      │       │
│   │  │ Tablet (1855×423)         │      │       │
│   │  │ ┌──────────────────┐      │      │       │
│   │  │ │ Mobile (1546×423)│      │      │       │
│   │  │ │  Critical Zone   │      │      │       │
│   │  │ └──────────────────┘      │      │       │
│   │  └───────────────────────────┘      │       │
│   └─────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

**Critical Zone**: 1546×423px centered
- **All important content must be here**
- Logo, headline, tagline in this area
- Outer areas only for decorative elements

**Design Guidelines**:
- Logo: 140px wide, centered in critical zone
- Headline: 48-60px, centered
- Tagline: 24-32px
- Test at all sizes (TV, desktop, tablet, mobile)
- Padding: 40px minimum from critical zone edges

**File**: `applyus-youtube-banner-2560x1440.jpg`

### 3. Video Thumbnail
**Dimensions**: 1280×720px (16:9 ratio)
**Format**: JPG or PNG
**File Size**: < 2MB

**Layout**:
```
┌────────────────────────────────────┐
│  🅰                                 │
│                                    │
│     Bold Headline Text             │
│     3-5 Words Max                  │
│                                    │
│                   ▶ Play indicator │
└────────────────────────────────────┘
```

**Design Guidelines**:
- Logo: 80px wide, top-left
- Headline: 60-80px bold, high contrast
- 3-5 words maximum (readable at 168px wide)
- Bright, eye-catching colors
- Clear focal point
- Play button indicator (optional)
- Consistent style across videos

**Best Practices**:
- Face/person: Increases click-through rate
- High contrast text
- Avoid clickbait (algorithm penalizes)
- Test on mobile (most views)
- Brand consistency

**File**: `applyus-youtube-thumbnail-1280x720.jpg`

### 4. End Screen Elements
**Dimensions**: 1920×1080px (16:9 ratio)
**Format**: PNG with transparency for overlays

**Safe Areas**:
- Bottom-right 300×300px: Subscribe button
- Bottom-left 300×300px: Video suggestion
- Avoid corners for critical content

**Design Guidelines**:
- Simple CTA overlay
- Transparent background for flexibility
- Logo and tagline
- Arrow indicators for clickable areas

**File**: `applyus-youtube-endscreen-1920x1080.png`

---

## TikTok

### 1. Profile Photo
**Dimensions**: 200×200px
**Format**: PNG
**Circular Crop**: Displayed as circle

**Design Guidelines**:
- Icon only
- 20% padding
- Simple, recognizable

**File**: `applyus-tiktok-profile-200x200.png`

### 2. Video (Feed)
**Dimensions**: 1080×1920px (9:16 ratio)
**Format**: MP4, MOV
**File Size**: < 287.6MB
**Duration**: 15-60 seconds (up to 10 minutes available)

**Safe Areas**:
```
┌─────────────┐
│ Profile     │ ← Top 200px
│ Username    │
│             │
│   Content   │
│   Safe      │
│   Area      │
│             │
│ Caption     │ ← Bottom 300px
│ Engagement  │
└─────────────┘
```

**Design Guidelines**:
- Critical content: 1080×1420px centered
- Logo: Top-right, 60-80px (if watermark needed)
- Fast-paced, mobile-first
- Captions essential (many watch muted)
- Vertical format only

**Content Types**:
- Career tips (15-30 seconds)
- Feature demos
- User testimonials
- Quick wins
- Behind-the-scenes

**File**: `applyus-tiktok-video-1080x1920.mp4`

---

## Cross-Platform Templates

### Template 1: Feature Announcement

**Platforms**: LinkedIn, Twitter, Facebook, Instagram
**Sizes**: 1200×1200px (square), 1200×627px (landscape), 1080×1920px (story)

**Layout**:
```
┌────────────────────────────┐
│  🅰 ApplyforUs              │
│                            │
│    🎉 NEW FEATURE          │
│                            │
│    [Feature Illustration]  │
│                            │
│    AI Resume Builder       │
│    Build your perfect      │
│    resume in minutes       │
│                            │
│    [Learn More Button]     │
└────────────────────────────┘
```

**Colors**: Brand gradient background, white text
**Typography**: 48px headline, 24px body
**Elements**: Icon, illustration, CTA button

### Template 2: Tip / Insight

**Platforms**: Instagram, LinkedIn, Twitter
**Sizes**: 1080×1080px (square), 1080×1350px (portrait)

**Layout**:
```
┌────────────────────────────┐
│                            │
│    💡 PRO TIP              │
│                            │
│    "Main tip text here     │
│    in large, readable      │
│    typography"             │
│                            │
│    - Supporting detail     │
│    - Another point         │
│                            │
│    applyfor.us       🅰    │
└────────────────────────────┘
```

**Colors**: Solid background (brand colors rotate), white text
**Typography**: 56px for quote, 24px for details
**Elements**: Emoji, quote marks, logo

### Template 3: User Testimonial

**Platforms**: All
**Sizes**: Multiple

**Layout**:
```
┌────────────────────────────┐
│  [User Photo - circular]   │
│                            │
│  "User quote about how     │
│  ApplyforUs helped them    │
│  land their dream job"     │
│                            │
│  - User Name               │
│    Job Title at Company    │
│                            │
│    🅰 applyfor.us          │
└────────────────────────────┘
```

**Colors**: Light background, dark text
**Typography**: 36px quote, 20px attribution
**Elements**: Photo, quote marks, logo

### Template 4: Statistic / Achievement

**Platforms**: Instagram, Twitter, LinkedIn
**Sizes**: 1080×1080px primarily

**Layout**:
```
┌────────────────────────────┐
│                            │
│        10,000+             │
│                            │
│    Jobs Applied to         │
│    This Week               │
│                            │
│    [Illustration/Icon]     │
│                            │
│    🅰 ApplyforUs           │
└────────────────────────────┘
```

**Colors**: Brand gradient or solid
**Typography**: 80px for number, 32px for label
**Elements**: Large number, icon, logo

---

## Design Specifications

### Typography

#### Headlines
- **Font**: Inter Bold or Outfit Bold
- **Size Range**: 36-80px (based on platform/format)
- **Line Height**: 1.1-1.2
- **Letter Spacing**: -1% to -2%
- **Colors**: #1F2937 (dark), #FFFFFF (light), brand colors

#### Body Text
- **Font**: Inter Regular or Inter Medium
- **Size Range**: 18-28px
- **Line Height**: 1.4-1.5
- **Letter Spacing**: 0%
- **Colors**: #1F2937, #6B7280, #FFFFFF

#### CTAs
- **Font**: Inter SemiBold or Bold
- **Size**: 20-24px
- **Style**: Button or text link
- **Colors**: #6366F1 (primary), #FFFFFF (on dark)

### Color Usage

#### Backgrounds
- **Primary**: #6366F1 (Indigo)
- **Secondary**: #8B5CF6 (Violet)
- **Success**: #10B981 (Emerald)
- **Light**: #F9FAFB (Gray-50)
- **Dark**: #1F2937 (Gray-800)
- **Gradients**: 135° linear, primary to secondary

#### Text
- **On Light**: #1F2937 (Gray-800)
- **On Dark**: #FFFFFF (White)
- **On Brand**: #FFFFFF (White) or #1F2937 (depends on contrast)

#### Contrast Requirements
All text must meet WCAG 2.1 Level AA:
- Normal text: 4.5:1 minimum
- Large text (18px+ bold, 24px+ regular): 3:1 minimum

### Logo Placement

#### Default Position
- **Bottom-right**: 80-120px from edges
- **Top-left**: 40-60px from edges
- **Centered footer**: For minimal designs

#### Logo Size
- **Square posts (1080×1080)**: 80-100px wide
- **Landscape posts (1200×627)**: 100-120px wide
- **Stories (1080×1920)**: 60-80px wide
- **Banners/covers**: 120-140px wide

#### Logo Variants
- **Full logo**: Horizontal with wordmark
- **Icon only**: When space is limited or brand is established
- **Light version**: On dark backgrounds
- **Dark version**: On light backgrounds

---

## Content Guidelines

### Text Overlay Best Practices

#### Readability
- Maximum 10 words per line
- Maximum 3 lines of text
- High contrast (4.5:1 minimum)
- Sans-serif fonts only
- Avoid all caps (except short headlines)

#### Text Effects
✓ **Use**:
- Solid background boxes behind text
- Semi-transparent overlays (0.7-0.9 opacity)
- Stroke/outline (2-3px) for contrast

✗ **Avoid**:
- Drop shadows (can reduce readability)
- Thin fonts on busy backgrounds
- Text over faces or detailed images
- Low contrast color combinations

### Image Selection

#### Photos
- High resolution (minimum 2× final size)
- Professional quality
- Diverse representation
- Rights-cleared (licensed or stock)
- Faces looking toward content (not away)

#### Illustrations
- Follow ApplyforUs illustration style guide
- Use brand colors
- Simple, clear concepts
- Scalable to small sizes

### Call-to-Action

#### Strong CTAs
✓ "Get Started Free"
✓ "Try Now"
✓ "Learn More"
✓ "See How It Works"
✓ "Join 10,000+ Users"

#### Weak CTAs
✗ "Click Here"
✗ "More Info"
✗ "Read"
✗ Generic phrases

---

## Platform-Specific Best Practices

### LinkedIn
- Professional tone
- Industry insights
- Longer-form content
- Business value focus
- Post time: Tue-Thu, 7-9am

### Twitter/X
- Concise, punchy
- Hashtags (1-2 relevant)
- Thread for longer content
- Conversational tone
- Post time: Mon-Fri, 12-1pm

### Facebook
- Community-focused
- Longer captions okay
- Video performs well
- Group engagement
- Post time: Wed-Fri, 1-4pm

### Instagram
- Visual-first
- Story-driven
- Hashtags (5-10 relevant)
- Consistent aesthetic
- Post time: Mon-Fri, 11am-1pm

### YouTube
- Long-form content
- SEO-optimized titles
- Detailed descriptions
- Consistent schedule
- Upload: Thu-Fri for weekend views

### TikTok
- Authentic, casual
- Trend participation
- Fast-paced editing
- Captions essential
- Post time: Tue-Thu, 6-10pm

---

## File Naming Convention

```
applyus-[platform]-[type]-[dimension]-[date]-[version].[ext]
```

**Examples**:
- `applyus-linkedin-post-1200x627-2025-01-15-v1.jpg`
- `applyus-instagram-story-1080x1920-feature-announcement.mp4`
- `applyus-twitter-card-1200x628-blog-post.png`
- `applyus-youtube-thumbnail-1280x720-tutorial-01.jpg`

**Components**:
- **platform**: linkedin, twitter, facebook, instagram, youtube, tiktok
- **type**: post, story, cover, profile, thumbnail, banner
- **dimension**: WIDTHxHEIGHT
- **date** (optional): YYYY-MM-DD
- **version** (optional): v1, v2, final

---

## Tools & Resources

### Design Tools
- **Figma**: Primary design tool (templates available)
- **Canva Pro**: Quick template customization
- **Adobe Photoshop**: Image editing
- **Adobe Illustrator**: Vector graphics

### Preview Tools
- **Facebook Debugger**: Test Open Graph tags
- **Twitter Card Validator**: Test Twitter cards
- **LinkedIn Post Inspector**: Preview link shares
- **Responsively**: Test multiple device sizes

### Optimization
- **TinyPNG**: Compress PNG files
- **JPEG Optimizer**: Reduce JPEG file size
- **SVGOMG**: Optimize SVG files
- **HandBrake**: Compress video files

### Scheduling
- **Buffer**: Multi-platform scheduling
- **Hootsuite**: Enterprise scheduling
- **Later**: Instagram-focused
- **Native platforms**: Each platform's own scheduler

---

## Template Library

### Access Templates
- **Figma**: [Internal Figma Link]
- **Canva**: [Team Canva Account]
- **Google Drive**: `/Brand Assets/Social Media Templates/`

### Template Categories
1. **Feature Announcements**
2. **Tips & Insights**
3. **User Testimonials**
4. **Statistics & Achievements**
5. **Job Search Tips**
6. **Company News**
7. **Behind-the-Scenes**
8. **Seasonal/Holiday**

### Requesting Custom Template
1. Submit request via Slack (#marketing-requests)
2. Include: Purpose, platform, deadline, reference examples
3. Design team creates within 2-3 business days
4. Review and approval process
5. Delivery of source files and exports

---

## Quality Checklist

Before posting, verify:

### Design
- ✓ Correct dimensions for platform
- ✓ Logo placed appropriately (size, position)
- ✓ Brand colors used correctly
- ✓ Typography follows guidelines
- ✓ Text contrast meets 4.5:1 minimum
- ✓ No typos or grammar errors
- ✓ All elements within safe zones

### Technical
- ✓ File size within platform limits
- ✓ Correct file format
- ✓ Images exported at proper resolution
- ✓ Video/audio quality checked
- ✓ Alt text written (accessibility)
- ✓ Mobile preview looks good

### Content
- ✓ Message is clear and concise
- ✓ CTA is compelling
- ✓ Relevant to audience
- ✓ Consistent with brand voice
- ✓ Copyright/licensing verified
- ✓ Links work correctly

### Platform-Specific
- ✓ Open Graph tags set (Facebook/LinkedIn)
- ✓ Twitter Card tags set (Twitter)
- ✓ Hashtags included where appropriate
- ✓ Tagged accounts (if applicable)
- ✓ Captions/subtitles (for video)

---

## Performance Metrics

Track these metrics for each platform:

### Engagement Rate
- Likes + Comments + Shares / Impressions × 100

### Click-Through Rate (CTR)
- Clicks / Impressions × 100

### Conversion Rate
- Conversions / Clicks × 100

### Optimal Posts
Monitor which templates perform best:
- Format (square, landscape, story)
- Content type (tips, testimonials, features)
- Time of day posted
- Caption length
- Hashtag usage

### A/B Testing
Test variations:
- Headline phrasing
- Image vs. illustration
- Color schemes
- CTA placement
- Text amount

---

## Questions & Support

For social media template questions:
- **Email**: marketing@applyfor.us
- **Slack**: #marketing-requests
- **Template Library**: [Figma Link]
- **Brand Guidelines**: `/assets/brand/README.md`

**Remember**: Consistency builds recognition. Use these templates as a foundation, but don't be afraid to adapt for platform-specific trends and audience preferences.
