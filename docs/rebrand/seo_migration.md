# ApplyforUs SEO Migration Guide

Version 1.0 | Last Updated: December 2025

## Overview

This guide covers SEO considerations and implementation steps for the ApplyforUs rebrand to maintain and improve search engine visibility.

## URL Redirect Mapping

### Domain Migration (if applicable)

**If migrating from jobpilot.com to applyforus.com:**

#### 301 Permanent Redirects

```nginx
# nginx configuration
server {
    listen 80;
    listen 443 ssl;
    server_name jobpilot.com www.jobpilot.com;

    ssl_certificate /etc/ssl/certs/jobpilot.crt;
    ssl_certificate_key /etc/ssl/private/jobpilot.key;

    # Redirect all traffic to new domain
    return 301 https://applyforus.com$request_uri;
}

# Or use rewrite for more control
server {
    listen 80;
    listen 443 ssl;
    server_name jobpilot.com www.jobpilot.com;

    # Specific redirects
    rewrite ^/about$ https://applyforus.com/about permanent;
    rewrite ^/features$ https://applyforus.com/features permanent;
    rewrite ^/pricing$ https://applyforus.com/pricing permanent;
    rewrite ^/blog/(.*)$ https://applyforus.com/blog/$1 permanent;

    # Catch-all redirect
    rewrite ^/(.*)$ https://applyforus.com/$1 permanent;
}
```

### Key Page Redirects

| Old URL (JobPilot) | New URL (ApplyforUs) | Type |
|-------------------|---------------------|------|
| jobpilot.com | applyforus.com | 301 |
| www.jobpilot.com | www.applyforus.com | 301 |
| jobpilot.com/about | applyforus.com/about | 301 |
| jobpilot.com/features | applyforus.com/features | 301 |
| jobpilot.com/pricing | applyforus.com/pricing | 301 |
| jobpilot.com/blog/* | applyforus.com/blog/* | 301 |
| jobpilot.com/contact | applyforus.com/contact | 301 |
| jobpilot.com/careers | applyforus.com/careers | 301 |

### Subdomain Redirects

```nginx
# API subdomain
server {
    listen 443 ssl;
    server_name api.jobpilot.com;
    return 301 https://api.applyforus.com$request_uri;
}

# App subdomain
server {
    listen 443 ssl;
    server_name app.jobpilot.com;
    return 301 https://app.applyforus.com$request_uri;
}

# Blog subdomain
server {
    listen 443 ssl;
    server_name blog.jobpilot.com;
    return 301 https://applyforus.com/blog$request_uri;
}
```

### Testing Redirects

```bash
# Test redirect
curl -I https://jobpilot.com

# Should return:
# HTTP/1.1 301 Moved Permanently
# Location: https://applyforus.com/

# Test specific pages
curl -I https://jobpilot.com/about
curl -I https://jobpilot.com/features
curl -I https://jobpilot.com/blog/post-slug
```

## Sitemap Updates

### Generate New Sitemap

**File:** `public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>https://applyforus.com/</loc>
    <lastmod>2025-12-08</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Main Pages -->
  <url>
    <loc>https://applyforus.com/features</loc>
    <lastmod>2025-12-08</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://applyforus.com/pricing</loc>
    <lastmod>2025-12-08</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://applyforus.com/about</loc>
    <lastmod>2025-12-08</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Blog Posts -->
  <!-- Add blog post URLs dynamically -->
</urlset>
```

### Dynamic Sitemap Generation (Next.js)

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://applyforus.com';

  // Static pages
  const routes = ['', '/features', '/pricing', '/about', '/contact'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic blog posts
  const posts = await getBlogPosts();
  const postRoutes = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...routes, ...postRoutes];
}
```

### Sitemap Index

**For large sites with multiple sitemaps:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://applyforus.com/sitemap-pages.xml</loc>
    <lastmod>2025-12-08</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://applyforus.com/sitemap-blog.xml</loc>
    <lastmod>2025-12-08</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://applyforus.com/sitemap-jobs.xml</loc>
    <lastmod>2025-12-08</lastmod>
  </sitemap>
</sitemapindex>
```

## robots.txt Changes

### Updated robots.txt

**File:** `public/robots.txt`

```txt
# https://applyforus.com/robots.txt

User-agent: *
Allow: /

# Disallow admin pages
Disallow: /admin/
Disallow: /api/

# Disallow user-specific pages
Disallow: /dashboard/
Disallow: /profile/

# Allow specific API endpoints for crawling
Allow: /api/jobs/public
Allow: /api/blog/public

# Sitemap
Sitemap: https://applyforus.com/sitemap.xml
Sitemap: https://applyforus.com/sitemap-blog.xml
Sitemap: https://applyforus.com/sitemap-jobs.xml

# Crawl delay (optional)
Crawl-delay: 1

# Old domain redirect notice (temporary)
# Users should now access: https://applyforus.com
```

### robots.txt for Old Domain

```txt
# https://jobpilot.com/robots.txt

User-agent: *
Disallow: /

# Redirect notice
# This domain has moved to https://applyforus.com
# All pages permanently redirect to the new domain
```

## Meta Tag Templates

### Homepage Meta Tags

```typescript
// app/page.tsx
export const metadata = {
  title: 'ApplyforUs - Apply Smarter, Not Harder',
  description: 'Intelligent job application automation that saves time and improves quality. Let AI handle the busywork while you focus on finding the right opportunity.',
  keywords: 'job application, automation, AI, resume, career, job search, apply',
  authors: [{ name: 'ApplyforUs' }],
  openGraph: {
    title: 'ApplyforUs - Apply Smarter, Not Harder',
    description: 'Intelligent job application automation',
    url: 'https://applyforus.com',
    siteName: 'ApplyforUs',
    images: [
      {
        url: 'https://applyforus.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ApplyforUs - Apply Smarter, Not Harder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ApplyforUs - Apply Smarter, Not Harder',
    description: 'Intelligent job application automation',
    creator: '@applyforus',
    images: ['https://applyforus.com/twitter-image.jpg'],
  },
  alternates: {
    canonical: 'https://applyforus.com',
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

### Blog Post Meta Tags

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);

  return {
    title: `${post.title} | ApplyforUs Blog`,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://applyforus.com/blog/${post.slug}`,
      siteName: 'ApplyforUs',
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
    alternates: {
      canonical: `https://applyforus.com/blog/${post.slug}`,
    },
  };
}
```

### Product Pages

```typescript
// app/features/page.tsx
export const metadata = {
  title: 'Features | ApplyforUs',
  description: 'Discover how ApplyforUs uses AI to automate job applications, optimize resumes, and help you land your dream job faster.',
  keywords: 'job automation, AI resume, auto-apply, job matching',
  openGraph: {
    title: 'ApplyforUs Features',
    description: 'AI-powered job application automation',
    url: 'https://applyforus.com/features',
  },
  alternates: {
    canonical: 'https://applyforus.com/features',
  },
};
```

## Structured Data Updates

### Organization Schema

```typescript
// components/StructuredData.tsx
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ApplyforUs',
    alternateName: 'ApplyforUs Platform',
    url: 'https://applyforus.com',
    logo: 'https://applyforus.com/logo.png',
    description: 'Intelligent job application automation platform',
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1-555-123-4567',
      contactType: 'Customer Service',
      email: 'support@applyforus.com',
      availableLanguage: ['English'],
    },
    sameAs: [
      'https://twitter.com/applyforus',
      'https://linkedin.com/company/applyforus',
      'https://facebook.com/applyforus',
      'https://instagram.com/applyforus',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### SoftwareApplication Schema

```typescript
export function SoftwareApplicationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ApplyforUs',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1250',
    },
    description: 'AI-powered job application automation platform',
    featureList: [
      'Automated job applications',
      'AI resume optimization',
      'Job matching',
      'Application tracking',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### Article Schema (Blog Posts)

```typescript
export function ArticleSchema({ post }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ApplyforUs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://applyforus.com/logo.png',
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

### FAQ Schema

```typescript
export function FAQSchema({ faqs }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

## Google Search Console Setup

### Add New Property

1. **Go to Google Search Console**
   - https://search.google.com/search-console

2. **Add Property**
   - Add `https://applyforus.com`
   - Verify ownership (DNS TXT record or HTML file)

3. **Submit Sitemap**
   - Submit `https://applyforus.com/sitemap.xml`
   - Monitor indexing status

4. **Set Preferred Domain**
   - Set `applyforus.com` as canonical domain
   - Configure www redirect

### Verification Methods

**DNS Verification:**
```txt
# Add TXT record to DNS
applyforus.com TXT "google-site-verification=xxxxxxxxxxxx"
```

**HTML File Verification:**
```html
<!-- public/google-verification.html -->
google-site-verification: googlexxxxxxxxxxxx.html
```

**Meta Tag Verification:**
```html
<meta name="google-site-verification" content="xxxxxxxxxxxx" />
```

### URL Inspection

After deployment, inspect key URLs:
- https://applyforus.com
- https://applyforus.com/features
- https://applyforus.com/pricing
- https://applyforus.com/about

### Change of Address Tool

**If migrating domains:**

1. Go to Google Search Console
2. Select old property (jobpilot.com)
3. Settings > Change of Address
4. Select new property (applyforus.com)
5. Confirm 301 redirects are in place
6. Submit change

## Analytics Migration

### Google Analytics 4

```typescript
// lib/gtag.ts
export const GA_TRACKING_ID = 'G-XXXXXXXXXX'; // New ApplyforUs GA4 ID

// Page view tracking
export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Event tracking
export const event = ({ action, category, label, value }) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
```

**Implementation:**

```typescript
// app/layout.tsx
import Script from 'next/script';
import { GA_TRACKING_ID } from '@/lib/gtag';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Track Rebrand Success

```typescript
// Track rebrand-specific events
import { event } from '@/lib/gtag';

// Track when users see new branding
event({
  action: 'rebrand_viewed',
  category: 'Rebrand',
  label: 'Homepage',
});

// Track user reactions
event({
  action: 'rebrand_feedback',
  category: 'Rebrand',
  label: 'Positive',
  value: 1,
});
```

## Content Updates

### Brand Name Replacement

**Search and replace in all content:**

```bash
# Find all occurrences
grep -r "JobPilot" content/
grep -r "jobpilot" content/

# Replace (carefully!)
find content/ -type f -exec sed -i 's/JobPilot/ApplyforUs/g' {} +
find content/ -type f -exec sed -i 's/jobpilot/applyforus/g' {} +
```

### Update Internal Links

```bash
# Update internal links in content
find content/ -type f -exec sed -i 's/jobpilot.com/applyforus.com/g' {} +
```

### Blog Post Updates

For each blog post:
- [ ] Update brand references
- [ ] Update internal links
- [ ] Update images with logo
- [ ] Update author bios
- [ ] Republish with new date (optional)

## SEO Monitoring Checklist

### Pre-Launch

- [ ] Redirects configured and tested
- [ ] Sitemap generated and submitted
- [ ] robots.txt updated
- [ ] Meta tags updated on all pages
- [ ] Structured data updated
- [ ] Google Search Console property created
- [ ] Analytics tracking configured
- [ ] Canonical URLs set correctly

### Post-Launch (Week 1)

- [ ] Monitor Google Search Console for errors
- [ ] Check indexing status
- [ ] Verify redirects are working
- [ ] Monitor organic traffic (expect temporary dip)
- [ ] Check rankings for key terms
- [ ] Monitor crawl errors

### Post-Launch (Week 2-4)

- [ ] Track ranking recovery
- [ ] Monitor backlink profile
- [ ] Check for 404 errors
- [ ] Verify all pages indexed
- [ ] Review search appearance
- [ ] Monitor Core Web Vitals

### Ongoing (Monthly)

- [ ] Review search performance
- [ ] Update content as needed
- [ ] Build new backlinks
- [ ] Monitor competitors
- [ ] Optimize underperforming pages

## Performance Optimization

### Core Web Vitals

**Maintain performance during rebrand:**

```typescript
// Optimize images
import Image from 'next/image';

<Image
  src="/logo.svg"
  alt="ApplyforUs"
  width={200}
  height={50}
  priority
/>

// Preload critical assets
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

// Lazy load non-critical content
<Image
  src="/feature-image.jpg"
  alt="Feature"
  width={800}
  height={600}
  loading="lazy"
/>
```

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Contact:** seo@applyforus.com
