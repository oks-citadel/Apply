# Motion Graphics Specifications
## ApplyforUs Platform

---

## Overview

Motion graphics bring static designs to life, enhance user experience, and communicate brand personality. This guide establishes standards for all animated elements across the ApplyforUs platform.

---

## Technical Specifications

### File Formats

#### Web Implementation
- **Lottie (JSON)**: Lightweight, scalable vector animations
  - Format: `.json`
  - Tools: After Effects + Bodymovin plugin
  - Size: 5-50KB typical
  - Best for: UI animations, icons, loaders

- **Animated SVG**: CSS/SMIL animations
  - Format: `.svg`
  - Tools: Hand-coded or Adobe Animate
  - Size: 2-20KB typical
  - Best for: Simple icons, logos, shapes

- **Animated WebP**: Raster animation alternative to GIF
  - Format: `.webp`
  - Tools: Photoshop, online converters
  - Size: 30-80% smaller than GIF
  - Best for: Simple looping animations

- **Video (MP4)**: For complex animations
  - Format: `.mp4` (H.264 codec)
  - Tools: After Effects, Premiere
  - Size: Optimized < 500KB for web
  - Best for: Hero animations, backgrounds

#### Source Files
- **After Effects**: `.aep` (primary animation tool)
- **Adobe Animate**: `.fla` (vector animations)
- **Blender**: `.blend` (3D animations)
- **Figma/Framer**: Native prototypes

---

### Performance Standards

**Load Time Targets**
- First Contentful Paint: < 1.5s
- Animation file loads: < 500ms
- Total animation assets: < 2MB per page

**Frame Rate**
- **Standard UI**: 30 fps
- **Smooth Motion**: 60 fps
- **Cinematic**: 24 fps
- **Power Saving**: 15 fps (if user preference)

**Optimization**
- Lazy load non-critical animations
- Pause animations when off-screen
- Respect `prefers-reduced-motion` setting
- Use CSS animations when possible (GPU accelerated)

---

## Brand Animation Principles

### Motion Language

**Speed & Timing**
- **Fast**: 0.1-0.2s (micro-interactions)
- **Standard**: 0.3-0.4s (UI transitions)
- **Moderate**: 0.5-0.8s (page transitions)
- **Slow**: 1.0-1.5s (hero animations)
- **Very Slow**: 2.0-3.0s (ambient motion)

**Easing Functions**
```css
/* ApplyforUs Standard Easing */
--ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1);
--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0.0, 1, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
```

**Movement Style**
- Smooth and fluid
- Natural, physics-based
- Purposeful, not decorative
- Enhances understanding
- Delightful but not distracting

---

## 1. Logo Animation

### Primary Logo Animation (Full Intro)

**Duration**: 3 seconds
**Use Case**: Video intros, splash screens, brand moments

#### Animation Sequence

**Phase 1: Build (0.0-1.5s)**
```
0.0s - 0.3s: Individual elements fade in from opacity 0 to 100%
            Elements: Icon pieces, wordmark letters
            Position: Slide in from various directions
            Effect: Slight blur to sharp

0.3s - 1.0s: Icon assembles
            - Geometric pieces connect
            - Subtle glow effect on connections
            - Scale from 80% to 105% to 100% (bounce)

1.0s - 1.5s: Wordmark assembles
            - Letters slide into position left to right
            - Slight rotation correction (5° to 0°)
            - Opacity 0% to 100%
```

**Phase 2: Settle (1.5-2.5s)**
```
1.5s - 2.0s: Combined logo settles
            - Subtle pulsing glow (100% to 120% to 100%)
            - Color gradient sweep across logo
            - Brand purple to indigo

2.0s - 2.5s: Finalize
            - Remove glow
            - Lock into position
            - Hold on final frame
```

**Phase 3: Optional Tagline (2.5-3.0s)**
```
2.5s - 3.0s: Tagline appears below
            "AI-Powered Job Search"
            - Fade in with slight upward movement
            - Color: Soft gray to full color
```

---

### Logo Animation (Quick Loop)

**Duration**: 1.5 seconds (seamless loop)
**Use Case**: Loading states, background elements

#### Animation Sequence
```
0.0s - 0.75s: Subtle pulse
             - Scale 100% to 103% to 100%
             - Glow intensity 0% to 30% to 0%
             - Rotation: -2° to 0° to 2° to 0°

0.75s - 1.5s: Return to start
             - Seamless loop back to beginning
             - Hold static for 0.5s between loops
```

---

### Logo Animation (Micro)

**Duration**: 0.5 seconds
**Use Case**: Button clicks, navigation, quick transitions

#### Animation Sequence
```
0.0s - 0.25s: Compress
             - Scale 100% to 95%
             - Slight rotation clockwise 2°

0.25s - 0.5s: Release
             - Scale 95% to 105% to 100%
             - Rotation counter-clockwise back to 0°
             - Subtle bounce
```

---

### After Effects Implementation Notes

**Layer Structure**
```
Logo_Composition
├── BG_Glow (adjustment layer)
├── Tagline
│   └── Text_Tagline (fade in)
├── Wordmark
│   ├── Letter_A (slide + fade)
│   ├── Letter_p
│   ├── Letter_p
│   ├── ... (remaining letters)
├── Icon
│   ├── Icon_Piece_1 (position + rotate)
│   ├── Icon_Piece_2
│   ├── Icon_Piece_3
│   ├── Connection_Lines (draw on)
│   └── Glow (opacity + scale)
└── BG_Gradient (optional)
```

**Sound Design**
- 0.0s: Soft whoosh (element entrance)
- 1.0s: Gentle click/snap (icon assembly complete)
- 2.0s: Subtle chime (final confirmation)
- Total: ~1.5s audio duration, fade out

---

## 2. UI Animations

### Button Hover States

**Primary Button Hover**
```css
.btn-primary {
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
  background: linear-gradient(135deg, #9F7AEA 0%, #8B5CF6 100%);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.2);
}
```

**Animation States**
1. **Default**: Resting state
2. **Hover**: Lift 2px, increase shadow, brighten gradient
3. **Active/Click**: Return to 0, compress shadow slightly
4. **Focus**: Pulsing outline (accessibility)

---

### Toggle Switch Animation

**Animation Specs**
- **Duration**: 0.3s
- **Easing**: Ease-in-out

```css
.toggle-switch {
  position: relative;
  width: 48px;
  height: 24px;
  border-radius: 12px;
  transition: background-color 0.3s ease;
}

.toggle-switch.on {
  background: linear-gradient(135deg, #8B5CF6, #6366F1);
}

.toggle-switch.off {
  background: #E5E7EB;
}

.toggle-knob {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  background: white;
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch.on .toggle-knob {
  transform: translateX(24px);
}
```

**Lottie Alternative**: Create smooth organic motion with bounce

---

### Loading Animations

#### Spinner (Primary Loader)

**Visual Description**
```
Circular spinner with gradient stroke (purple to indigo) rotating clockwise.
Smooth rotation with slight elasticity. Transparent center.

Size: 40x40px (standard), 24x24px (small), 64x64px (large)
Stroke: 3px
Color: Brand gradient
Rotation: 360° in 1 second
```

**CSS Implementation**
```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  border: 3px solid transparent;
  border-top-color: #8B5CF6;
  border-right-color: #6366F1;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}
```

---

#### Skeleton Loader

**Animation Pattern**
```
Shimmer effect moving left to right across placeholder content.
Gradient: transparent → white (20% opacity) → transparent
Duration: 1.5s loop
```

**CSS Implementation**
```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #F3F4F6 0%,
    #E5E7EB 50%,
    #F3F4F6 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}
```

---

#### Dots Loader (Alternative)

**Visual Description**
```
Three dots bouncing vertically in sequence. Playful and friendly.
Colors: Brand purple gradient
Timing: Staggered bounce (0s, 0.1s, 0.2s delay)
```

**Lottie JSON Structure**
- 3 circle shapes
- Y-position animation (bounce)
- Staggered start times
- Loop infinitely

---

### Page Transitions

#### Fade & Scale
```css
/* Entering page */
.page-enter {
  opacity: 0;
  transform: scale(0.95);
}

.page-enter-active {
  opacity: 1;
  transform: scale(1);
  transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* Exiting page */
.page-exit {
  opacity: 1;
  transform: scale(1);
}

.page-exit-active {
  opacity: 0;
  transform: scale(1.05);
  transition: all 0.3s cubic-bezier(0.4, 0.0, 1, 1);
}
```

---

#### Slide Transitions

**Forward Navigation** (Left to Right)
```css
.slide-enter {
  transform: translateX(100%);
}

.slide-enter-active {
  transform: translateX(0);
  transition: transform 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.slide-exit-active {
  transform: translateX(-30%);
  opacity: 0.5;
  transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

**Back Navigation** (Right to Left)
- Reverse the transformations

---

### Success Celebrations

#### Checkmark Animation

**Visual Description**
```
Circular background expands from center with color fill (green).
Checkmark draws in from 0% to 100% with slight bounce at end.
Optional: Subtle confetti particles

Duration: 0.8s total
```

**Animation Sequence**
```
0.0s - 0.3s: Circle expands
            - Scale from 0% to 110% to 100%
            - Background color: transparent to green
            - Ease: Bounce

0.2s - 0.6s: Checkmark draws in
            - SVG stroke-dashoffset animation
            - Timing: Ease-out
            - Overlap with circle for smoothness

0.6s - 0.8s: Final bounce
            - Entire icon scales 100% to 105% to 100%
            - Subtle rotation wobble ±3°
```

**Lottie Implementation**: Path trim animation with shape layer bounce

---

#### Confetti Burst

**Visual Description**
```
Colorful confetti particles burst from center point in all directions.
Physics-based motion with gravity. Fade out as they fall.

Colors: Brand purple, pink, blue, green
Particle count: 20-30
Duration: 2.5s
```

**Animation Parameters**
- Initial velocity: Random 200-400px/s
- Angle: Random 0-360°
- Gravity: 500px/s²
- Rotation: Random spin
- Fade out: Last 0.5s

**Implementation**: Canvas/WebGL for performance, or Lottie for simplicity

---

### Notification Entrances

#### Slide from Top
```css
@keyframes slideDown {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.notification-enter {
  animation: slideDown 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

#### Toast from Bottom Right
```css
@keyframes toastIn {
  0% {
    transform: translate(400px, 100px) scale(0.8);
    opacity: 0;
  }
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
}

.toast-enter {
  animation: toastIn 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

---

## 3. Feature-Specific Animations

### Auto-Apply Visualization

**Concept**: Applications flying from user profile to job listings

**Visual Description**
```
Animated sequence showing:
1. User profile card (left)
2. Job listing cards (right, multiple)
3. Small document/application icons traveling from left to right
4. Green checkmarks appearing on job cards as applications land
5. Counter incrementing (1, 5, 15, 47...)

Style: Clean, vector-based, smooth motion
Duration: 3-5s looping
```

**Lottie Animation Layers**
- Background gradient
- Profile card (static)
- Job cards (slight floating motion)
- Application documents (path animation left to right)
- Checkmarks (appear with scale bounce)
- Counter (number increment with scale)

---

### AI Matching Visualization

**Concept**: Neural network connecting profile to job matches

**Visual Description**
```
Animated network visualization:
1. Central node (user profile) glowing
2. Lines/connections extending outward
3. Job nodes lighting up at connection endpoints
4. Pulsing energy traveling along connections
5. Match percentages appearing above job nodes
6. Best matches glow brightest

Style: Tech/data visualization aesthetic
Colors: Purple gradient lines, glowing nodes
Duration: 4-6s looping
```

**Implementation**: Canvas animation or Lottie with blend modes

---

### Resume Transformation

**Concept**: Resume improving in real-time

**Visual Description**
```
Split screen or before/after:
1. Plain resume on left (or top)
2. Sparkle/magic effect in center
3. Enhanced resume on right (or bottom)
4. Callouts appear: "Keywords Added", "Format Improved", "ATS Score: 92%"

Style: Document-focused with magical enhancement
Duration: 2-3s
```

**Animation Sequence**
1. Plain resume slides in (0.3s)
2. Sparkle effect (0.5s)
3. Transformation transition (0.8s)
4. Enhanced resume settles (0.3s)
5. Callouts pop in sequentially (0.9s, 0.3s each)

---

## 4. Micro-Interactions

### Form Input Focus

**Animation**
```css
.input-field {
  border: 2px solid #E5E7EB;
  transition: all 0.3s ease;
}

.input-field:focus {
  border-color: #8B5CF6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  transform: translateY(-2px);
}

.input-label {
  transition: all 0.2s ease;
  transform-origin: left center;
}

.input-field:focus + .input-label {
  transform: translateY(-24px) scale(0.85);
  color: #8B5CF6;
}
```

---

### Checkbox Selection

**Animation Sequence**
1. Checkbox border pulses on click (0.1s)
2. Background color fills (0.2s)
3. Checkmark draws in (0.3s)
4. Slight bounce settle (0.2s)

**Total**: 0.6s

---

### Card Hover Effects

```css
.card {
  transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card:hover::before {
  opacity: 1;
}
```

---

## 5. Background Animations

### Gradient Animation

**Subtle Background Motion**
```css
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animated-gradient {
  background: linear-gradient(270deg, #8B5CF6, #6366F1, #3B82F6);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
}
```

---

### Floating Particles

**Concept**: Subtle particles floating upward in background

**Implementation**
- Canvas-based for performance
- 20-30 particles
- Slow upward drift with random horizontal sway
- Fade in at bottom, fade out at top
- Loop infinitely
- Very subtle, don't distract from content

---

### Parallax Scrolling

**Multiple Layers Moving at Different Speeds**
```javascript
// Pseudo-code
layers = [
  { element: '.bg-layer-1', speed: 0.5 },
  { element: '.bg-layer-2', speed: 0.3 },
  { element: '.bg-layer-3', speed: 0.1 }
];

onScroll(() => {
  scrollY = window.scrollY;
  layers.forEach(layer => {
    layer.element.transform = `translateY(${scrollY * layer.speed}px)`;
  });
});
```

---

## 6. Mobile-Specific Animations

### Considerations
- Simpler animations (performance)
- Shorter durations (faster perceived)
- Reduce particle counts
- Pause when app backgrounded
- Battery-conscious

### Pull-to-Refresh

**Animation Sequence**
```
Pull Distance: 0-80px

0-40px: Spinner scales from 0 to 50%, rotates
40-80px: Spinner scales from 50% to 100%
Release: Trigger refresh, spinner continues rotating
Complete: Spinner scales down, fade out
```

---

### Swipe Gestures

**Swipe to Delete/Archive**
```
Swipe right: Red background reveals, trash icon appears
Swipe left: Green background reveals, archive icon appears

Haptic feedback at:
- Swipe start
- Threshold reached (50% width)
- Action confirmed
```

---

## 7. Accessibility Considerations

### Reduced Motion

**Respect User Preferences**
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Alternative**: Provide static or crossfade-only animations

---

### Focus Indicators

**Keyboard Navigation**
```css
*:focus-visible {
  outline: 3px solid #8B5CF6;
  outline-offset: 2px;
  animation: focusPulse 2s ease infinite;
}

@keyframes focusPulse {
  0%, 100% { outline-color: #8B5CF6; }
  50% { outline-color: #A78BFA; }
}
```

---

### Screen Reader Announcements

**ARIA Live Regions for Animated State Changes**
```html
<div role="status" aria-live="polite" aria-atomic="true">
  Application submitted successfully
</div>
```

---

## Animation Production Workflow

### 1. Concept & Storyboard
- Sketch animation concept
- Define duration and key moments
- Identify technical approach (Lottie, CSS, Canvas)

### 2. Asset Creation
- Design static assets in Figma/Illustrator
- Export as vectors for After Effects
- Organize layers and naming

### 3. Animation
- Animate in After Effects
- Follow brand timing/easing guidelines
- Test at various speeds

### 4. Export
- **Lottie**: Use Bodymovin plugin
- **Video**: Export as MP4 (H.264)
- **GIF Alternative**: Export as WebP

### 5. Optimization
- Compress file size
- Remove unnecessary keyframes
- Simplify paths where possible
- Test performance on target devices

### 6. Implementation
- Integrate into codebase
- Add controls (play, pause, loop)
- Test across browsers/devices
- Verify accessibility

### 7. QA & Refinement
- Performance testing
- Visual bug checking
- Accessibility audit
- User testing feedback

---

## Tools & Resources

### Animation Software
- **After Effects**: Industry standard, Lottie export
- **Adobe Animate**: Web-focused vector animation
- **Figma/Framer**: Prototyping and simple animations
- **Blender**: 3D animations
- **Principle**: Mac UI animation prototyping

### Lottie Resources
- **LottieFiles**: Animation marketplace and player
- **Bodymovin**: After Effects export plugin
- **lottie-web**: JavaScript player library

### CSS Animation Libraries
- **Animate.css**: Pre-built CSS animations
- **AOS**: Animate on scroll library
- **GSAP**: Professional JavaScript animation

### Code Editors & Previews
- **CodePen**: Quick animation prototyping
- **Framer Motion**: React animation library
- **Theatre.js**: Animation editor for web

---

## Performance Budgets

**Per Page Animation Load**
- Lottie files: < 500KB total
- CSS animations: Unlimited (negligible)
- Video animations: < 2MB total
- Canvas animations: Monitor FPS (maintain 60fps)

**Monitoring**
- Use Chrome DevTools Performance tab
- Profile animation frame rates
- Check memory usage
- Test on low-end devices

---

## File Naming Convention

```
motion_[type]_[name]_[version]_[date].[ext]

Examples:
motion_logo_fullintro_v2_20251208.aep
motion_logo_fullintro_v2_20251208.json
motion_ui_button_hover_v1_20251208.css
motion_loader_spinner_v1_20251208.json
motion_feature_autoapply_v3_20251208.mp4
```

---

## Quality Checklist

### Design Quality
- [ ] Follows brand animation principles
- [ ] Consistent timing/easing across similar elements
- [ ] Smooth, no janky motion
- [ ] Appropriate duration (not too fast/slow)
- [ ] Purposeful, enhances UX

### Technical Quality
- [ ] Optimized file size
- [ ] Works across target browsers
- [ ] Performs well on mobile
- [ ] Respects reduced motion preferences
- [ ] Accessible focus states
- [ ] No memory leaks
- [ ] Pauses when off-screen

### Implementation Quality
- [ ] Clean, maintainable code
- [ ] Proper documentation
- [ ] Fallbacks for unsupported browsers
- [ ] Error handling
- [ ] Loading states
- [ ] Source files archived

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-08 | 1.0 | Initial motion graphics specifications |

---

**Next Steps**: Create animation library in After Effects, export Lottie files, implement CSS animations, establish performance monitoring, conduct user testing.
