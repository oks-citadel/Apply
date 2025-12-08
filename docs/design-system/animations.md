# Animation & Motion Design

## Overview

Animation in ApplyforUs serves a functional purpose: to guide attention, provide feedback, and create smooth transitions. Our motion design is subtle, purposeful, and respects user preferences for reduced motion.

## Animation Principles

### 1. Purposeful
Every animation has a clear purpose - to guide, inform, or delight the user.

### 2. Subtle
Animations should enhance, not distract. Keep them understated and professional.

### 3. Fast
Quick animations feel responsive. Most animations should complete in 150-300ms.

### 4. Respectful
Honor `prefers-reduced-motion` for users with motion sensitivity.

### 5. Consistent
Use the same animation patterns for similar interactions across the app.

## Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| duration-75 | 75ms | Instant feedback (hover states) |
| duration-100 | 100ms | Very fast transitions |
| duration-150 | 150ms | Fast transitions (default hover/focus) |
| duration-200 | 200ms | Standard transitions (most UI) |
| duration-300 | 300ms | Moderate transitions (modals, dropdowns) |
| duration-500 | 500ms | Slow transitions (page transitions) |
| duration-700 | 700ms | Very slow (complex animations) |
| duration-1000 | 1000ms | Maximum duration (loading states) |

**Recommended defaults:**
- **Hover/Focus**: 150ms
- **Dropdowns/Tooltips**: 200ms
- **Modals/Dialogs**: 300ms
- **Page transitions**: 500ms

## Easing Functions

Easing functions control the acceleration curve of animations.

### Standard Easing

```css
/* Linear - Constant speed */
transition-timing-function: linear;

/* Ease - Slow start and end, fast middle (default) */
transition-timing-function: ease;

/* Ease In - Slow start */
transition-timing-function: ease-in;

/* Ease Out - Slow end (best for UI) */
transition-timing-function: ease-out;

/* Ease In Out - Slow start and end */
transition-timing-function: ease-in-out;
```

### Custom Cubic Bezier

```css
/* Smooth ease out */
transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);

/* Snappy */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* Bouncy */
transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Tailwind Utilities

```tsx
<div className="transition ease-out duration-200">
  Default ease-out
</div>

<div className="transition ease-in-out duration-300">
  Ease in and out
</div>
```

**Recommendations:**
- **UI elements**: `ease-out` (feels more responsive)
- **Enter animations**: `ease-out`
- **Exit animations**: `ease-in`
- **Both enter/exit**: `ease-in-out`

## Common Animations

### Fade In/Out

```tsx
/* Fade In */
<div className="animate-fade-in">
  Content
</div>

/* Custom fade */
<div className="transition-opacity duration-200 opacity-0 hover:opacity-100">
  Hover to reveal
</div>
```

**Tailwind Config:**
```typescript
keyframes: {
  'fade-in': {
    from: { opacity: '0' },
    to: { opacity: '1' },
  },
  'fade-out': {
    from: { opacity: '1' },
    to: { opacity: '0' },
  },
}
animation: {
  'fade-in': 'fade-in 0.2s ease-out',
  'fade-out': 'fade-out 0.2s ease-in',
}
```

### Slide In/Out

```tsx
/* Slide from top */
<div className="animate-slide-in-from-top">
  Notification
</div>

/* Slide from bottom */
<div className="animate-slide-in-from-bottom">
  Modal
</div>

/* Slide from right */
<div className="animate-slide-in-from-right">
  Sidebar
</div>
```

**Tailwind Config:**
```typescript
keyframes: {
  'slide-in-from-top': {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
  },
  'slide-in-from-bottom': {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
  'slide-in-from-right': {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },
  'slide-in-from-left': {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
}
animation: {
  'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
  'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
  'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
  'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
}
```

### Scale

```tsx
/* Scale on hover */
<button className="transition-transform duration-150 hover:scale-105 active:scale-95">
  Click me
</button>

/* Scale in animation */
<div className="animate-scale-in">
  Modal content
</div>
```

**Tailwind Config:**
```typescript
keyframes: {
  'scale-in': {
    from: { transform: 'scale(0.95)', opacity: '0' },
    to: { transform: 'scale(1)', opacity: '1' },
  },
}
animation: {
  'scale-in': 'scale-in 0.2s ease-out',
}
```

### Spin

```tsx
/* Loading spinner */
<Loader2 className="h-5 w-5 animate-spin" />

/* Custom spin */
<div className="animate-spin">
  <svg className="h-8 w-8">...</svg>
</div>
```

**Tailwind Config:**
```typescript
keyframes: {
  spin: {
    to: { transform: 'rotate(360deg)' },
  },
}
animation: {
  spin: 'spin 1s linear infinite',
}
```

### Pulse

```tsx
/* Pulsing dot */
<span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
</span>

/* Pulse background */
<div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
```

### Bounce

```tsx
/* Bounce arrow */
<ChevronDown className="animate-bounce" />
```

**Tailwind Config:**
```typescript
keyframes: {
  bounce: {
    '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
    '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
  },
}
animation: {
  bounce: 'bounce 1s infinite',
}
```

## Interaction Animations

### Button Hover

```tsx
<button className="bg-primary-500 text-white px-6 py-3 rounded-lg transition-all duration-150 hover:bg-primary-600 hover:shadow-lg active:scale-95">
  Hover me
</button>
```

**Pattern:**
- Duration: 150ms
- Easing: ease-out
- Properties: background-color, box-shadow, transform

### Card Hover

```tsx
<div className="bg-white rounded-lg border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg hover:border-primary-500 cursor-pointer">
  Hover to elevate
</div>
```

**Pattern:**
- Duration: 200ms
- Easing: ease-out
- Properties: box-shadow, border-color

### Input Focus

```tsx
<input className="border border-gray-300 px-4 py-2 rounded-lg transition-all duration-150 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20" />
```

**Pattern:**
- Duration: 150ms
- Easing: ease-out
- Properties: border-color, box-shadow

### Link Hover

```tsx
<a className="text-primary-500 underline underline-offset-2 transition-colors duration-150 hover:text-primary-700">
  Hover link
</a>
```

**Pattern:**
- Duration: 150ms
- Easing: ease-out
- Properties: color

## Component Animations

### Modal Enter/Exit

```tsx
/* Backdrop */
<div className="fixed inset-0 bg-black transition-opacity duration-300 ease-out opacity-0 data-[state=open]:opacity-50">
</div>

/* Modal */
<div className="fixed inset-0 flex items-center justify-center p-4">
  <div className="bg-white rounded-lg p-8 max-w-md w-full transition-all duration-300 ease-out scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100">
    Modal content
  </div>
</div>
```

**Pattern:**
- Enter: 300ms fade + scale from 95% to 100%
- Exit: 200ms fade + scale to 95%
- Backdrop: 300ms fade

### Dropdown Menu

```tsx
<div className="absolute mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-slide-in-from-top origin-top">
  <a href="#" className="block px-4 py-2 hover:bg-gray-100 transition-colors duration-150">
    Menu item
  </a>
</div>
```

**Pattern:**
- Enter: 200ms slide from top + fade
- Item hover: 150ms background color

### Toast Notification

```tsx
<div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm animate-slide-in-from-top">
  Toast notification
</div>
```

**Pattern:**
- Enter: 300ms slide from top
- Exit: 200ms fade out
- Auto-dismiss: 3-5 seconds

### Accordion

```tsx
<div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ height: isOpen ? 'auto' : '0' }}>
  Accordion content
</div>
```

**Pattern:**
- Duration: 300ms
- Easing: ease-in-out
- Property: height

### Tab Transition

```tsx
<div className="relative">
  {/* Indicator */}
  <div className="absolute bottom-0 h-0.5 bg-primary-500 transition-all duration-200 ease-out" style={{ left: indicatorLeft, width: indicatorWidth }} />

  {/* Tabs */}
  <button className="px-4 py-2 transition-colors duration-150 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-700">
    Tab 1
  </button>
</div>
```

**Pattern:**
- Indicator: 200ms slide
- Text color: 150ms

## Page Transitions

### Fade Transition

```tsx
<div className="animate-fade-in">
  <h1>New Page</h1>
  {/* Page content */}
</div>
```

### Slide Transition

```tsx
<div className="animate-slide-in-from-bottom">
  <h1>New Page</h1>
  {/* Page content */}
</div>
```

## Loading Animations

### Skeleton Loader

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  <div className="h-20 bg-gray-200 rounded"></div>
</div>
```

### Spinner

```tsx
<div className="flex items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
</div>
```

### Progress Bar

```tsx
<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
  <div className="h-full bg-primary-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
</div>
```

### Dots

```tsx
<div className="flex gap-1">
  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
</div>
```

## Micro-interactions

### Like/Favorite

```tsx
<button
  onClick={toggleLike}
  className="transition-all duration-150 active:scale-125"
>
  <Heart
    className={`h-6 w-6 transition-all duration-200 ${
      isLiked
        ? 'fill-error-500 text-error-500 scale-110'
        : 'text-gray-400 scale-100'
    }`}
  />
</button>
```

### Toggle Switch

```tsx
<button
  role="switch"
  aria-checked={isOn}
  onClick={toggle}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
    isOn ? 'bg-primary-500' : 'bg-gray-300'
  }`}
>
  <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
      isOn ? 'translate-x-6' : 'translate-x-1'
    }`}
  />
</button>
```

### Checkbox Check

```tsx
<input
  type="checkbox"
  className="appearance-none h-5 w-5 border-2 border-gray-300 rounded checked:bg-primary-500 checked:border-primary-500 transition-all duration-150 relative checked:after:content-['✓'] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-white checked:after:text-xs"
/>
```

## Reduced Motion

Always respect user preferences for reduced motion:

```css
/* Global reduced motion */
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

**In React:**
```tsx
import { useReducedMotion } from 'framer-motion';

function Component() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={shouldReduceMotion ? '' : 'animate-slide-in'}
    >
      Content
    </div>
  );
}
```

## Framer Motion

For complex animations, use Framer Motion:

```tsx
import { motion } from 'framer-motion';

/* Fade in */
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.2 }}
>
  Content
</motion.div>

/* Slide in */
<motion.div
  initial={{ x: -20, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>

/* Stagger children */
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
    >
      {item.name}
    </motion.div>
  ))}
</motion.div>
```

## Best Practices

### Do's
✓ Keep animations under 300ms for UI interactions
✓ Use `ease-out` for most transitions
✓ Respect `prefers-reduced-motion`
✓ Animate transform and opacity for performance
✓ Use loading states for async operations
✓ Provide visual feedback for all interactions

### Don'ts
✗ Don't animate width, height, or top/left (use transform)
✗ Don't use animations longer than 500ms (except loading)
✗ Don't animate too many elements at once
✗ Don't use animations without purpose
✗ Don't forget mobile performance
✗ Don't rely solely on animation to convey information

## Performance Tips

1. **Use CSS transforms**: Animate `transform` and `opacity` instead of position/size properties
2. **Use `will-change` sparingly**: Only for elements actively animating
3. **Avoid layout thrashing**: Batch DOM reads and writes
4. **Use CSS animations for simple effects**: They run on the compositor thread
5. **Lazy load Framer Motion**: Code-split for better initial load

```tsx
/* Good - Uses transform */
<div className="transition-transform duration-200 hover:translate-y-1">

/* Bad - Animates top */
<div className="transition-all duration-200 hover:top-1">
```

---

**Last Updated**: December 2025
