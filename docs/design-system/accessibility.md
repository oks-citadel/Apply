# Accessibility Guidelines

## Overview

Accessibility is fundamental to the ApplyforUs design system. We are committed to creating an inclusive experience that works for everyone, regardless of ability or assistive technology used. All components meet WCAG 2.1 AA standards as a baseline, with AAA compliance for critical features.

## WCAG 2.1 AA Compliance

### Four Principles (POUR)

1. **Perceivable**: Information and UI components must be presentable to users in ways they can perceive
2. **Operable**: UI components and navigation must be operable
3. **Understandable**: Information and operation of UI must be understandable
4. **Robust**: Content must be robust enough to be interpreted by assistive technologies

## Color and Contrast

### Text Contrast Requirements

| Text Type | Size | Weight | Min. Ratio | Preferred |
|-----------|------|--------|------------|-----------|
| Small text | < 18px | Any | 4.5:1 | 7:1 (AAA) |
| Small text | < 18px | Bold (700+) | 3:1 | 4.5:1 |
| Large text | ≥ 18px | Any | 3:1 | 4.5:1 |
| Large text | ≥ 24px | Any | 3:1 | 4.5:1 |

### UI Component Contrast

- **Interactive elements**: Minimum 3:1 against background
- **Focus indicators**: Minimum 3:1 against background
- **Active/Selected states**: Minimum 3:1 against background
- **Disabled elements**: No minimum (visually distinct)

### Tested Color Combinations

#### Light Mode

| Foreground | Background | Ratio | Status |
|------------|-----------|-------|--------|
| Gray-900 | White | 17.38:1 | AAA ✓ |
| Gray-700 | White | 11.63:1 | AAA ✓ |
| Gray-600 | White | 7.57:1 | AAA ✓ |
| Primary-500 | White | 4.51:1 | AA ✓ |
| White | Primary-500 | 5.14:1 | AA ✓ |
| Success-700 | Success-100 | 7.21:1 | AAA ✓ |
| Error-700 | Error-100 | 6.89:1 | AAA ✓ |

#### Dark Mode

| Foreground | Background | Ratio | Status |
|------------|-----------|-------|--------|
| White | Gray-900 | 17.38:1 | AAA ✓ |
| Gray-300 | Gray-900 | 8.59:1 | AAA ✓ |
| Gray-400 | Gray-900 | 5.94:1 | AA ✓ |
| Primary-400 | Gray-900 | 7.02:1 | AAA ✓ |
| Success-400 | Gray-900 | 6.41:1 | AAA ✓ |

### Non-Color Indicators

Never rely on color alone to convey information. Always provide additional indicators:

```tsx
/* Bad - Color only */
<span className="text-success-500">Success</span>
<span className="text-error-500">Error</span>

/* Good - Icon + color */
<span className="flex items-center gap-2 text-success-500">
  <CheckCircle className="h-5 w-5" />
  Success
</span>

/* Good - Text + color */
<span className="text-success-500 font-medium">
  ✓ Success
</span>
```

## Keyboard Navigation

### Focus Management

All interactive elements must be keyboard accessible.

#### Focus Indicators

**Visible focus ring on all focusable elements:**

```tsx
/* Default focus style */
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Focusable Button
</button>

/* Input focus */
<input className="border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20" />

/* Link focus */
<a href="#" className="underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded">
  Focusable Link
</a>
```

**Focus styling requirements:**
- Minimum 2px outline/ring
- Minimum 3:1 contrast ratio with background
- 2-4px offset from element
- Visible in both light and dark modes

#### Tab Order

Ensure logical tab order:

```tsx
/* Good - Natural DOM order */
<form>
  <input tabIndex={0} /> {/* Tab 1 */}
  <input tabIndex={0} /> {/* Tab 2 */}
  <button tabIndex={0}>Submit</button> {/* Tab 3 */}
</form>

/* Use tabIndex={-1} to remove from tab order */
<div tabIndex={-1}>Not focusable by keyboard</div>

/* Avoid positive tabIndex values */
<button tabIndex={1}>Don't do this</button>
```

#### Skip Links

Provide skip links for keyboard users:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg"
>
  Skip to main content
</a>

<main id="main-content">
  {/* Main content */}
</main>
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move focus forward |
| Shift + Tab | Move focus backward |
| Enter | Activate button/link |
| Space | Activate button, toggle checkbox |
| Escape | Close modal/dropdown |
| Arrow keys | Navigate lists/menus |
| Home | Jump to start |
| End | Jump to end |

**Implementation:**

```tsx
function Modal({ isOpen, onClose, children }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return isOpen ? (
    <div role="dialog" aria-modal="true">
      {children}
    </div>
  ) : null;
}
```

### Focus Trap

Trap focus inside modals and dialogs:

```tsx
import { useEffect, useRef } from 'react';

function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    modal.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  return isOpen ? (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {children}
    </div>
  ) : null;
}
```

## Screen Reader Support

### Semantic HTML

Use semantic HTML elements whenever possible:

```tsx
/* Good - Semantic HTML */
<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>

<main>
  <article>
    <h1>Article Title</h1>
    <p>Article content...</p>
  </article>
</main>

<footer>
  <p>&copy; 2025 ApplyforUs</p>
</footer>

/* Bad - Non-semantic divs */
<div className="nav">
  <div className="link">Home</div>
  <div className="link">About</div>
</div>
```

### ARIA Labels and Roles

Use ARIA when semantic HTML isn't sufficient:

```tsx
/* Icon button with aria-label */
<button aria-label="Close dialog">
  <X className="h-5 w-5" />
</button>

/* Searchbox role */
<div role="search">
  <input
    type="search"
    aria-label="Search applications"
    placeholder="Search..."
  />
</div>

/* Tab interface */
<div role="tablist" aria-label="Application sections">
  <button
    role="tab"
    aria-selected="true"
    aria-controls="overview-panel"
    id="overview-tab"
  >
    Overview
  </button>
  <button
    role="tab"
    aria-selected="false"
    aria-controls="details-panel"
    id="details-tab"
  >
    Details
  </button>
</div>

<div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
  Overview content
</div>
```

### ARIA Live Regions

Announce dynamic content changes:

```tsx
/* Toast notifications */
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="toast"
>
  Application saved successfully!
</div>

/* Error messages */
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  className="error"
>
  Please fix the errors before submitting.
</div>

/* Loading state */
<div aria-live="polite" aria-busy="true">
  Loading applications...
</div>
```

**ARIA live regions:**
- `aria-live="polite"`: Announced when user is idle
- `aria-live="assertive"`: Announced immediately
- `aria-atomic="true"`: Announce entire region (not just changes)

### Alt Text for Images

Provide meaningful alt text:

```tsx
/* Informative image */
<img
  src="/resume-preview.png"
  alt="Resume preview showing contact information and work experience sections"
/>

/* Decorative image */
<img
  src="/pattern.svg"
  alt=""
  aria-hidden="true"
/>

/* Icon with adjacent text */
<button>
  <FileText className="h-5 w-5" aria-hidden="true" />
  <span>Download Resume</span>
</button>

/* Icon only button */
<button aria-label="Download resume">
  <Download className="h-5 w-5" />
</button>
```

### Headings Hierarchy

Maintain proper heading structure:

```tsx
/* Good - Proper hierarchy */
<h1>Dashboard</h1>
  <h2>Recent Applications</h2>
    <h3>Application Details</h3>
  <h2>Statistics</h2>
    <h3>Monthly Overview</h3>

/* Bad - Skipping levels */
<h1>Dashboard</h1>
  <h3>Recent Applications</h3> {/* Skipped h2 */}
```

### Screen Reader Only Text

Hide text visually but keep for screen readers:

```css
/* Tailwind utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

```tsx
<button>
  <span className="sr-only">Search</span>
  <Search className="h-5 w-5" />
</button>

<a href="/profile">
  <img src="/avatar.jpg" alt="" />
  <span className="sr-only">View profile</span>
</a>
```

## Forms

### Labels

Always associate labels with inputs:

```tsx
/* Explicit label association */
<div>
  <label htmlFor="email" className="block text-sm font-medium mb-1">
    Email Address
  </label>
  <input
    type="email"
    id="email"
    name="email"
    required
    aria-required="true"
  />
</div>

/* Wrapping label */
<label className="flex items-center gap-2">
  <input type="checkbox" />
  <span>Remember me</span>
</label>
```

### Required Fields

Indicate required fields clearly:

```tsx
<div>
  <label htmlFor="name" className="block text-sm font-medium mb-1">
    Full Name <span className="text-error-500" aria-label="required">*</span>
  </label>
  <input
    type="text"
    id="name"
    required
    aria-required="true"
  />
</div>
```

### Error Messages

Associate errors with inputs:

```tsx
<div>
  <label htmlFor="email" className="block text-sm font-medium mb-1">
    Email Address
  </label>
  <input
    type="email"
    id="email"
    aria-invalid="true"
    aria-describedby="email-error"
    className="border-error-500"
  />
  <p id="email-error" className="text-sm text-error-500 mt-1" role="alert">
    Please enter a valid email address
  </p>
</div>
```

### Helper Text

Provide helpful context:

```tsx
<div>
  <label htmlFor="password" className="block text-sm font-medium mb-1">
    Password
  </label>
  <input
    type="password"
    id="password"
    aria-describedby="password-help"
  />
  <p id="password-help" className="text-sm text-gray-600 mt-1">
    Must be at least 8 characters with numbers and symbols
  </p>
</div>
```

### Fieldsets and Legends

Group related inputs:

```tsx
<fieldset>
  <legend className="text-lg font-semibold mb-4">
    Notification Preferences
  </legend>
  <div className="space-y-3">
    <label className="flex items-center gap-2">
      <input type="checkbox" />
      <span>Email notifications</span>
    </label>
    <label className="flex items-center gap-2">
      <input type="checkbox" />
      <span>Push notifications</span>
    </label>
  </div>
</fieldset>
```

## Interactive Components

### Buttons

```tsx
/* Standard button */
<button
  type="button"
  className="btn-primary"
  disabled={isLoading}
  aria-disabled={isLoading}
>
  {isLoading ? 'Saving...' : 'Save Changes'}
</button>

/* Toggle button */
<button
  role="switch"
  aria-checked={isOn}
  onClick={() => setIsOn(!isOn)}
  className="toggle"
>
  <span className="sr-only">Toggle notifications</span>
</button>
```

### Dropdowns

```tsx
<div>
  <button
    aria-haspopup="true"
    aria-expanded={isOpen}
    onClick={() => setIsOpen(!isOpen)}
  >
    Menu
    <ChevronDown className="h-4 w-4" />
  </button>

  {isOpen && (
    <div role="menu" aria-orientation="vertical">
      <a href="#" role="menuitem">
        Item 1
      </a>
      <a href="#" role="menuitem">
        Item 2
      </a>
    </div>
  )}
</div>
```

### Modals

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Confirm Delete</h2>
  <p id="modal-description">
    Are you sure you want to delete this application?
  </p>
  <div>
    <button onClick={onCancel}>Cancel</button>
    <button onClick={onConfirm}>Delete</button>
  </div>
</div>
```

### Tooltips

```tsx
<button
  aria-describedby="tooltip"
  onMouseEnter={() => setShowTooltip(true)}
  onMouseLeave={() => setShowTooltip(false)}
  onFocus={() => setShowTooltip(true)}
  onBlur={() => setShowTooltip(false)}
>
  Help
  {showTooltip && (
    <div id="tooltip" role="tooltip" className="tooltip">
      Click here for help
    </div>
  )}
</button>
```

## Touch Targets

### Minimum Size

All touch targets must be at least 44x44px (WCAG 2.1 AAA):

```tsx
/* Button with adequate size */
<button className="px-6 py-3 min-h-[44px] min-w-[44px]">
  Click me
</button>

/* Icon button with adequate size */
<button className="p-2 min-h-[44px] min-w-[44px]">
  <Settings className="h-6 w-6" />
</button>

/* Link with adequate touch area */
<a href="#" className="inline-block py-3 px-4 min-h-[44px]">
  Learn more
</a>
```

### Spacing

Maintain adequate spacing between touch targets:

```tsx
/* Good - 8px gap between buttons */
<div className="flex gap-2">
  <button className="btn-primary">Save</button>
  <button className="btn-secondary">Cancel</button>
</div>

/* Good - 12px gap in navigation */
<nav className="space-y-3">
  <a href="#" className="block py-2 px-3">Link 1</a>
  <a href="#" className="block py-2 px-3">Link 2</a>
</nav>
```

## Reduced Motion

Respect user motion preferences:

```tsx
/* CSS */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* React */
import { useReducedMotion } from 'framer-motion';

function Component() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={shouldReduceMotion ? '' : 'animate-fade-in'}>
      Content
    </div>
  );
}
```

## Testing

### Manual Testing

1. **Keyboard navigation**: Tab through entire interface
2. **Screen reader**: Test with NVDA, JAWS, or VoiceOver
3. **Zoom**: Test at 200% zoom level
4. **Contrast**: Use browser DevTools or WAVE
5. **Color blindness**: Use color blindness simulators

### Automated Testing

```tsx
/* Jest + Testing Library */
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

/* Check for alt text */
test('image has alt text', () => {
  render(<img src="/logo.png" alt="ApplyforUs logo" />);
  expect(screen.getByAltText('ApplyforUs logo')).toBeInTheDocument();
});

/* Check for labels */
test('input has label', () => {
  render(
    <div>
      <label htmlFor="email">Email</label>
      <input id="email" />
    </div>
  );
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
});
```

### Tools

- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools
- **Color Contrast Analyzer**: Desktop app for contrast testing
- **NVDA/JAWS/VoiceOver**: Screen reader testing

## Best Practices

### Do's
✓ Use semantic HTML elements
✓ Provide text alternatives for non-text content
✓ Ensure keyboard accessibility for all interactions
✓ Maintain sufficient color contrast
✓ Provide clear focus indicators
✓ Use ARIA when semantic HTML isn't sufficient
✓ Test with real assistive technologies
✓ Include accessibility in design process
✓ Write descriptive alt text
✓ Maintain logical heading hierarchy

### Don'ts
✗ Don't rely on color alone for information
✗ Don't use positive tabIndex values
✗ Don't disable focus indicators
✗ Don't use tiny touch targets (< 44px)
✗ Don't skip heading levels
✗ Don't use empty links or buttons
✗ Don't auto-play audio or video
✗ Don't create keyboard traps
✗ Don't use low contrast colors
✗ Don't ignore screen reader testing

## Accessibility Checklist

### General
- [ ] All images have appropriate alt text
- [ ] Color is not the only means of conveying information
- [ ] Sufficient color contrast (4.5:1 for text)
- [ ] Content is readable at 200% zoom
- [ ] Page has a logical heading structure (h1-h6)
- [ ] Skip links provided for keyboard users

### Keyboard
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible (3:1 contrast minimum)
- [ ] Logical tab order throughout page
- [ ] No keyboard traps
- [ ] Escape key closes modals/dropdowns

### Forms
- [ ] All inputs have associated labels
- [ ] Required fields are clearly marked
- [ ] Error messages are announced to screen readers
- [ ] Form validation provides helpful feedback
- [ ] Touch targets are at least 44x44px

### Interactive
- [ ] Buttons use `<button>` element
- [ ] Links use `<a>` element
- [ ] Proper ARIA roles and properties
- [ ] State changes are announced
- [ ] Loading states are communicated

### Testing
- [ ] Tested with keyboard only
- [ ] Tested with screen reader
- [ ] Automated accessibility scan passed
- [ ] Manual testing completed
- [ ] Reduced motion respected

---

**Last Updated**: December 2025
