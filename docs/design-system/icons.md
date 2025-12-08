# Icon System

## Overview

ApplyforUs uses Lucide React as our primary icon library. Lucide provides a comprehensive set of clean, consistent, and customizable icons that align with our modern design aesthetic.

## Icon Library

**Lucide React**: https://lucide.dev/

**Installation:**
```bash
npm install lucide-react
```

**Import:**
```tsx
import { Icon Name } from 'lucide-react';
```

## Icon Sizes

Our icon sizing follows a consistent scale based on our spacing system.

| Size Token | Pixels | Rem | Tailwind Class | Usage |
|------------|--------|-----|----------------|-------|
| xs | 16px | 1rem | h-4 w-4 | Small icons in buttons, badges |
| sm | 20px | 1.25rem | h-5 w-5 | Navigation icons, small UI elements |
| base | 24px | 1.5rem | h-6 w-6 | Default size, most UI icons |
| lg | 32px | 2rem | h-8 w-8 | Feature icons, section headers |
| xl | 48px | 3rem | h-12 w-12 | Empty states, hero sections |

**Usage:**
```tsx
import { Home } from 'lucide-react';

<Home className="h-5 w-5" /> {/* 20px */}
<Home className="h-6 w-6" /> {/* 24px (default) */}
<Home className="h-8 w-8" /> {/* 32px */}
```

## Stroke Width

Lucide icons have a default stroke width of 2px, which works well for most use cases.

**Default (2px):**
```tsx
<Icon className="h-6 w-6" />
```

**Custom stroke width:**
```tsx
<Icon className="h-6 w-6" strokeWidth={1.5} /> {/* Thinner */}
<Icon className="h-6 w-6" strokeWidth={2.5} /> {/* Thicker */}
```

**Guidelines:**
- **1.5px**: Use for large icons (32px+)
- **2px**: Default for most icons
- **2.5px**: Use for small icons (16px) to maintain visibility

## Icon Colors

Icons inherit the text color by default, making them easy to theme.

```tsx
{/* Inherit text color */}
<Icon className="h-6 w-6" />

{/* Custom color */}
<Icon className="h-6 w-6 text-primary-500" />
<Icon className="h-6 w-6 text-success-500" />
<Icon className="h-6 w-6 text-error-500" />
<Icon className="h-6 w-6 text-gray-400" />
```

**Color Guidelines:**
- **Gray-400/500**: Inactive or decorative icons
- **Gray-600/700**: Active icons in UI
- **Primary-500**: Brand-related or selected icons
- **Semantic colors**: Success, error, warning states

## Common Icon Mappings

### Navigation

```tsx
import {
  Home,
  Briefcase,
  FileText,
  Settings,
  Users,
  Bell,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Usage
<Home className="h-5 w-5" /> {/* Dashboard */}
<Briefcase className="h-5 w-5" /> {/* Jobs/Applications */}
<FileText className="h-5 w-5" /> {/* Resumes/Documents */}
<Settings className="h-5 w-5" /> {/* Settings */}
<Bell className="h-5 w-5" /> {/* Notifications */}
```

### Actions

```tsx
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Share2,
  Copy,
  ExternalLink,
  Check,
  X,
  MoreHorizontal,
  MoreVertical,
} from 'lucide-react';

// Usage
<Plus className="h-5 w-5" /> {/* Add/Create */}
<Edit className="h-5 w-5" /> {/* Edit */}
<Trash2 className="h-5 w-5" /> {/* Delete */}
<Save className="h-5 w-5" /> {/* Save */}
<Download className="h-5 w-5" /> {/* Download */}
<Upload className="h-5 w-5" /> {/* Upload */}
<Share2 className="h-5 w-5" /> {/* Share */}
<Copy className="h-5 w-5" /> {/* Copy/Duplicate */}
```

### Status & Feedback

```tsx
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// Usage
<CheckCircle className="h-5 w-5 text-success-500" /> {/* Success */}
<XCircle className="h-5 w-5 text-error-500" /> {/* Error */}
<AlertCircle className="h-5 w-5 text-info-500" /> {/* Info */}
<AlertTriangle className="h-5 w-5 text-warning-500" /> {/* Warning */}
<Clock className="h-5 w-5 text-gray-500" /> {/* Pending */}
```

### User & Account

```tsx
import {
  User,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calendar,
} from 'lucide-react';

// Usage
<User className="h-5 w-5" /> {/* Profile */}
<UserPlus className="h-5 w-5" /> {/* Add user */}
<Users className="h-5 w-5" /> {/* Team/Group */}
<Mail className="h-5 w-5" /> {/* Email */}
<Phone className="h-5 w-5" /> {/* Phone */}
<MapPin className="h-5 w-5" /> {/* Location */}
```

### Files & Documents

```tsx
import {
  File,
  FileText,
  FileUp,
  FileDown,
  FilePlus,
  Folder,
  FolderOpen,
  Download,
  Upload,
  Paperclip,
} from 'lucide-react';

// Usage
<FileText className="h-5 w-5" /> {/* Document/Resume */}
<File className="h-5 w-5" /> {/* Generic file */}
<FileUp className="h-5 w-5" /> {/* Upload file */}
<Folder className="h-5 w-5" /> {/* Folder */}
<Paperclip className="h-5 w-5" /> {/* Attachment */}
```

### AI & Automation

```tsx
import {
  Sparkles,
  Zap,
  Bot,
  Cpu,
  Target,
  Wand2,
  Brain,
  Rocket,
} from 'lucide-react';

// Usage
<Sparkles className="h-5 w-5 text-primary-500" /> {/* AI features */}
<Zap className="h-5 w-5 text-warning-500" /> {/* Auto-apply */}
<Bot className="h-5 w-5 text-primary-500" /> {/* AI assistant */}
<Wand2 className="h-5 w-5 text-primary-500" /> {/* AI generation */}
<Rocket className="h-5 w-5 text-primary-500" /> {/* Quick actions */}
```

### Data & Analytics

```tsx
import {
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  EyeOff,
} from 'lucide-react';

// Usage
<BarChart className="h-5 w-5" /> {/* Analytics */}
<LineChart className="h-5 w-5" /> {/* Trends */}
<TrendingUp className="h-5 w-5 text-success-500" /> {/* Increase */}
<Activity className="h-5 w-5" /> {/* Activity/Stats */}
```

### Media Controls

```tsx
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from 'lucide-react';
```

### Miscellaneous

```tsx
import {
  Star,
  Heart,
  Bookmark,
  Tag,
  Link,
  Lock,
  Unlock,
  Shield,
  Award,
  Gift,
  Flag,
} from 'lucide-react';

// Usage
<Star className="h-5 w-5 text-warning-500" /> {/* Favorite/Rating */}
<Bookmark className="h-5 w-5" /> {/* Save for later */}
<Tag className="h-5 w-5" /> {/* Tags/Categories */}
<Lock className="h-5 w-5" /> {/* Private/Secure */}
<Award className="h-5 w-5 text-warning-500" /> {/* Achievement */}
```

## Icon Usage Patterns

### In Buttons

```tsx
{/* Icon with text */}
<button className="btn-primary flex items-center gap-2">
  <Plus className="h-5 w-5" />
  Create Application
</button>

{/* Icon only */}
<button className="p-2 rounded-lg hover:bg-gray-100">
  <Settings className="h-5 w-5" />
</button>

{/* Icon on right */}
<button className="btn-secondary flex items-center gap-2">
  Learn More
  <ArrowRight className="h-5 w-5" />
</button>
```

### In Navigation

```tsx
<nav className="space-y-1">
  <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary-50 text-primary-700">
    <Home className="h-5 w-5" />
    <span>Dashboard</span>
  </a>
  <a href="/applications" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
    <Briefcase className="h-5 w-5" />
    <span>Applications</span>
  </a>
</nav>
```

### In Form Fields

```tsx
<div className="relative">
  <div className="absolute left-3 top-1/2 -translate-y-1/2">
    <Search className="h-5 w-5 text-gray-400" />
  </div>
  <input
    type="search"
    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
    placeholder="Search..."
  />
</div>
```

### In Alerts

```tsx
<div className="bg-success-50 border border-success-200 rounded-lg p-4">
  <div className="flex items-start gap-3">
    <CheckCircle className="h-5 w-5 text-success-500 mt-0.5" />
    <div>
      <h4 className="font-semibold text-success-900">Success!</h4>
      <p className="text-sm text-success-700 mt-1">Your application was submitted.</p>
    </div>
  </div>
</div>
```

### In Lists

```tsx
<ul className="space-y-2">
  <li className="flex items-center gap-2 text-gray-700">
    <Check className="h-5 w-5 text-success-500" />
    Feature included
  </li>
  <li className="flex items-center gap-2 text-gray-700">
    <Check className="h-5 w-5 text-success-500" />
    Another feature
  </li>
</ul>
```

### In Empty States

```tsx
<div className="text-center py-12">
  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
    <FileText className="h-8 w-8 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900">No applications yet</h3>
  <p className="text-gray-600 mt-1">Get started by creating your first application.</p>
</div>
```

### In Badges

```tsx
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
  <CheckCircle className="h-3.5 w-3.5" />
  Active
</span>
```

### Icon Buttons

```tsx
{/* Small icon button */}
<button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
  <MoreHorizontal className="h-5 w-5" />
</button>

{/* Medium icon button (44x44 touch target) */}
<button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
  <Settings className="h-6 w-6" />
</button>

{/* Large icon button */}
<button className="p-3 rounded-lg bg-primary-100 text-primary-700 hover:bg-primary-200">
  <Plus className="h-8 w-8" />
</button>
```

## Animated Icons

### Loading Spinner

```tsx
import { Loader2 } from 'lucide-react';

<Loader2 className="h-5 w-5 animate-spin" />

{/* In button */}
<button className="btn-primary flex items-center gap-2" disabled>
  <Loader2 className="h-5 w-5 animate-spin" />
  Loading...
</button>
```

### Refresh Animation

```tsx
import { RefreshCw } from 'lucide-react';

<button onClick={refresh} className="p-2 rounded-lg hover:bg-gray-100">
  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
</button>
```

## Accessibility

### ARIA Labels

Always provide accessible labels for icon-only buttons:

```tsx
<button aria-label="Settings" className="p-2 rounded-lg hover:bg-gray-100">
  <Settings className="h-5 w-5" />
</button>

{/* Or with tooltip */}
<button title="Open settings" aria-label="Settings" className="p-2 rounded-lg hover:bg-gray-100">
  <Settings className="h-5 w-5" />
</button>
```

### Decorative Icons

For decorative icons (with adjacent text), use `aria-hidden`:

```tsx
<button className="flex items-center gap-2">
  <Plus className="h-5 w-5" aria-hidden="true" />
  Create Application
</button>
```

### Screen Reader Text

Provide screen reader text for icons conveying important information:

```tsx
<div className="flex items-center gap-2">
  <CheckCircle className="h-5 w-5 text-success-500" aria-hidden="true" />
  <span className="sr-only">Success:</span>
  <span>Application submitted</span>
</div>
```

## Best Practices

### Do's
✓ Use consistent icon sizes throughout the app
✓ Maintain adequate spacing around icons (min 8px)
✓ Use semantic icons that match their meaning
✓ Provide ARIA labels for icon-only buttons
✓ Use the same icon for the same action consistently
✓ Match icon visual weight to surrounding text

### Don'ts
✗ Don't mix icon libraries
✗ Don't use icons smaller than 16px
✗ Don't use decorative icons without purpose
✗ Don't use too many icons in one interface
✗ Don't rely solely on icons to convey meaning
✗ Don't forget mobile touch targets (min 44px)

## Icon Component

### Reusable Icon Wrapper

```tsx
// components/ui/icon.tsx
import { LucideIcon } from 'lucide-react';

interface IconProps {
  icon: LucideIcon;
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  base: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function Icon({ icon: IconComponent, size = 'base', className = '' }: IconProps) {
  return <IconComponent className={`${sizeClasses[size]} ${className}`} />;
}

// Usage
import { Home } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

<Icon icon={Home} size="sm" className="text-primary-500" />
```

## Icon Library Reference

### Full List of Common Icons

```tsx
// Navigation & UI
Home, Menu, X, Search, Settings, ChevronLeft, ChevronRight,
ChevronDown, ChevronUp, ArrowLeft, ArrowRight, MoreHorizontal, MoreVertical

// Actions
Plus, Edit, Trash2, Save, Copy, Download, Upload, Share2,
ExternalLink, Link, Maximize, Minimize, ZoomIn, ZoomOut

// Status
Check, CheckCircle, X, XCircle, AlertCircle, AlertTriangle,
Info, HelpCircle, Clock, TrendingUp, TrendingDown

// User
User, Users, UserPlus, UserCheck, UserX, Mail, Phone,
Calendar, MapPin, Globe

// Files
File, FileText, Folder, FolderOpen, FileUp, FileDown,
FilePlus, Paperclip, Image

// AI & Features
Sparkles, Zap, Bot, Cpu, Wand2, Brain, Rocket, Target

// Data
BarChart, LineChart, PieChart, Activity, Eye, EyeOff

// Communication
Bell, MessageSquare, Send, Inbox, AtSign

// Objects
Star, Heart, Bookmark, Tag, Flag, Award, Gift, Shield,
Lock, Unlock, Key, CreditCard

// Media
Play, Pause, SkipForward, SkipBack, Volume2, VolumeX

// Misc
Filter, SlidersHorizontal, Layout, Grid, List, Layers,
Package, Briefcase, Building
```

---

**Last Updated**: December 2025
