# ApplyforUs Pattern Library

## Overview
Background patterns add visual interest and brand consistency to the ApplyforUs platform. Our patterns are subtle, scalable, and designed to enhance content without overwhelming it.

---

## Design Principles

### 1. Subtlety First
- Patterns support content, never compete
- Low contrast with background (typically 2-5% opacity)
- Unobtrusive at all screen sizes
- Test visibility: pattern should "disappear" when focused on content

### 2. Scalability
- Vector-based for crisp rendering
- Tile seamlessly (no visible seams)
- Responsive to different screen sizes
- Performance-optimized (small file sizes)

### 3. Brand Consistency
- Use approved brand colors
- Match illustration style
- Complement logo aesthetic
- Reinforce brand personality

### 4. Purpose-Driven
- Different patterns for different contexts
- Enhance hierarchy and wayfinding
- Create visual distinction between sections
- Support emotional tone of content

---

## Pattern Collection

## Pattern 1: Dot Grid

### Description
A regular grid of small dots providing subtle texture and technical sophistication.

### Visual Specifications
```
Dot size: 2px diameter
Spacing: 24px (center to center)
Grid: Square grid (0°, 90° alignment)
Pattern tile: 48px × 48px (repeating)
```

### Color Variations

#### Light Mode
- **Default**: #6366F1 at 4% opacity on white
- **Subtle**: #6366F1 at 2% opacity on white
- **Accent**: #10B981 at 5% opacity on light bg

#### Dark Mode
- **Default**: #818CF8 at 8% opacity on dark bg
- **Subtle**: #818CF8 at 4% opacity on dark bg
- **Accent**: #34D399 at 10% opacity on dark bg

### Use Cases
✓ **Dashboard backgrounds**: Subtle texture
✓ **Empty states**: Gentle fill
✓ **Hero sections**: Professional backdrop
✓ **Modal backgrounds**: Visual separation
✗ **Not for**: Dense text areas, behind forms

### CSS Implementation
```css
.pattern-dot-grid {
  background-image: radial-gradient(
    circle,
    rgba(99, 102, 241, 0.04) 2px,
    transparent 2px
  );
  background-size: 24px 24px;
  background-position: 0 0;
}

/* Dark mode */
.pattern-dot-grid--dark {
  background-image: radial-gradient(
    circle,
    rgba(129, 140, 248, 0.08) 2px,
    transparent 2px
  );
}
```

### SVG Pattern
```svg
<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dot-grid" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
      <circle cx="24" cy="24" r="2" fill="#6366F1" opacity="0.04"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#dot-grid)"/>
</svg>
```

---

## Pattern 2: Geometric Shapes

### Description
Abstract geometric shapes (circles, triangles, squares) creating modern, tech-forward aesthetic.

### Visual Specifications
```
Shapes: Circles (40px), triangles (35px), squares (30px)
Distribution: Random but balanced
Density: 8-12 shapes per 800px viewport
Rotation: 0°, 15°, 30°, 45° variants
Pattern tile: Non-repeating (absolute positioning)
```

### Color Variations

#### Light Mode
- **Primary**: #6366F1 at 3% opacity
- **Secondary**: #8B5CF6 at 3% opacity
- **Tertiary**: #10B981 at 2% opacity
- **Mix**: Combine all three for variety

#### Dark Mode
- **Primary**: #818CF8 at 6% opacity
- **Secondary**: #A78BFA at 6% opacity
- **Tertiary**: #34D399 at 4% opacity

### Use Cases
✓ **Landing pages**: Modern, dynamic feel
✓ **Feature sections**: Visual interest
✓ **Marketing pages**: Brand personality
✓ **Large hero areas**: Fill empty space
✗ **Not for**: Small components, text-heavy areas

### CSS Implementation
```css
.pattern-geometric {
  position: relative;
  overflow: hidden;
}

.pattern-geometric::before,
.pattern-geometric::after {
  content: '';
  position: absolute;
  z-index: 0;
}

.pattern-geometric::before {
  top: 10%;
  right: 15%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.03);
  transform: rotate(15deg);
}

.pattern-geometric::after {
  bottom: 20%;
  left: 10%;
  width: 150px;
  height: 150px;
  background: rgba(139, 92, 246, 0.03);
  transform: rotate(45deg);
}
```

### Figma/Illustrator Setup
1. Create 800×800px artboard
2. Add shapes with specified sizes
3. Apply brand colors at low opacity
4. Randomly position and rotate
5. Export as SVG or PNG @2x

---

## Pattern 3: Gradient Mesh

### Description
Soft, blurred gradient circles creating an ambient, modern backdrop.

### Visual Specifications
```
Circles: 3-5 large blurred circles
Size: 400-800px diameter
Blur: 150-200px Gaussian blur
Opacity: 10-20%
Overlap: Circles can overlap for color mixing
```

### Color Variations

#### Light Mode (Subtle)
- **Circle 1**: #6366F1 at 15% opacity
- **Circle 2**: #8B5CF6 at 12% opacity
- **Circle 3**: #10B981 at 10% opacity
- **Background**: #FFFFFF or #F9FAFB

#### Dark Mode (Vibrant)
- **Circle 1**: #6366F1 at 20% opacity
- **Circle 2**: #8B5CF6 at 18% opacity
- **Circle 3**: #10B981 at 15% opacity
- **Background**: #1F2937 or #111827

### Use Cases
✓ **Hero sections**: Premium, modern feel
✓ **Auth pages**: Login, signup backgrounds
✓ **Marketing headers**: Eye-catching
✓ **Feature callouts**: Emphasis areas
✗ **Not for**: Behind text (reduces readability)

### CSS Implementation
```css
.pattern-gradient-mesh {
  position: relative;
  background: #F9FAFB;
  overflow: hidden;
}

.pattern-gradient-mesh::before,
.pattern-gradient-mesh::after,
.pattern-gradient-mesh .mesh-circle {
  content: '';
  position: absolute;
  border-radius: 50%;
  filter: blur(150px);
  z-index: 0;
}

.pattern-gradient-mesh::before {
  top: -200px;
  right: -200px;
  width: 600px;
  height: 600px;
  background: rgba(99, 102, 241, 0.15);
}

.pattern-gradient-mesh::after {
  bottom: -150px;
  left: -150px;
  width: 500px;
  height: 500px;
  background: rgba(139, 92, 246, 0.12);
}
```

### Performance Considerations
- Use CSS blur for better performance
- Limit to 3-5 circles maximum
- Consider static background image for complex meshes
- Test on lower-end devices

---

## Pattern 4: Topographic Lines

### Description
Contour map-style lines suggesting elevation, journey, progress, and navigation.

### Visual Specifications
```
Line weight: 1px
Spacing: 40-60px between lines (varied for organic feel)
Style: Continuous flowing curves
Pattern tile: 800px × 800px (large for seamless feel)
Endpoints: Fade to transparent at edges
```

### Color Variations

#### Light Mode
- **Default**: #6366F1 at 6% opacity
- **Subtle**: #6366F1 at 3% opacity
- **Multi-color**: Alternate #6366F1 and #10B981 at 4% opacity

#### Dark Mode
- **Default**: #818CF8 at 10% opacity
- **Subtle**: #818CF8 at 5% opacity
- **Multi-color**: Alternate #818CF8 and #34D399 at 7% opacity

### Use Cases
✓ **Career journey pages**: Metaphor for path
✓ **Analytics dashboards**: Data landscape feel
✓ **About/company pages**: Sophisticated backdrop
✓ **Progress tracking**: Visual metaphor
✗ **Not for**: Busy interfaces, small components

### CSS Implementation
```css
.pattern-topographic {
  background-image: url('/assets/patterns/topographic-lines.svg');
  background-size: 800px 800px;
  background-position: center;
  background-repeat: repeat;
}

/* Animated variant (optional) */
@keyframes topo-flow {
  from { background-position: 0 0; }
  to { background-position: 800px 0; }
}

.pattern-topographic--animated {
  animation: topo-flow 60s linear infinite;
}
```

### SVG Pattern (Simplified Example)
```svg
<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="topo-lines" x="0" y="0" width="800" height="800" patternUnits="userSpaceOnUse">
      <!-- Create flowing curved lines -->
      <path d="M0,100 Q200,80 400,100 T800,100"
            stroke="#6366F1"
            stroke-width="1"
            fill="none"
            opacity="0.06"/>
      <path d="M0,160 Q200,140 400,160 T800,160"
            stroke="#6366F1"
            stroke-width="1"
            fill="none"
            opacity="0.06"/>
      <!-- Repeat with varying curves... -->
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#topo-lines)"/>
</svg>
```

---

## Pattern 5: Connection Network

### Description
Nodes connected by lines representing AI, networking, and connections between opportunities.

### Visual Specifications
```
Nodes: 4-6px diameter circles
Lines: 1px connecting lines
Spacing: Random but structured (100-200px apart)
Pattern tile: 600px × 600px
Animation: Optional pulse on nodes
```

### Color Variations

#### Light Mode
- **Nodes**: #6366F1 at 8% opacity
- **Active Nodes**: #10B981 at 12% opacity (occasional)
- **Lines**: #6366F1 at 4% opacity

#### Dark Mode
- **Nodes**: #818CF8 at 12% opacity
- **Active Nodes**: #34D399 at 18% opacity
- **Lines**: #818CF8 at 6% opacity

### Use Cases
✓ **AI feature pages**: Represent intelligence
✓ **Networking sections**: Connection metaphor
✓ **Platform integrations**: Interconnectivity
✓ **Tech/developer pages**: Technical aesthetic
✗ **Not for**: Non-technical audiences, simple content

### CSS Implementation
```css
.pattern-network {
  background-image: url('/assets/patterns/connection-network.svg');
  background-size: 600px 600px;
  background-position: center;
  background-repeat: repeat;
}

/* Animated nodes (via SVG animation or JS) */
@keyframes node-pulse {
  0%, 100% { opacity: 0.08; }
  50% { opacity: 0.12; }
}
```

### SVG Pattern
```svg
<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="network" x="0" y="0" width="600" height="600" patternUnits="userSpaceOnUse">
      <!-- Nodes -->
      <circle cx="100" cy="100" r="4" fill="#6366F1" opacity="0.08"/>
      <circle cx="300" cy="150" r="4" fill="#6366F1" opacity="0.08"/>
      <circle cx="500" cy="120" r="4" fill="#10B981" opacity="0.12">
        <animate attributeName="opacity" values="0.08;0.12;0.08" dur="3s" repeatCount="indefinite"/>
      </circle>

      <!-- Connection lines -->
      <line x1="100" y1="100" x2="300" y2="150" stroke="#6366F1" stroke-width="1" opacity="0.04"/>
      <line x1="300" y1="150" x2="500" y2="120" stroke="#6366F1" stroke-width="1" opacity="0.04"/>

      <!-- Add more nodes and lines... -->
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#network)"/>
</svg>
```

---

## Pattern 6: Subtle Noise Texture

### Description
Fine grain noise adding tactile quality to flat surfaces without visible pattern.

### Visual Specifications
```
Noise size: 1px particles
Density: 5-10% coverage
Type: Random monochromatic noise
Pattern tile: 200px × 200px (small, efficient)
```

### Color Variations

#### Light Mode
- **Default**: Black (#000000) at 2% opacity

#### Dark Mode
- **Default**: White (#FFFFFF) at 3% opacity

### Use Cases
✓ **Card backgrounds**: Tactile quality
✓ **Large flat areas**: Break monotony
✓ **Premium sections**: Elevated feel
✓ **Over gradients**: Add texture
✓ **Almost everywhere**: Very subtle enhancement

### CSS Implementation
```css
.pattern-noise {
  background-image: url('/assets/patterns/noise-texture.png');
  background-size: 200px 200px;
  background-repeat: repeat;
}

/* Can be combined with other backgrounds */
.card {
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
}

.card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/assets/patterns/noise-texture.png');
  background-size: 200px 200px;
  opacity: 0.02;
  pointer-events: none;
}
```

### Generation
Use tools like:
- Photoshop: Filter > Noise > Add Noise (1-2%, Gaussian, Monochromatic)
- Online generators: Noise texture generators
- CSS noise: Can be generated via canvas/data URI

---

## Pattern 7: Directional Lines

### Description
Diagonal parallel lines suggesting motion, progress, and forward momentum.

### Visual Specifications
```
Line weight: 1px
Spacing: 8px apart
Angle: 45° (or -45° for variation)
Pattern tile: 16px × 16px (efficient tiling)
Style: Solid or dashed
```

### Color Variations

#### Light Mode
- **Default**: #6366F1 at 4% opacity
- **Dashed**: #6366F1 at 5% opacity (2px dash, 4px gap)

#### Dark Mode
- **Default**: #818CF8 at 7% opacity
- **Dashed**: #818CF8 at 8% opacity

### Use Cases
✓ **CTA sections**: Sense of urgency/action
✓ **Progress indicators**: Forward motion
✓ **Loading states**: Movement
✓ **Dividers**: Section separation
✗ **Not for**: Accessibility concerns (can cause visual issues)

### CSS Implementation
```css
.pattern-directional-lines {
  background-image: repeating-linear-gradient(
    45deg,
    rgba(99, 102, 241, 0.04) 0px,
    rgba(99, 102, 241, 0.04) 1px,
    transparent 1px,
    transparent 8px
  );
}

/* Animated variant */
@keyframes lines-move {
  from { background-position: 0 0; }
  to { background-position: 16px 16px; }
}

.pattern-directional-lines--animated {
  animation: lines-move 1s linear infinite;
}
```

### Accessibility Note
**Warning**: Striped patterns can cause issues for users with:
- Vestibular disorders
- Photosensitive epilepsy
- Visual processing challenges

**Guidelines**:
- Keep opacity very low (< 5%)
- Avoid animation unless user opts in
- Provide option to disable patterns
- Never use behind critical text

---

## Pattern Combinations

### Layering Patterns
Patterns can be layered for richer effects:

```css
.pattern-layered {
  /* Base: Dot grid */
  background-image: radial-gradient(circle, rgba(99, 102, 241, 0.03) 2px, transparent 2px);
  background-size: 24px 24px;
}

.pattern-layered::before {
  content: '';
  position: absolute;
  inset: 0;
  /* Layer: Gradient mesh */
  background: radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%);
  z-index: -1;
}
```

### Recommended Combinations
1. **Dot Grid + Noise**: Subtle technical feel
2. **Gradient Mesh + Geometric Shapes**: Modern, dynamic
3. **Topographic + Noise**: Sophisticated, tactile
4. **Network + Dot Grid**: Tech-forward, structured

### Don't Combine
- Multiple strong patterns (overwhelming)
- Competing directional patterns (chaotic)
- More than 2-3 patterns total

---

## Implementation Guidelines

### Performance Best Practices

#### 1. File Size
- **SVG patterns**: < 5KB each
- **PNG patterns**: < 10KB each
- **Optimize**: Use SVGO, TinyPNG

#### 2. Rendering
- **Use CSS when possible**: Better performance
- **Cache pattern files**: Long cache headers
- **Lazy load complex patterns**: Below fold

#### 3. Responsive
```css
/* Adjust pattern size on mobile */
@media (max-width: 768px) {
  .pattern-dot-grid {
    background-size: 20px 20px; /* Slightly smaller on mobile */
  }
}
```

### Accessibility

#### Contrast Requirements
- Patterns should not reduce text contrast below WCAG AA
- Test: Text over pattern must still meet 4.5:1 ratio
- Solution: Keep pattern opacity very low (< 10%)

#### User Preferences
```css
/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .pattern-directional-lines--animated {
    animation: none;
  }
}

/* Optional: Disable patterns for reduced data */
@media (prefers-reduced-data: reduce) {
  [class*="pattern-"] {
    background-image: none !important;
  }
}
```

#### User Control
Provide toggle in settings:
```javascript
// Example implementation
const patternsEnabled = localStorage.getItem('patterns') !== 'false';

if (!patternsEnabled) {
  document.body.classList.add('no-patterns');
}
```

```css
.no-patterns [class*="pattern-"] {
  background-image: none !important;
}
```

---

## Dark Mode Considerations

### Increased Opacity
Dark mode patterns typically need:
- 1.5-2× opacity of light mode
- Lighter color variants (e.g., Indigo-400 vs Indigo-500)
- More prominent to show against dark backgrounds

### Color Adjustments
```css
/* Light mode */
.pattern-dot-grid {
  background-image: radial-gradient(circle, rgba(99, 102, 241, 0.04) 2px, transparent 2px);
}

/* Dark mode - increased opacity and lighter color */
.dark .pattern-dot-grid {
  background-image: radial-gradient(circle, rgba(129, 140, 248, 0.08) 2px, transparent 2px);
}
```

### Testing
- View patterns on both lightest and darkest backgrounds
- Ensure visibility without being overpowering
- Check on actual devices (not just browser devtools)

---

## Usage Decision Tree

```
What is the content purpose?

Technical/Data-focused
├─ Use: Dot Grid or Network pattern
└─ Avoid: Organic patterns (topographic, gradient mesh)

Marketing/Landing
├─ Use: Gradient Mesh or Geometric Shapes
└─ Avoid: Technical patterns (network, dot grid)

Professional/Corporate
├─ Use: Topographic or Subtle Noise
└─ Avoid: Bold geometric shapes

Text-Heavy
├─ Use: Noise Texture only (very subtle)
└─ Avoid: All visible patterns

Empty States
├─ Use: Dot Grid or Geometric Shapes
└─ Avoid: Busy patterns (network, topographic)

Hero/Feature Sections
├─ Use: Gradient Mesh or Topographic
└─ Combine with: Noise for texture
```

---

## Pattern Library Files

### File Structure
```
/assets/brand/patterns/
├── svg/
│   ├── dot-grid.svg
│   ├── geometric-shapes.svg
│   ├── gradient-mesh.svg
│   ├── topographic-lines.svg
│   ├── connection-network.svg
│   └── directional-lines.svg
├── png/
│   ├── noise-texture.png
│   ├── noise-texture@2x.png
│   └── [fallback versions of svg patterns]
├── css/
│   └── patterns.css (all pattern implementations)
└── README.md (this file)
```

### CSS Pattern Library
Create single importable file:

```css
/* patterns.css */

/* Dot Grid */
.pattern-dot-grid { /* ... */ }
.pattern-dot-grid--subtle { /* ... */ }
.pattern-dot-grid--dark { /* ... */ }

/* Geometric Shapes */
.pattern-geometric { /* ... */ }
.pattern-geometric--dark { /* ... */ }

/* ... all patterns ... */

/* Utility classes */
.pattern-overlay {
  position: relative;
  z-index: 1;
}

.pattern-overlay > * {
  position: relative;
  z-index: 2;
}
```

---

## Testing Checklist

Before deploying a pattern:

### Visual Testing
- ✓ Visible but not distracting at 100% zoom
- ✓ Tiles seamlessly (no visible seams)
- ✓ Works on both light and dark backgrounds
- ✓ Maintains text contrast (WCAG AA minimum)
- ✓ Looks good at common viewport sizes (320px, 768px, 1440px, 1920px)

### Performance Testing
- ✓ File size < 10KB
- ✓ No jank when scrolling
- ✓ Renders smoothly on mobile devices
- ✓ Doesn't impact Core Web Vitals

### Accessibility Testing
- ✓ Doesn't reduce text contrast below 4.5:1
- ✓ Respects prefers-reduced-motion
- ✓ Pattern can be disabled by user
- ✓ No seizure risk (no flashing, high contrast strobing)

### Browser Testing
- ✓ Chrome/Edge (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Mobile Safari (iOS)
- ✓ Chrome Mobile (Android)

---

## Examples in Context

### Example 1: Dashboard Background
```html
<div class="dashboard pattern-dot-grid pattern-overlay">
  <div class="dashboard-content">
    <!-- Content here has proper contrast -->
  </div>
</div>
```

### Example 2: Hero Section
```html
<section class="hero pattern-gradient-mesh pattern-overlay">
  <div class="hero-content">
    <h1>Find Your Dream Job with AI</h1>
    <p>ApplyforUs helps you apply smarter, not harder.</p>
    <button>Get Started</button>
  </div>
</section>
```

### Example 3: Feature Card
```html
<div class="feature-card pattern-noise">
  <div class="feature-icon">💼</div>
  <h3>Auto-Apply</h3>
  <p>Automatically apply to jobs that match your profile.</p>
</div>
```

---

## Questions & Support

For pattern requests or questions:
- **Email**: design@applyfor.us
- **Slack**: #design-system
- **Assets**: `/assets/brand/patterns/`

**Remember**: Patterns should enhance, never overwhelm. When in doubt, go more subtle. Less is more.
