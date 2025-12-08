# ApplyforUs Icon System

## Overview
The ApplyforUs icon system is designed to be clear, consistent, and aligned with our brand identity. Our icons follow a cohesive design language that emphasizes simplicity, recognizability, and accessibility.

---

## Design Principles

### 1. Clarity First
- Icons must be recognizable at 16px
- Use simple, universal metaphors
- Avoid unnecessary detail
- Test at actual usage size

### 2. Geometric Foundation
- Based on 24×24px grid
- 2px padding from canvas edge
- Align to pixel grid (no sub-pixels)
- Use consistent stroke weight

### 3. Visual Consistency
- Unified stroke weight: 2px (standard), 1.5px (small variants)
- Consistent corner radius: 2px
- Balanced negative space
- Optical alignment over mathematical

### 4. Brand Alignment
- Reflect ApplyforUs personality
- Use brand colors appropriately
- Match logo's visual language
- Professional yet approachable

---

## Technical Specifications

### Canvas & Grid
- **Base Size**: 24×24px
- **Export Sizes**: 16px, 20px, 24px, 32px, 48px
- **Grid**: 1px base unit
- **Live Area**: 20×20px (2px padding)

### Stroke & Weight
- **Default Stroke**: 2px
- **Small Size Stroke** (<20px): 1.5px
- **Corners**: 2px radius (rounded-square feel)
- **Terminals**: Round caps and joins

### Color Specifications

#### Default States
- **Primary Action**: #6366F1 (Indigo-500)
- **Secondary**: #6B7280 (Gray-500)
- **Success**: #10B981 (Emerald-500)
- **Warning**: #F59E0B (Amber-500)
- **Error**: #EF4444 (Red-500)
- **Disabled**: #D1D5DB (Gray-300)

#### Dark Mode
- **Primary Action**: #818CF8 (Indigo-400)
- **Secondary**: #9CA3AF (Gray-400)
- **Success**: #34D399 (Emerald-400)
- **Warning**: #FBBF24 (Amber-400)
- **Error**: #F87171 (Red-400)
- **Disabled**: #4B5563 (Gray-600)

### File Formats
- **Vector**: SVG (primary), AI (source)
- **Optimization**: SVGO with preset
- **Naming**: `icon-[name]-[size].svg`
  - Example: `icon-dashboard-24.svg`

---

## Icon Categories

## 1. Navigation Icons

Core navigation elements for primary app navigation.

### Dashboard
**Metaphor**: Grid layout representing overview
```
┌─┬─┐
├─┼─┤
└─┴─┘
```
- **Usage**: Main dashboard, home view
- **States**: Default, active, hover
- **Variants**: Filled (active), outline (inactive)

### Jobs
**Metaphor**: Briefcase representing professional work
```
 ┌───┐
┌┴─┬─┴┐
│  │  │
└────┘
```
- **Usage**: Job listings, job search
- **States**: Default, active, hover
- **Variants**: Filled, outline, with badge (new jobs count)

### Resumes
**Metaphor**: Document with lines representing resume
```
┌────┐
│────│
│────│
│──  │
└────┘
```
- **Usage**: Resume management, resume builder
- **States**: Default, active, hover
- **Variants**: Single document, multiple documents (stack)

### Auto-Apply
**Metaphor**: Play button + automation arrows
```
  ┌→─→┐
  │ ▶ │
  └←─←┘
```
- **Usage**: Automated application feature
- **States**: Default, active, running (animated)
- **Animation**: Arrows can rotate/pulse when active

### AI Tools
**Metaphor**: Sparkle/stars representing AI magic
```
  ✦
 ✧ ✧
  ✦
```
- **Usage**: AI-powered features section
- **States**: Default, active, processing (animated)
- **Variants**: Single sparkle, multiple sparkles

### Applications
**Metaphor**: Clipboard with checkmark
```
┌────┐
│ ✓  │
│────│
│────│
└────┘
```
- **Usage**: Application tracking
- **States**: Default, active, with status indicator
- **Variants**: Pending, accepted, rejected

### Analytics
**Metaphor**: Bar chart ascending
```
  █
 ██
███
```
- **Usage**: Statistics and analytics section
- **States**: Default, active
- **Variants**: Bar chart, line chart, pie chart

### Profile
**Metaphor**: User silhouette
```
 ┌─┐
 │▪│
┌┴─┴┐
│   │
└───┘
```
- **Usage**: User profile, settings
- **States**: Default, active
- **Variants**: Single user, multiple users (team)

### Settings
**Metaphor**: Gear/cog
```
 ╱─╲
│ ● │
 ╲─╱
```
- **Usage**: Application settings
- **States**: Default, active
- **Variants**: Single gear, multiple gears (advanced)

### Notifications
**Metaphor**: Bell
```
 ┌─┐
┌┘ └┐
│   │
 ╲─╱
```
- **Usage**: Notification center
- **States**: Default, with badge (unread count)
- **Animation**: Shake/ring when new notification

---

## 2. Feature Icons

Icons representing specific features and actions.

### AI Resume Builder
**Icon**: Document + sparkle
- **Color**: Primary gradient (#6366F1 to #8B5CF6)
- **Usage**: Resume building with AI
- **Size**: 24px minimum

### Cover Letter Generator
**Icon**: Envelope + sparkle
- **Color**: Primary (#6366F1)
- **Usage**: AI cover letter generation
- **Size**: 24px minimum

### Interview Prep
**Icon**: Microphone + person
- **Color**: Success (#10B981)
- **Usage**: Interview preparation tools
- **Size**: 24px minimum

### Salary Insights
**Icon**: Dollar sign + chart
- **Color**: Emerald (#10B981)
- **Usage**: Salary information
- **Size**: 24px minimum

### Company Research
**Icon**: Magnifying glass + building
- **Color**: Indigo (#6366F1)
- **Usage**: Company information lookup
- **Size**: 24px minimum

### Network Connections
**Icon**: Connected nodes
- **Color**: Violet (#8B5CF6)
- **Usage**: Professional networking
- **Size**: 24px minimum

### Career Path
**Icon**: Path/road leading upward
- **Color**: Primary gradient
- **Usage**: Career planning
- **Size**: 24px minimum

### Skills Match
**Icon**: Puzzle pieces connecting
- **Color**: Success (#10B981)
- **Usage**: Skills alignment with jobs
- **Size**: 24px minimum

---

## 3. Status Icons

Icons indicating status, states, and feedback.

### Success / Complete
**Icon**: Checkmark in circle
```
┌───┐
│ ✓ │
└───┘
```
- **Color**: #10B981 (Emerald)
- **Usage**: Success messages, completed tasks
- **Variants**: Circle, square, standalone

### Warning / Attention
**Icon**: Exclamation mark in triangle
```
  ╱╲
 ╱ !╲
╱────╲
```
- **Color**: #F59E0B (Amber)
- **Usage**: Warnings, important notices
- **Variants**: Triangle, circle, standalone

### Error / Failed
**Icon**: X in circle
```
┌───┐
│ ✕ │
└───┘
```
- **Color**: #EF4444 (Red)
- **Usage**: Error messages, failed actions
- **Variants**: Circle, square, standalone

### Info / Help
**Icon**: "i" in circle
```
┌───┐
│ i │
└───┘
```
- **Color**: #6366F1 (Indigo)
- **Usage**: Informational messages, help text
- **Variants**: Circle, square, standalone

### Processing / Loading
**Icon**: Circular spinner
```
   ○
 ╱   ╲
●     ○
 ╲   ╱
   ○
```
- **Color**: Primary (#6366F1)
- **Usage**: Loading states
- **Animation**: Rotate continuously

### Pending
**Icon**: Clock
```
 ┌─┐
┌┤●│
│└─┘│
└───┘
```
- **Color**: #6B7280 (Gray)
- **Usage**: Pending actions, scheduled items
- **Variants**: Clock, hourglass

### Verified
**Icon**: Checkmark with badge
```
 ╭─╮
 │✓│★
 ╰─╯
```
- **Color**: #10B981 with #6366F1 badge
- **Usage**: Verified profiles, confirmed information
- **Size**: 20px minimum

### Draft
**Icon**: Document with pencil
```
┌────┐
│──┌┐│
│──└┘│
└────┘
```
- **Color**: #6B7280 (Gray)
- **Usage**: Draft content
- **Size**: 20px minimum

---

## 4. Action Icons

Icons for user actions and interactions.

### Add / Create
**Icon**: Plus sign
```
  │
──┼──
  │
```
- **Color**: Primary (#6366F1)
- **Usage**: Create new items
- **Variants**: Plus in circle, plus in square

### Edit / Modify
**Icon**: Pencil
```
    ╱│
  ╱  │
╱────┘
```
- **Color**: Primary (#6366F1)
- **Usage**: Edit existing content
- **Variants**: Pencil, pen, edit lines

### Delete / Remove
**Icon**: Trash can
```
┌─┬─┐
│ ╳ │
└───┘
```
- **Color**: #EF4444 (Red)
- **Usage**: Delete items
- **Hover state**: Shake animation

### Save / Download
**Icon**: Download arrow
```
  ↓
─┬─┬─
 │ │
```
- **Color**: Success (#10B981)
- **Usage**: Save or download content
- **Variants**: Cloud download, disk save

### Upload
**Icon**: Upload arrow
```
 │ │
─┴─┴─
  ↑
```
- **Color**: Primary (#6366F1)
- **Usage**: Upload files
- **States**: Default, uploading (progress), complete

### Share / Send
**Icon**: Arrow pointing out of box
```
┌───┐
│  ↗│
└───┘
```
- **Color**: Primary (#6366F1)
- **Usage**: Share content
- **Variants**: Share network, send arrow

### Copy / Duplicate
**Icon**: Two overlapping squares
```
┌──┐
│┌─┼┐
└┤ ││
 └─┘│
```
- **Color**: Secondary (#6B7280)
- **Usage**: Copy content
- **Feedback**: Brief pulse animation

### Search / Find
**Icon**: Magnifying glass
```
 ┌──┐
┌┤  │
│└──┘
╲
```
- **Color**: Secondary (#6B7280)
- **Usage**: Search functionality
- **States**: Default, active (with pulse)

### Filter
**Icon**: Funnel
```
╲───╱
 ╲─╱
  ╲
  │
```
- **Color**: Secondary (#6B7280)
- **Usage**: Filter results
- **States**: Default, active (filled)

### Sort
**Icon**: Up/down arrows
```
  ↑
  │
  ↓
```
- **Color**: Secondary (#6B7280)
- **Usage**: Sort lists
- **Variants**: A-Z, Z-A, ascending, descending

### Refresh / Reload
**Icon**: Circular arrow
```
   ↻
 ╱  ╲
│    │
 ╲  ╱
```
- **Color**: Secondary (#6B7280)
- **Usage**: Refresh data
- **Animation**: Rotate on action

### Expand / Collapse
**Icon**: Chevron down/up
```
  ╲ ╱
   V
```
- **Color**: Secondary (#6B7280)
- **Usage**: Expandable sections
- **Animation**: Rotate 180° on toggle

### More / Menu
**Icon**: Three dots (horizontal or vertical)
```
● ● ●
```
- **Color**: Secondary (#6B7280)
- **Usage**: Overflow menus
- **Variants**: Horizontal, vertical

### Close / Dismiss
**Icon**: X
```
╲  ╱
 ╳
╱  ╲
```
- **Color**: Secondary (#6B7280)
- **Usage**: Close modals, dismiss notifications
- **Size**: 16-24px

---

## 5. Social Icons

Brand icons for social media platforms.

### LinkedIn
- **Style**: Official LinkedIn blue (#0A66C2)
- **Usage**: Profile links, sharing
- **Variants**: Logo, "in" icon

### GitHub
- **Style**: Official GitHub colors
- **Usage**: Code repository links
- **Variants**: Octocat, mark

### Twitter / X
- **Style**: Official brand colors
- **Usage**: Social sharing
- **Variants**: Bird (legacy), X (current)

### Facebook
- **Style**: Official Facebook blue (#1877F2)
- **Usage**: Social sharing
- **Variants**: f icon, full logo

### Instagram
- **Style**: Gradient or monochrome
- **Usage**: Social links
- **Variants**: Camera icon, full logo

### YouTube
- **Style**: Official YouTube red (#FF0000)
- **Usage**: Video links
- **Variants**: Play button, full logo

### Email
- **Style**: Brand primary color
- **Usage**: Email sharing, contact
- **Icon**: Envelope

### Link / URL
- **Style**: Brand primary color
- **Usage**: Copy link, external links
- **Icon**: Chain link or arrow-box

---

## 6. File Type Icons

Icons representing different file types.

### PDF
- **Color**: #EF4444 (Red)
- **Icon**: Document with "PDF" text
- **Usage**: PDF downloads/uploads

### Word Document
- **Color**: #2B579A (Word blue)
- **Icon**: Document with "W"
- **Usage**: .doc, .docx files

### Excel Spreadsheet
- **Color**: #217346 (Excel green)
- **Icon**: Spreadsheet with "X"
- **Usage**: .xls, .xlsx files

### Image
- **Color**: #8B5CF6 (Violet)
- **Icon**: Picture frame with mountain/sun
- **Usage**: .jpg, .png, .gif files

### Video
- **Color**: #EF4444 (Red)
- **Icon**: Play button in rectangle
- **Usage**: .mp4, .mov files

### Zip Archive
- **Color**: #F59E0B (Amber)
- **Icon**: Folder with zipper
- **Usage**: .zip files

### Generic File
- **Color**: #6B7280 (Gray)
- **Icon**: Simple document
- **Usage**: Unknown file types

---

## 7. Directional Icons

Navigation and directional indicators.

### Arrows
- **Up**: ↑ Navigation, scroll to top
- **Down**: ↓ Navigation, scroll down, dropdown
- **Left**: ← Back, previous
- **Right**: → Forward, next
- **Diagonal**: ↗ External link, expand

### Chevrons
- **Style**: Thinner than arrows, 2px stroke
- **Usage**: Navigation, menus, dropdowns
- **Variants**: Single, double (fast forward/rewind)

### Carets
- **Style**: Small triangles
- **Usage**: Dropdown indicators, sorting
- **Size**: 12px typical

---

## Icon States

### Default
- **Color**: Secondary (#6B7280)
- **Opacity**: 100%
- **Stroke**: 2px

### Hover
- **Color**: Primary (#6366F1)
- **Opacity**: 100%
- **Transition**: 150ms ease
- **Effect**: Optional slight scale (1.05)

### Active / Selected
- **Color**: Primary (#6366F1)
- **Opacity**: 100%
- **Style**: Filled or bold stroke (2.5px)

### Disabled
- **Color**: #D1D5DB (Gray-300)
- **Opacity**: 50%
- **Cursor**: not-allowed

### Focus
- **Outline**: 2px solid #6366F1
- **Outline offset**: 2px
- **Border radius**: 4px

---

## Accessibility Guidelines

### Color Contrast
- Ensure 3:1 minimum contrast ratio for icons
- Provide text labels for icon-only buttons
- Use ARIA labels for screen readers

### Size Requirements
- **Minimum touch target**: 44×44px (mobile)
- **Minimum click target**: 24×24px (desktop)
- **Icon can be smaller if padding increases target size**

### Text Alternatives
```html
<!-- Good -->
<button aria-label="Delete item">
  <icon-trash />
</button>

<!-- Better -->
<button>
  <icon-trash />
  <span>Delete</span>
</button>
```

### Focus Indicators
- Always visible on keyboard focus
- 2px outline minimum
- Contrasting color (#6366F1)

---

## Implementation Guidelines

### SVG Structure
```xml
<svg xmlns="http://www.w3.org/2000/svg"
     width="24"
     height="24"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     stroke-width="2"
     stroke-linecap="round"
     stroke-linejoin="round">
  <!-- Icon paths here -->
</svg>
```

### CSS Implementation
```css
.icon {
  width: 24px;
  height: 24px;
  color: #6B7280; /* Default */
  transition: color 150ms ease;
}

.icon:hover {
  color: #6366F1; /* Primary */
}

.icon--small {
  width: 16px;
  height: 16px;
}

.icon--large {
  width: 32px;
  height: 32px;
}
```

### React Component Example
```jsx
interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

export const IconDashboard: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className = ''
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);
```

---

## Animation Guidelines

### Micro-interactions
- **Duration**: 150-300ms
- **Easing**: ease-in-out
- **Properties**: color, transform, opacity

### Loading States
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon--loading {
  animation: spin 1s linear infinite;
}
```

### Hover Effects
```css
.icon--interactive:hover {
  transform: scale(1.05);
  color: var(--primary);
}
```

### Click Feedback
```css
.icon--interactive:active {
  transform: scale(0.95);
}
```

---

## Icon Library Tools

### Recommended Libraries
1. **Heroicons** - Base foundation (similar style)
2. **Lucide Icons** - Clean, consistent alternatives
3. **Custom Icons** - Brand-specific designs

### Design Tools
- **Figma**: Primary design tool
- **Illustrator**: Vector refinement
- **SVGO**: Optimization
- **SVGOMG**: Visual optimization tool

### Export Settings
- **SVG Optimization**: Remove unnecessary attributes
- **Decimal precision**: 2 places
- **Remove viewBox**: No (keep for scaling)
- **Remove XML declaration**: Yes
- **Remove comments**: Yes

---

## Icon Naming Convention

### Format
```
icon-[category]-[name]-[variant]-[size].svg
```

### Examples
- `icon-nav-dashboard-outline-24.svg`
- `icon-action-add-filled-20.svg`
- `icon-status-success-circle-16.svg`
- `icon-social-linkedin-color-32.svg`

### Category Codes
- `nav` - Navigation
- `feature` - Features
- `status` - Status indicators
- `action` - User actions
- `social` - Social media
- `file` - File types
- `dir` - Directional

---

## Resources & Assets

### Download Icon Pack
- Vector source files: `/assets/brand/icons/source/`
- Exported SVGs: `/assets/brand/icons/svg/`
- React components: `/assets/brand/icons/react/`

### Design File
- Figma: [Icon System Master File]
- Includes all icons on 24×24px grid
- Variants and states organized

### Implementation Checklist
- ✓ Icons designed on 24×24px grid
- ✓ 2px stroke weight
- ✓ Round caps and joins
- ✓ 2px corner radius
- ✓ Optimized SVG output
- ✓ Accessible implementation
- ✓ Dark mode variants
- ✓ Documentation complete

---

## Questions & Support

For icon design questions:
- Email: design@applyfor.us
- Slack: #design-system
- File requests: Open issue in design repo

Remember: Consistency is key. When in doubt, refer to existing icons or ask the design team!
