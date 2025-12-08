# Component Library

## Overview

The ApplyforUs component library provides a comprehensive set of reusable UI components that follow our design system principles. Each component is accessible, responsive, and optimized for performance.

## Buttons

### Button Variants

#### Primary Button

The primary button is used for main actions and CTAs.

**Appearance:**
- Background: Primary (#6366F1)
- Text: White
- Font Weight: 600 (Semibold)
- Padding: 12px 24px (py-3 px-6)
- Border Radius: 8px
- Shadow: sm on hover

**States:**
- Default: bg-primary-500 text-white
- Hover: bg-primary-600
- Active: bg-primary-700
- Focus: ring-2 ring-primary-500 ring-offset-2
- Disabled: bg-gray-300 text-gray-500 cursor-not-allowed

**Example:**
```tsx
<button className="bg-primary-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">
  Save Changes
</button>
```

#### Secondary Button

Used for secondary actions that complement primary actions.

**Appearance:**
- Background: White
- Text: Primary (#6366F1)
- Border: 1px solid Gray-300
- Font Weight: 600
- Padding: 12px 24px

**States:**
- Default: bg-white text-primary-500 border-gray-300
- Hover: bg-gray-50
- Active: bg-gray-100
- Focus: ring-2 ring-primary-500 ring-offset-2
- Disabled: bg-gray-50 text-gray-400 border-gray-200

#### Outline Button

Minimal button style for tertiary actions.

**Appearance:**
- Background: Transparent
- Text: Gray-700
- Border: 1px solid Gray-300
- Font Weight: 600
- Padding: 12px 24px

**States:**
- Hover: bg-gray-50 border-gray-400
- Active: bg-gray-100
- Focus: ring-2 ring-gray-300 ring-offset-2

#### Ghost Button

Most minimal button style, often used in lists or tables.

**Appearance:**
- Background: Transparent
- Text: Gray-700
- No border
- Font Weight: 500
- Padding: 8px 12px

**States:**
- Hover: bg-gray-100
- Active: bg-gray-200
- Focus: ring-2 ring-gray-300 ring-offset-2

#### Danger Button

Used for destructive actions like delete or cancel.

**Appearance:**
- Background: Error (#EF4444)
- Text: White
- Font Weight: 600
- Padding: 12px 24px

**States:**
- Default: bg-error-500 text-white
- Hover: bg-error-600
- Active: bg-error-700
- Focus: ring-2 ring-error-500 ring-offset-2

#### Icon Button

Square button with icon only, no text.

**Appearance:**
- Size: 40x40px (min touch target)
- Background: Transparent or Gray-100
- Padding: 8px
- Border Radius: 8px

**Sizes:**
- Small: 32x32px (p-1.5)
- Medium: 40x40px (p-2)
- Large: 48x48px (p-3)

### Button Sizes

```tsx
// Small
<button className="py-2 px-4 text-sm">Small Button</button>

// Medium (Default)
<button className="py-3 px-6 text-base">Medium Button</button>

// Large
<button className="py-4 px-8 text-lg">Large Button</button>
```

### Button Group

```tsx
<div className="flex gap-3">
  <button className="btn-primary">Save</button>
  <button className="btn-secondary">Cancel</button>
</div>
```

## Inputs

### Text Input

**Appearance:**
- Border: 1px solid Gray-300
- Background: White
- Padding: 12px 16px
- Border Radius: 8px
- Font Size: 16px

**States:**
- Default: border-gray-300
- Focus: border-primary-500 ring-2 ring-primary-500 ring-opacity-20
- Error: border-error-500 ring-2 ring-error-500 ring-opacity-20
- Success: border-success-500
- Disabled: bg-gray-100 text-gray-500 cursor-not-allowed

**Example:**
```tsx
<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700">
    Email Address
  </label>
  <input
    type="email"
    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 transition-colors"
    placeholder="you@example.com"
  />
</div>
```

### Textarea

Similar styling to text input but with adjustable height.

```tsx
<textarea
  className="w-full border border-gray-300 rounded-lg px-4 py-3 min-h-[120px] focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 resize-y"
  placeholder="Enter your message..."
/>
```

### Select

```tsx
<select className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 appearance-none bg-white">
  <option>Select an option</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

### Checkbox

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    className="w-5 h-5 border-2 border-gray-300 rounded text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
  />
  <span className="text-sm text-gray-700">Remember me</span>
</label>
```

### Radio Button

```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="radio"
    name="option"
    className="w-5 h-5 border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
  />
  <span className="text-sm text-gray-700">Option 1</span>
</label>
```

### Toggle Switch

```tsx
<button
  role="switch"
  aria-checked="true"
  className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-500 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
>
  <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
</button>
```

### File Upload

```tsx
<div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
  <input type="file" className="hidden" id="file-upload" />
  <label htmlFor="file-upload" className="cursor-pointer">
    <div className="text-gray-600">
      <svg className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm">Click to upload or drag and drop</p>
      <p className="text-xs text-gray-500">PDF, DOC up to 10MB</p>
    </div>
  </label>
</div>
```

## Cards

### Default Card

```tsx
<div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
  <h3 className="text-xl font-semibold text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600">Card content goes here.</p>
</div>
```

### Elevated Card

Card with more prominent shadow, used for important content.

```tsx
<div className="bg-white rounded-lg p-6 shadow-lg">
  <h3 className="text-xl font-semibold text-gray-900 mb-2">Elevated Card</h3>
  <p className="text-gray-600">Important content.</p>
</div>
```

### Bordered Card

```tsx
<div className="bg-white rounded-lg p-6 border-2 border-gray-200 hover:border-primary-500 transition-colors">
  <h3 className="text-xl font-semibold text-gray-900 mb-2">Bordered Card</h3>
  <p className="text-gray-600">Hover to see border change.</p>
</div>
```

### Interactive Card

Clickable card with hover effects.

```tsx
<a href="/link" className="block bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-500 transition-all cursor-pointer">
  <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Card</h3>
  <p className="text-gray-600">Click to navigate.</p>
</a>
```

### Stat Card

```tsx
<div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-600">Total Applications</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">247</p>
    </div>
    <div className="bg-primary-100 rounded-full p-3">
      <svg className="h-6 w-6 text-primary-500" />
    </div>
  </div>
  <div className="mt-4 flex items-center text-sm">
    <span className="text-success-500 font-medium">+12%</span>
    <span className="text-gray-600 ml-2">from last month</span>
  </div>
</div>
```

## Modals

### Default Modal

```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Modal Title</h2>
    <p className="text-gray-600 mb-6">Modal content goes here.</p>
    <div className="flex gap-3 justify-end">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### Confirmation Dialog

```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
  <div className="bg-white rounded-lg p-8 max-w-sm w-full shadow-xl">
    <div className="bg-error-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
      <svg className="h-6 w-6 text-error-500" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Delete Application?</h2>
    <p className="text-gray-600 text-center mb-6">This action cannot be undone.</p>
    <div className="flex gap-3">
      <button className="btn-secondary flex-1">Cancel</button>
      <button className="btn-danger flex-1">Delete</button>
    </div>
  </div>
</div>
```

### Alert Dialog

```tsx
<div className="bg-white rounded-lg p-6 shadow-xl border-l-4 border-warning-500">
  <div className="flex items-start gap-3">
    <svg className="h-6 w-6 text-warning-500 mt-0.5" />
    <div>
      <h3 className="font-semibold text-gray-900">Warning</h3>
      <p className="text-sm text-gray-600 mt-1">Please review this information carefully.</p>
    </div>
  </div>
</div>
```

## Navigation

### Sidebar

```tsx
<nav className="w-64 bg-white border-r border-gray-200 h-screen p-6">
  <div className="mb-8">
    <img src="/logo.svg" alt="ApplyforUs" className="h-8" />
  </div>

  <div className="space-y-6">
    <div className="space-y-1">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 mb-2">
        Main
      </h3>
      <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-700 font-medium">
        <svg className="h-5 w-5" />
        Dashboard
      </a>
      <a href="/applications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
        <svg className="h-5 w-5" />
        Applications
      </a>
    </div>
  </div>
</nav>
```

### Top Navigation Bar

```tsx
<header className="bg-white border-b border-gray-200 sticky top-0 z-10">
  <div className="px-6 py-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <img src="/logo.svg" alt="ApplyforUs" className="h-8" />
      <nav className="hidden md:flex gap-1">
        <a href="/dashboard" className="px-4 py-2 rounded-lg text-primary-700 bg-primary-50 font-medium">
          Dashboard
        </a>
        <a href="/jobs" className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
          Jobs
        </a>
      </nav>
    </div>
    <div className="flex items-center gap-3">
      <button className="icon-button">
        <svg className="h-5 w-5" />
      </button>
      <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold">
        JD
      </div>
    </div>
  </div>
</header>
```

### Breadcrumbs

```tsx
<nav className="flex items-center gap-2 text-sm text-gray-600">
  <a href="/" className="hover:text-primary-500">Home</a>
  <svg className="h-4 w-4" />
  <a href="/applications" className="hover:text-primary-500">Applications</a>
  <svg className="h-4 w-4" />
  <span className="text-gray-900 font-medium">Details</span>
</nav>
```

### Tabs

```tsx
<div className="border-b border-gray-200">
  <nav className="flex gap-8">
    <button className="pb-3 border-b-2 border-primary-500 text-primary-700 font-medium">
      Overview
    </button>
    <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
      Details
    </button>
    <button className="pb-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
      History
    </button>
  </nav>
</div>
```

## Tables

### Default Table

```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">
          Company
        </th>
        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">
          Position
        </th>
        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3 text-sm text-gray-900">Google</td>
        <td className="px-4 py-3 text-sm text-gray-700">Software Engineer</td>
        <td className="px-4 py-3">
          <span className="badge-success">Active</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Sortable Table

Headers include sort indicators.

```tsx
<th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100">
  <div className="flex items-center gap-2">
    Company
    <svg className="h-4 w-4 text-gray-400" />
  </div>
</th>
```

### Selectable Table

```tsx
<tr className="hover:bg-gray-50 cursor-pointer">
  <td className="px-4 py-3">
    <input type="checkbox" className="rounded" />
  </td>
  <td className="px-4 py-3 text-sm text-gray-900">Google</td>
  {/* ... */}
</tr>
```

## Badges and Tags

### Badge

```tsx
<!-- Success Badge -->
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
  Active
</span>

<!-- Warning Badge -->
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-warning-100 text-warning-700">
  Pending
</span>

<!-- Error Badge -->
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700">
  Rejected
</span>

<!-- Info Badge -->
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-info-100 text-info-700">
  New
</span>

<!-- Neutral Badge -->
<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
  Draft
</span>
```

### Tag (Dismissible)

```tsx
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
  JavaScript
  <button className="hover:bg-primary-200 rounded-full p-0.5">
    <svg className="h-3 w-3" />
  </button>
</span>
```

## Alerts and Toasts

### Alert

```tsx
<!-- Success Alert -->
<div className="bg-success-50 border border-success-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <svg className="h-5 w-5 text-success-500 mt-0.5" />
    <div className="flex-1">
      <h4 className="font-semibold text-success-900">Success!</h4>
      <p className="text-sm text-success-700 mt-1">Your application was submitted successfully.</p>
    </div>
    <button className="text-success-500 hover:text-success-700">
      <svg className="h-5 w-5" />
    </button>
  </div>
</div>

<!-- Error Alert -->
<div className="bg-error-50 border border-error-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <svg className="h-5 w-5 text-error-500 mt-0.5" />
    <div className="flex-1">
      <h4 className="font-semibold text-error-900">Error</h4>
      <p className="text-sm text-error-700 mt-1">Please check the form and try again.</p>
    </div>
  </div>
</div>
```

### Toast Notification

```tsx
<div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm animate-slide-in-from-top">
  <div className="flex items-start gap-3">
    <div className="bg-success-100 rounded-full p-2">
      <svg className="h-5 w-5 text-success-500" />
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-gray-900">Application Saved</h4>
      <p className="text-sm text-gray-600 mt-1">Your changes have been saved.</p>
    </div>
    <button className="text-gray-400 hover:text-gray-600">
      <svg className="h-5 w-5" />
    </button>
  </div>
</div>
```

## Loading States

### Spinner

```tsx
<!-- Small Spinner -->
<svg className="animate-spin h-5 w-5 text-primary-500">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor" d="..." />
</svg>

<!-- Button with Spinner -->
<button className="btn-primary flex items-center gap-2" disabled>
  <svg className="animate-spin h-5 w-5" />
  Loading...
</button>
```

### Skeleton

```tsx
<!-- Card Skeleton -->
<div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-20 bg-gray-200 rounded"></div>
  </div>
</div>

<!-- Table Skeleton -->
<div className="space-y-3">
  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
  <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
  <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
</div>
```

### Progress Bar

```tsx
<!-- Determinate Progress -->
<div className="w-full bg-gray-200 rounded-full h-2">
  <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: '65%' }}></div>
</div>

<!-- With Label -->
<div>
  <div className="flex justify-between text-sm text-gray-600 mb-1">
    <span>Uploading...</span>
    <span>65%</span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: '65%' }}></div>
  </div>
</div>

<!-- Indeterminate Progress -->
<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
  <div className="bg-primary-500 h-2 rounded-full animate-pulse"></div>
</div>
```

## Empty States

```tsx
<div className="text-center py-12">
  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
    <svg className="h-8 w-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
  <p className="text-gray-600 mb-6">Get started by creating your first job application.</p>
  <button className="btn-primary">Create Application</button>
</div>
```

## Error States

```tsx
<div className="text-center py-12">
  <div className="bg-error-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
    <svg className="h-8 w-8 text-error-500" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
  <p className="text-gray-600 mb-6">We couldn't load your applications. Please try again.</p>
  <button className="btn-primary">Try Again</button>
</div>
```

---

**Last Updated**: December 2025
