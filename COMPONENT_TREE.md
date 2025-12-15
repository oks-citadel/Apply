# ApplyForUs Landing Page - Component Tree

## Visual Component Hierarchy

```
apps/web/src/app/page.tsx (644 lines)
│
└─ Home() - Main Page Component
   │
   ├─ HeroSection()
   │  ├─ Badge (AI-Powered Auto-Apply Platform)
   │  ├─ h1 (Land Your Dream Job While You Sleep)
   │  ├─ Value Proposition Text
   │  │  ├─ What it does
   │  │  ├─ Who it's for
   │  │  └─ Why it's better (3 checkmarks)
   │  ├─ CTAs
   │  │  ├─ Button (Primary: "Start Auto-Applying")
   │  │  └─ Button (Secondary: "See How It Works")
   │  ├─ Social Proof Text
   │  └─ Decorative Background Elements
   │
   ├─ TrustBar()
   │  └─ Trust Indicators (4 items)
   │     ├─ Bank-Level Security
   │     ├─ GDPR Compliant
   │     ├─ 150+ Countries
   │     └─ SOC 2 Certified
   │
   ├─ ValuePropositionSection()
   │  ├─ Section Heading
   │  └─ Grid (3 columns)
   │     ├─ ValueCard (Save 95% of Your Time)
   │     │  ├─ Icon (Clock)
   │     │  ├─ Title
   │     │  ├─ Description
   │     │  └─ Badge (Metric)
   │     ├─ ValueCard (Higher Success Rate)
   │     │  ├─ Icon (Target)
   │     │  ├─ Title
   │     │  ├─ Description
   │     │  └─ Badge (Metric)
   │     └─ ValueCard (Global Opportunities)
   │        ├─ Icon (Globe)
   │        ├─ Title
   │        ├─ Description
   │        └─ Badge (Metric)
   │
   ├─ HowItWorksSection() [id="how-it-works"]
   │  ├─ Section Heading
   │  └─ Steps (4 items)
   │     ├─ StepCard (1. Upload Your Resume)
   │     │  ├─ Number Circle
   │     │  ├─ Icon Badge (FileText)
   │     │  ├─ Title
   │     │  └─ Description
   │     ├─ StepCard (2. Set Your Preferences)
   │     │  ├─ Number Circle
   │     │  ├─ Icon Badge (Target)
   │     │  ├─ Title
   │     │  └─ Description
   │     ├─ StepCard (3. Activate Auto-Apply)
   │     │  ├─ Number Circle
   │     │  ├─ Icon Badge (Zap)
   │     │  ├─ Title
   │     │  └─ Description
   │     └─ StepCard (4. Track & Interview)
   │        ├─ Number Circle
   │        ├─ Icon Badge (TrendingUp)
   │        ├─ Title
   │        └─ Description
   │
   ├─ FeaturesSection()
   │  ├─ Section Heading
   │  └─ Grid (3 columns)
   │     ├─ FeatureCard (AI Resume Optimization)
   │     ├─ FeatureCard (Custom Cover Letters)
   │     ├─ FeatureCard (Instant Applications)
   │     ├─ FeatureCard (Privacy Protected)
   │     ├─ FeatureCard (Application Analytics)
   │     └─ FeatureCard (Job Matching)
   │
   ├─ TrustSecuritySection()
   │  ├─ Section Heading
   │  └─ Grid (4 columns)
   │     ├─ SecurityBadge (256-bit Encryption)
   │     ├─ SecurityBadge (GDPR Compliant)
   │     ├─ SecurityBadge (SOC 2 Type II)
   │     └─ SecurityBadge (Privacy First)
   │
   ├─ SuccessMetricsSection()
   │  ├─ Section Heading
   │  └─ Grid (4 columns)
   │     ├─ MetricCard (50,000+ Active Users)
   │     ├─ MetricCard (2M+ Applications Sent)
   │     ├─ MetricCard (85% Success Rate)
   │     └─ MetricCard (150+ Countries)
   │
   ├─ TestimonialsSection()
   │  ├─ Section Heading
   │  └─ Grid (3 columns)
   │     ├─ TestimonialCard (Sarah Chen)
   │     │  ├─ Quote Icon
   │     │  ├─ Quote Text
   │     │  └─ Attribution
   │     │     ├─ Name
   │     │     ├─ Role
   │     │     └─ Location
   │     ├─ TestimonialCard (Miguel Rodriguez)
   │     │  ├─ Quote Icon
   │     │  ├─ Quote Text
   │     │  └─ Attribution
   │     └─ TestimonialCard (Aisha Patel)
   │        ├─ Quote Icon
   │        ├─ Quote Text
   │        └─ Attribution
   │
   ├─ FinalCTASection()
   │  ├─ Heading
   │  ├─ Description
   │  ├─ Button (Get Started Free)
   │  └─ Disclaimer Text
   │
   └─ Footer()
      ├─ Grid (5 columns)
      │  ├─ Company Info
      │  │  ├─ Logo/Name
      │  │  ├─ Description
      │  │  └─ Global Availability
      │  ├─ Product Links
      │  │  ├─ Features
      │  │  ├─ Pricing
      │  │  ├─ How It Works
      │  │  └─ FAQ
      │  ├─ Company Links
      │  │  ├─ About Us
      │  │  ├─ Blog
      │  │  ├─ Careers
      │  │  └─ Contact
      │  ├─ Legal Links
      │  │  ├─ Privacy Policy
      │  │  ├─ Terms of Service
      │  │  ├─ Security
      │  │  └─ GDPR
      │  └─ (Span 2 columns for Company Info)
      │
      └─ Bottom Bar
         ├─ Copyright
         └─ Trust Badges
            ├─ SOC 2 Certified
            └─ GDPR Compliant
```

---

## Reusable Component Definitions

### ValueCard
```typescript
interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  metric: string;
}
```
**Used in**: ValuePropositionSection (3x)

### StepCard
```typescript
interface StepCardProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}
```
**Used in**: HowItWorksSection (4x)

### FeatureCard
```typescript
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}
```
**Used in**: FeaturesSection (6x)

### SecurityBadge
```typescript
interface SecurityBadgeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}
```
**Used in**: TrustSecuritySection (4x)

### MetricCard
```typescript
interface MetricCardProps {
  number: string;
  label: string;
}
```
**Used in**: SuccessMetricsSection (4x)

### TestimonialCard
```typescript
interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  location: string;
}
```
**Used in**: TestimonialsSection (3x)

---

## External UI Components Used

### From @/components/ui/Button
```typescript
import { Button } from '@/components/ui/Button';
```
**Used in**:
- HeroSection (2x)
- FinalCTASection (1x)

### From @/components/ui/Badge
```typescript
import { Badge } from '@/components/ui/Badge';
```
**Used in**:
- ValueCard component (for metrics)

### From @/components/ui/Card
```typescript
import { Card, CardContent } from '@/components/ui/Card';
```
**Used in**:
- ValueCard (wrapper)
- TestimonialCard (wrapper)

---

## Icons Used (from lucide-react)

| Icon | Usage Location | Count |
|------|---------------|-------|
| ArrowRight | CTAs | 2 |
| Sparkles | Hero badge, Feature card | 2 |
| Zap | Feature, How It Works | 2 |
| Globe | Trust bar, Value prop, Footer | 4 |
| Shield | Trust bar, Security section, Footer | 4 |
| CheckCircle2 | Hero benefits, Security badge | 4 |
| Clock | Value proposition | 1 |
| TrendingUp | How It Works | 1 |
| Lock | Trust bar, Security, Footer | 3 |
| Award | Trust bar, Security | 2 |
| PlayCircle | Secondary CTA | 1 |
| FileText | How It Works, Features | 2 |
| Target | Value prop, How It Works | 2 |
| Briefcase | Features | 1 |

**Total unique icons**: 14
**Total icon instances**: ~31+

---

## Section Layout Grid

| Section | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Hero | 1 col | 1 col | 1 col (centered) |
| Trust Bar | wrap | wrap | 4 inline |
| Value Prop | 1 col | 1 col | 3 cols |
| How It Works | 1 col | 1 col | 1 col (steps) |
| Features | 1 col | 2 cols | 3 cols |
| Security | 1 col | 2 cols | 4 cols |
| Metrics | 1 col | 2 cols | 4 cols |
| Testimonials | 1 col | 1 col | 3 cols |
| Footer | 1 col | 2 cols | 5 cols |

---

## Accessibility Features by Component

### HeroSection
- ✅ `aria-labelledby="hero-heading"`
- ✅ `id="hero-heading"` on h1
- ✅ `aria-label` on buttons
- ✅ `aria-hidden="true"` on icons

### TrustBar
- ✅ `aria-label="Trust indicators"`
- ✅ `aria-hidden="true"` on icons

### All Sections
- ✅ `aria-labelledby` linking to heading IDs
- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ Semantic HTML (`<section>`, `<footer>`)

### Footer
- ✅ `role="contentinfo"`
- ✅ `aria-hidden="true"` on decorative icons

---

## Interactive Elements

### Buttons (3 total)
1. "Start Auto-Applying" (Hero)
   - Links to `/register`
   - Primary style

2. "See How It Works" (Hero)
   - Smooth scrolls to `#how-it-works`
   - Outline style

3. "Get Started Free" (Final CTA)
   - Links to `/register`
   - White on teal background

### Links
- Footer navigation (~16 links)
- All footer links have hover states
- Transition effects on all links

### Hover Effects
- Cards: `hover:shadow-xl`
- Feature cards: `hover:border-teal-300`
- Buttons: `hover:bg-*-700`
- Links: `hover:text-white`

---

## Responsive Behavior

### Breakpoint Transitions

#### Mobile → Tablet (640px)
```
flex-col → sm:flex-row
gap-4 → sm:gap-12
py-16 → sm:py-24
text-4xl → sm:text-5xl
grid → sm:grid-cols-2
```

#### Tablet → Desktop (1024px)
```
grid-cols-2 → lg:grid-cols-3
grid-cols-2 → lg:grid-cols-4
grid-cols-2 → lg:grid-cols-5 (footer)
text-5xl → lg:text-6xl
py-24 → lg:py-32
```

---

## Color Usage by Section

### Hero
- Background: `warmGray-50` → `white` → `teal-50` gradient
- Heading: `charcoal-900`
- Accent: `teal-600`
- Body: `slate-700`

### Trust Bar
- Background: `warmGray-50`
- Text: `warmGray-600`
- Icons: `teal-600`

### Value Proposition
- Background: `white`
- Cards: `white` with `warmGray-200` border
- Icons: `teal-600` on `teal-100` bg

### How It Works
- Background: `warmGray-50`
- Cards: `white`
- Number circles: `teal-600`
- Icon badges: `mutedBlue-500`

### Features
- Background: `white`
- Cards: `white` with hover `border-teal-300`

### Security
- Background: `warmGray-50`
- Badges: `white` with `teal-100` icon bg

### Metrics
- Background: `teal-600`
- Text: `white`
- Subtext: `teal-100`

### Testimonials
- Background: `white`
- Cards: `white` with `warmGray-200` border
- Quote icon: `teal-600`

### Final CTA
- Background: `teal-600` → `teal-700` → `mutedBlue-700` gradient
- Button: `white` bg, `teal-700` text

### Footer
- Background: `charcoal-900`
- Text: `slate-400`
- Headings: `white`
- Accents: `teal-400`

---

## Performance Characteristics

### Component Count
- Main sections: 10
- Reusable components: 6 types
- Total component instances: ~30+

### Code Size
- Total lines: 644
- Average component size: ~50-80 lines
- Largest component: HeroSection (~85 lines)
- Smallest component: MetricCard (~7 lines)

### CSS Classes
- Using Tailwind utilities only
- No custom CSS required
- Purged in production
- Estimated final CSS: < 20kb

---

## Data Flow

### Static Data
All content is currently hardcoded for maximum performance:
- Testimonials (3 items)
- Features (6 items)
- Security badges (4 items)
- Metrics (4 items)
- Steps (4 items)

### Dynamic Elements
- Copyright year: `new Date().getFullYear()`
- Smooth scroll behavior (client-side JS)

### Future: Content Management
Could be extracted to:
```typescript
// data/landing-page.ts
export const testimonials = [...]
export const features = [...]
export const metrics = [...]
```

---

## File References

### Main Implementation
```
apps/web/src/app/page.tsx
```

### UI Components
```
apps/web/src/components/ui/Button.tsx
apps/web/src/components/ui/Card.tsx
apps/web/src/components/ui/Badge.tsx
```

### Configuration
```
apps/web/tailwind.config.ts
```

### Documentation
```
LANDING_PAGE_DESIGN.md
COLOR_PALETTE_REFERENCE.md
HEX_CODES_QUICK_REFERENCE.md
REDESIGN_SUMMARY.md
COMPONENT_TREE.md (this file)
```

---

## Testing Targets

### Component Testing
- [ ] ValueCard renders with all props
- [ ] StepCard displays number correctly
- [ ] FeatureCard shows icon and description
- [ ] SecurityBadge renders badge icon
- [ ] MetricCard displays number/label
- [ ] TestimonialCard shows quote and author

### Integration Testing
- [ ] Hero CTAs navigate/scroll correctly
- [ ] All sections render in order
- [ ] Footer links are valid
- [ ] Responsive breakpoints work

### E2E Testing
- [ ] User can scroll through page
- [ ] CTAs are clickable
- [ ] "See How It Works" scrolls smoothly
- [ ] Footer navigation works

---

**Component Tree Version**: 1.0.0
**Last Updated**: December 2025
**Total Components**: 16 (10 sections + 6 reusable)
**Total Lines of Code**: 644
