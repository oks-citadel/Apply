# Layout System

## Overview

The ApplyforUs layout system provides consistent structure and responsive behavior across the platform. Our layouts are built on a 12-column grid system with mobile-first responsive design.

## Grid System

### 12-Column Grid

The foundation of our layout system is a 12-column grid that adapts to different screen sizes.

**Configuration:**
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem; /* 16px */
}

@media (min-width: 640px) {
  .container {
    padding: 0 1.5rem; /* 24px */
  }
}

@media (min-width: 1024px) {
  .container {
    padding: 0 2rem; /* 32px */
  }
}
```

### Grid Examples

```tsx
<!-- Two Column Layout -->
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

<!-- Three Column Layout -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

<!-- Custom Column Spans -->
<div className="grid grid-cols-12 gap-6">
  <div className="col-span-12 md:col-span-8">Main Content</div>
  <div className="col-span-12 md:col-span-4">Sidebar</div>
</div>

<!-- Dashboard Grid -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div>Stat Card 1</div>
  <div>Stat Card 2</div>
  <div>Stat Card 3</div>
  <div>Stat Card 4</div>
</div>
```

## Responsive Breakpoints

Our responsive design follows mobile-first principles, progressively enhancing for larger screens.

| Breakpoint | Min Width | Typical Device | Container Width |
|------------|-----------|----------------|-----------------|
| xs | 0px | Mobile portrait | 100% |
| sm | 640px | Mobile landscape | 640px |
| md | 768px | Tablet portrait | 768px |
| lg | 1024px | Tablet landscape / Small desktop | 1024px |
| xl | 1280px | Desktop | 1280px |
| 2xl | 1536px | Large desktop | 1536px |

**Usage:**
```tsx
<div className="text-base md:text-lg lg:text-xl">
  Responsive text size
</div>

<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive columns
</div>
```

## Common Layouts

### Dashboard Layout

Main application layout with sidebar navigation.

```tsx
<div className="flex h-screen bg-gray-50">
  {/* Sidebar */}
  <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col">
    <div className="p-6">
      <img src="/logo.svg" alt="ApplyforUs" className="h-8" />
    </div>
    <nav className="flex-1 px-6 py-4 space-y-1 overflow-y-auto">
      {/* Navigation items */}
    </nav>
    <div className="p-6 border-t border-gray-200">
      {/* User menu */}
    </div>
  </aside>

  {/* Main Content */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Top Navigation */}
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <button className="lg:hidden">
          {/* Mobile menu button */}
        </button>
        <div className="flex items-center gap-4">
          {/* Search, notifications, profile */}
        </div>
      </div>
    </header>

    {/* Page Content */}
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page content */}
      </div>
    </main>
  </div>
</div>
```

**Key Features:**
- Fixed sidebar (hidden on mobile)
- Scrollable main content area
- Sticky header
- Responsive mobile menu

### Dashboard Content Area

```tsx
<main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
  <div className="max-w-7xl mx-auto space-y-8">
    {/* Page Header */}
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-600 mt-2">Welcome back! Here's what's happening.</p>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Stat cards */}
    </div>

    {/* Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {/* Main content */}
      </div>
      <div>
        {/* Sidebar content */}
      </div>
    </div>
  </div>
</main>
```

### Auth Layout

Centered layout for login, signup, and authentication flows.

```tsx
<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  {/* Logo */}
  <div className="sm:mx-auto sm:w-full sm:max-w-md">
    <img src="/logo.svg" alt="ApplyforUs" className="h-12 mx-auto" />
    <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
      Sign in to your account
    </h2>
  </div>

  {/* Form */}
  <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {/* Auth form content */}
    </div>
  </div>
</div>
```

**Key Features:**
- Centered vertically and horizontally
- Maximum width constraint
- Clean, minimal design
- Mobile-optimized

### Landing Page Layout

Marketing layout for public pages.

```tsx
<div className="min-h-screen bg-white">
  {/* Navigation */}
  <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <img src="/logo.svg" alt="ApplyforUs" className="h-8" />
        <div className="hidden md:flex gap-8">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">Sign In</button>
          <button className="btn-primary">Get Started</button>
        </div>
      </div>
    </div>
  </nav>

  {/* Hero Section */}
  <section className="py-20 md:py-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto">
        {/* Hero content */}
      </div>
    </div>
  </section>

  {/* Features Section */}
  <section className="py-16 md:py-24 bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Features grid */}
    </div>
  </section>

  {/* Footer */}
  <footer className="bg-gray-900 text-white py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Footer content */}
    </div>
  </footer>
</div>
```

**Key Features:**
- Sticky navigation
- Hero sections with gradient backgrounds
- Alternating section backgrounds
- Responsive spacing

### Detail Page Layout

Layout for viewing detailed information (job details, application details, etc.).

```tsx
<div className="min-h-screen bg-gray-50">
  {/* Breadcrumb Navigation */}
  <div className="bg-white border-b border-gray-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Breadcrumbs */}
    </div>
  </div>

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Detail cards */}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Actions, metadata, related items */}
      </div>
    </div>
  </div>
</div>
```

### List Page Layout

Layout for lists and tables (applications list, jobs list, etc.).

```tsx
<div className="space-y-6">
  {/* Page Header with Actions */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
      <p className="text-gray-600 mt-1">Manage your job applications</p>
    </div>
    <button className="btn-primary">
      New Application
    </button>
  </div>

  {/* Filters */}
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex flex-col sm:flex-row gap-3">
      <input type="search" placeholder="Search..." className="flex-1" />
      <select className="w-full sm:w-auto">
        <option>All Status</option>
      </select>
      <select className="w-full sm:w-auto">
        <option>All Types</option>
      </select>
    </div>
  </div>

  {/* Content */}
  <div className="bg-white rounded-lg border border-gray-200">
    {/* Table or cards */}
  </div>

  {/* Pagination */}
  <div className="flex justify-between items-center">
    <p className="text-sm text-gray-600">Showing 1-10 of 247</p>
    <div className="flex gap-2">
      {/* Pagination buttons */}
    </div>
  </div>
</div>
```

## Layout Components

### Container

Maximum width container with responsive padding.

```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

**Variations:**
```tsx
<!-- Narrow Container (for reading) -->
<div className="max-w-3xl mx-auto px-4 sm:px-6">

<!-- Wide Container (for dashboards) -->
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

<!-- Full Width Container -->
<div className="w-full px-4 sm:px-6 lg:px-8">
```

### Stack

Vertical spacing between elements.

```tsx
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

**Spacing variants:**
- `space-y-1`: 4px
- `space-y-2`: 8px
- `space-y-3`: 12px
- `space-y-4`: 16px
- `space-y-6`: 24px
- `space-y-8`: 32px

### Flex Layout

Horizontal layouts with flexbox.

```tsx
<!-- Space Between -->
<div className="flex justify-between items-center">
  <div>Left</div>
  <div>Right</div>
</div>

<!-- Centered -->
<div className="flex justify-center items-center">
  <div>Centered</div>
</div>

<!-- Gap Between Items -->
<div className="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Responsive Direction -->
<div className="flex flex-col md:flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Divider

Visual separation between sections.

```tsx
<!-- Horizontal Divider -->
<hr className="border-t border-gray-200 my-6" />

<!-- Vertical Divider -->
<div className="border-l border-gray-200 mx-4 h-full" />

<!-- With Text -->
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-white text-gray-500">or</span>
  </div>
</div>
```

### Section

Reusable section component with consistent spacing.

```tsx
<section className="py-12 md:py-16 lg:py-20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Section Title</h2>
      <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Section description</p>
    </div>
    {/* Section content */}
  </div>
</section>
```

## Responsive Patterns

### Mobile Navigation

```tsx
{/* Mobile Menu Button */}
<button className="lg:hidden" onClick={toggleMenu}>
  <svg className="h-6 w-6" />
</button>

{/* Mobile Menu Overlay */}
{isMenuOpen && (
  <div className="fixed inset-0 z-50 lg:hidden">
    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleMenu} />
    <nav className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl">
      {/* Navigation items */}
    </nav>
  </div>
)}
```

### Responsive Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Cards */}
</div>
```

### Responsive Table to Cards

```tsx
{/* Desktop: Table */}
<div className="hidden md:block">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>

{/* Mobile: Cards */}
<div className="md:hidden space-y-4">
  {items.map(item => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      {/* Card content */}
    </div>
  ))}
</div>
```

### Sticky Elements

```tsx
{/* Sticky Header */}
<header className="sticky top-0 z-50 bg-white border-b border-gray-200">
  {/* Header content */}
</header>

{/* Sticky Sidebar */}
<aside className="sticky top-24 h-fit">
  {/* Sidebar content */}
</aside>

{/* Sticky Footer Actions */}
<div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
  <button className="btn-primary w-full">Save Changes</button>
</div>
```

## Z-Index Scale

Consistent layering throughout the application.

```css
.z-dropdown { z-index: 10; }
.z-sticky { z-index: 20; }
.z-fixed { z-index: 30; }
.z-modal-backdrop { z-index: 40; }
.z-modal { z-index: 50; }
.z-popover { z-index: 60; }
.z-tooltip { z-index: 70; }
```

**Usage:**
```tsx
<div className="z-10">Dropdown</div>
<div className="z-50">Modal</div>
```

## Aspect Ratios

Maintain consistent aspect ratios for images and media.

```tsx
{/* 16:9 Aspect Ratio */}
<div className="aspect-video">
  <img src="..." className="w-full h-full object-cover" />
</div>

{/* 4:3 Aspect Ratio */}
<div className="aspect-4/3">
  <img src="..." className="w-full h-full object-cover" />
</div>

{/* Square */}
<div className="aspect-square">
  <img src="..." className="w-full h-full object-cover" />
</div>
```

## Best Practices

### Do's
✓ Use the grid system for consistent layouts
✓ Follow mobile-first responsive design
✓ Maintain consistent container widths
✓ Use semantic HTML for layout structure
✓ Test layouts on various screen sizes
✓ Keep touch targets at least 44x44px
✓ Use sticky positioning sparingly

### Don'ts
✗ Don't create arbitrary breakpoints
✗ Don't nest containers unnecessarily
✗ Don't use fixed widths without responsive variants
✗ Don't ignore mobile layout requirements
✗ Don't stack too many sticky elements
✗ Don't create overly complex grid structures

## Layout Examples

### Dashboard Home

```tsx
<div className="space-y-8">
  {/* Welcome Header */}
  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg p-8 text-white">
    <h1 className="text-3xl font-bold">Welcome back, Sarah!</h1>
    <p className="mt-2">You have 3 new messages and 5 pending applications.</p>
  </div>

  {/* Stats Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Stat cards */}
  </div>

  {/* Two Column Layout */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-6">
      {/* Recent applications table */}
    </div>
    <div className="space-y-6">
      {/* Activity feed */}
    </div>
  </div>
</div>
```

### Settings Page

```tsx
<div className="max-w-4xl mx-auto space-y-8">
  {/* Page Header */}
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
    <p className="text-gray-600 mt-2">Manage your account preferences</p>
  </div>

  {/* Settings Sections */}
  <div className="space-y-6">
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
      {/* Form fields */}
    </section>

    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Notifications</h2>
      {/* Toggle switches */}
    </section>

    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Security</h2>
      {/* Security settings */}
    </section>
  </div>

  {/* Actions */}
  <div className="flex gap-3 justify-end">
    <button className="btn-secondary">Cancel</button>
    <button className="btn-primary">Save Changes</button>
  </div>
</div>
```

---

**Last Updated**: December 2025
