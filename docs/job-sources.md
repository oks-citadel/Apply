# Job API Sources Documentation

**Last Updated:** 2025-12-21
**Platform:** ApplyForUs Job Aggregation Platform

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Currently Integrated APIs](#currently-integrated-apis)
3. [Available Free APIs (Not Yet Integrated)](#available-free-apis-not-yet-integrated)
4. [ATS/Employer APIs](#atsemployer-apis)
5. [Government Labor APIs](#government-labor-apis)
6. [Enrichment & Career Data APIs](#enrichment--career-data-apis)
7. [Integration Gaps & Recommendations](#integration-gaps--recommendations)

---

## Executive Summary

The ApplyForUs platform currently integrates **16 job providers** across various categories. This document catalogs all available free/free-tier job APIs, their authentication requirements, rate limits, and integration status.

**Current Integration Coverage:**
- ✅ 16 APIs Integrated
- 🔄 12+ APIs Available for Integration
- 🌍 Global Coverage: US, Europe, UK, Remote-Only

---

## Currently Integrated APIs

### Core Job Aggregators

| Source | API URL | Auth Method | Free Tier Limits | Status | Notes |
|--------|---------|-------------|------------------|--------|-------|
| **Adzuna** | `https://api.adzuna.com/v1/api/jobs` | API Key (app_id + app_key) | 250 requests/min | ✅ Integrated | Falls back to RapidAPI |
| **Jooble** | `https://jooble.org/api/{api_key}` | API Key in URL | 500 requests/min | ✅ Integrated | POST-based search, RapidAPI fallback |
| **CareerJet** | `https://public.api.careerjet.net` | Affiliate ID | 100 requests/min | ✅ Integrated | 90+ countries, RapidAPI fallback |

### Remote-Only Job Boards (FREE - No API Key)

| Source | API URL | Auth Method | Free Tier Limits | Status | Notes |
|--------|---------|-------------|------------------|--------|-------|
| **RemoteOK** | `https://remoteok.com/api` | None | Unlimited (fair use) | ✅ Integrated | 100% free, no key needed |
| **Remotive** | `https://remotive.com/api/remote-jobs` | None | Unlimited (fair use) | ✅ Integrated | 100% free, supports search param |
| **WeWorkRemotely** | `https://weworkremotely.com/categories/*.rss` | None | Unlimited (fair use) | ✅ Integrated | RSS-based, 7 categories |
| **Arbeitnow** | `https://www.arbeitnow.com/api/job-board-api` | None | Unlimited (fair use) | ✅ Integrated | European focus, 100% free |
| **Jobicy** | `https://jobicy.com/api/v2/remote-jobs` | None | Unlimited (fair use) | ✅ Integrated | 100% free, supports tag filtering |
| **The Muse** | `https://www.themuse.com/api/public/jobs` | None | Unlimited (fair use) | ✅ Integrated | 20 jobs/page, career-focused |

### Tech-Focused Job Boards

| Source | API URL | Auth Method | Free Tier Limits | Status | Notes |
|--------|---------|-------------|------------------|--------|-------|
| **Dice** | RapidAPI/Scraping | RapidAPI Key | Varies | ✅ Integrated | Tech jobs, US-focused |
| **Talent** | Custom/Regional | Varies | Varies | ✅ Integrated | Regional tech jobs |

### General Job Boards (Scraping/RapidAPI)

| Source | API URL | Auth Method | Free Tier Limits | Status | Notes |
|--------|---------|-------------|------------------|--------|-------|
| **Indeed** | RapidAPI/Scraping | RapidAPI Key | Varies | ✅ Integrated | Largest job board |
| **LinkedIn** | RapidAPI/Scraping | RapidAPI Key | Varies | ✅ Integrated | Professional network jobs |
| **Glassdoor** | RapidAPI/Scraping | RapidAPI Key | Varies | ✅ Integrated | Jobs + company reviews |
| **ZipRecruiter** | RapidAPI/Scraping | RapidAPI Key | Varies | ✅ Integrated | US job aggregator |
| **SimplyHired** | RapidAPI/Scraping | RapidAPI Key | Varies | ✅ Integrated | Job aggregator |

**Note:** RapidAPI integrations typically offer free tiers with limited requests (50-500/month).

---

## Available Free APIs (Not Yet Integrated)

### 1. JSearch API (RapidAPI)

| Property | Details |
|----------|---------|
| **URL** | `https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch` |
| **Auth** | RapidAPI Key |
| **Free Tier** | Generous free tier, no credit card for testing |
| **Coverage** | Google for Jobs aggregator (Indeed, LinkedIn, Glassdoor, ZipRecruiter, Dice, etc.) |
| **Response Time** | 1-3 seconds |
| **Data Points** | 30+ fields per job |
| **Rate Limit** | Varies by RapidAPI subscription |
| **Best For** | Single API for multiple sources, real-time data from Google Jobs |

**Key Features:**
- Aggregates from all major job boards via Google for Jobs
- Salary information included
- Real-time job postings
- Comprehensive search/filter capabilities

**Integration Priority:** 🔥 **HIGH** - Single API replaces multiple sources

---

### 2. Reed.co.uk API (UK Jobs)

| Property | Details |
|----------|---------|
| **URL** | `https://www.reed.co.uk/developers` |
| **Auth** | API Key (free registration) |
| **Free Tier** | 1,000 requests/day per key |
| **Coverage** | UK job market |
| **Recruiter API** | 2,000 requests/hour (customizable) |
| **Rate Limit** | 1,000/day (Jobseeker), 2,000/hour (Recruiter) |
| **Best For** | UK-specific job searches |

**Required Parameters:**
- `keywords` (required)
- `location` (optional)
- `minimumSalary` (optional)
- `maximumSalary` (optional)
- `postedWithin` (optional)

**Response Fields:**
- Job listings with title, employer, location, salary, description
- Application URLs
- Posted date

**Integration Priority:** 🔥 **HIGH** - Major UK market coverage

---

### 3. USAJobs API (US Government Jobs)

| Property | Details |
|----------|---------|
| **URL** | `https://data.usajobs.gov/api/Search` |
| **Auth** | API Key (free registration at developer.usajobs.gov) |
| **Free Tier** | Completely free, requires API key |
| **Coverage** | All US federal government jobs |
| **Rate Limit** | Not publicly specified (generous for free tier) |
| **Best For** | US government job seekers |

**Available Endpoints:**
- `/api/Search` - Search job announcements
- Historic JOAs endpoint
- Announcement Text endpoint

**Required Headers:**
- `Authorization-Key`: Your API key
- `User-Agent`: Your app identifier (required)

**Search Parameters:**
- Keywords
- Location
- Pay grade
- Organization
- Date posted

**Integration Priority:** 🔥 **HIGH** - Government jobs are unique market segment

---

### 4. Fantastic Jobs API

| Property | Details |
|----------|---------|
| **URL** | `https://fantastic.jobs/api` |
| **Auth** | API Key |
| **Free Tier** | Trial available |
| **Coverage** | 10+ million jobs/month |
| **Best For** | High-volume job aggregation |

**Integration Priority:** 🟡 **MEDIUM** - Evaluate pricing vs. JSearch

---

### 5. GitHub Jobs API Alternatives

**Note:** GitHub Jobs API was deprecated in May 2021. Alternatives include:

- **JobApis** (Open Source): PHP-based multi-board client
- **Arbeitnow** (Already integrated ✅)
- **Remotive** (Already integrated ✅)
- **JSearch via RapidAPI** (Recommended replacement)

---

## ATS/Employer APIs

### 1. Greenhouse Job Board API (FREE - Public Jobs)

| Property | Details |
|----------|---------|
| **URL** | `https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs` |
| **Auth** | None for GET (public jobs), Basic Auth for POST |
| **Free Tier** | Completely free for public job listings |
| **Coverage** | Companies using Greenhouse ATS |
| **Rate Limit** | None specified for public endpoints |
| **Best For** | Tech companies, startups |

**Endpoints:**
- `GET /v1/boards/{board_token}/jobs` - List all jobs
- `GET /v1/boards/{board_token}/jobs/{job_id}` - Job details
- `POST /v1/boards/{board_token}/jobs/{job_id}/apply` - Submit application (requires auth)

**Response Fields:**
- Job ID, title, location, description
- Department, office information
- Custom fields (configurable by employer)
- Application questions

**Integration Priority:** 🔥 **HIGH** - No auth required, direct from employers

---

### 2. Lever Postings API (FREE - Public Jobs)

| Property | Details |
|----------|---------|
| **URL** | `https://api.lever.co/v0/postings/{clientname}` |
| **Auth** | None for public postings |
| **Free Tier** | Completely free for public job listings |
| **Coverage** | Companies using Lever ATS |
| **Rate Limit** | Fair use policy |
| **Best For** | Tech companies, scale-ups |

**Output Formats:**
- JSON (`Accept: application/json` or `?mode=json`)
- HTML (default, embeddable)
- iframe-ready HTML

**Filter Options:**
- Location (OR'ed when multiple, case-sensitive)
- Single job ID

**Response Fields:**
- Job ID, title, description
- Location, commitment (full-time/part-time/etc.)
- Team/department
- Workplace type (on-site/remote/hybrid)
- Salary info (optional: currency, interval, min, max)

**Integration Priority:** 🔥 **HIGH** - No auth required, direct from employers

---

### 3. SmartRecruiters Posting API (FREE - Public Jobs)

| Property | Details |
|----------|---------|
| **URL** | `https://api.smartrecruiters.com/v1/companies/{companyIdentifier}/postings` |
| **Auth** | None for public postings |
| **Free Tier** | Free for public job listings |
| **Coverage** | Companies using SmartRecruiters |
| **Rate Limit** | Not specified for public API |

**Query Parameters:**
- `query` - Keyword search
- `limit` - Results per page
- `offset` - Pagination
- `country`, `region`, `city`, `department` - Filters

**Integration Priority:** 🟡 **MEDIUM** - Good for custom career sites

---

### 4. Workable Public API (FREE - Public Jobs)

| Property | Details |
|----------|---------|
| **URL** | `https://www.workable.com/api/accounts/{subdomain}?details=true` |
| **Auth** | None for public endpoints |
| **Free Tier** | Public endpoints are free |
| **Coverage** | Companies using Workable ATS |
| **Rate Limit** | None specified for public endpoints |

**Public Endpoints (No Auth):**
- `/api/accounts/{subdomain}?details=true` - Jobs with descriptions
- `/api/accounts/{subdomain}/locations` - All job locations
- `/api/accounts/{subdomain}/departments` - All departments

**Integration Priority:** 🟡 **MEDIUM** - Limited to published jobs only

---

### 5. TeamTailor API

| Property | Details |
|----------|---------|
| **URL** | Company-specific career pages |
| **Auth** | Varies (mostly public pages) |
| **Free Tier** | Public job pages are scrapable |
| **Coverage** | European companies primarily |
| **Best For** | European market |

**Integration Priority:** 🟢 **LOW** - Limited API, scraping required

---

## Government Labor APIs

### 1. USAJobs API (Federal Jobs)

**See [Available Free APIs](#3-usajobs-api-us-government-jobs) section above**

**Integration Priority:** 🔥 **HIGH**

---

### 2. Canada Job Bank

| Property | Details |
|----------|---------|
| **URL** | `https://www.jobbank.gc.ca` |
| **Auth** | No official API |
| **Free Tier** | N/A |
| **Coverage** | Canadian federal jobs |
| **Access Method** | Web scraping only |

**Status:** ❌ **No Official API Available**

**Alternatives:**
- Lightcast Canada Jobs API (paid third-party)
- Web scraping (community-built scrapers available on GitHub)

**Integration Priority:** 🟢 **LOW** - Requires scraping infrastructure

---

### 3. UK ONS (Office for National Statistics)

| Property | Details |
|----------|---------|
| **URL** | No job board API |
| **Coverage** | Labor market statistics only |
| **Best For** | Market research, not job listings |

**Status:** ❌ Not applicable for job listings

---

## Enrichment & Career Data APIs

### 1. O*NET Web Services API (FREE)

| Property | Details |
|----------|---------|
| **URL** | `https://services.onetcenter.org/` |
| **Auth** | API Key (free registration) |
| **Free Tier** | Completely free (attribution required) |
| **Coverage** | 900+ occupations, 500+ data points per occupation |
| **Sponsor** | US Department of Labor |
| **Updates** | Quarterly |
| **Users** | 5,100+ registered |

**Features:**
- Keyword search for occupations
- Career reports (My Next Move format)
- Military job code translation
- Spanish language support (Mi Próximo Paso)
- Skills, knowledge, abilities data
- Salary outlook information
- Technology skills examples

**Use Cases:**
- Job matching/recommendation engine
- Skills extraction
- Career path suggestions
- Salary estimation enhancement
- Military-to-civilian transitions

**Integration Priority:** 🔥 **HIGH** - Essential for job enrichment & matching

---

### 2. Salary Estimation APIs

**Options:**
- **Glassdoor API** (Already integrated via RapidAPI ✅)
- **Payscale** (Paid only)
- **Salary.com API** (Paid only)
- **Bureau of Labor Statistics** (Free, but aggregated data, not API-friendly)

**Integration Priority:** 🟡 **MEDIUM** - Glassdoor already provides salary data

---

## Integration Gaps & Recommendations

### High Priority (Recommended for Immediate Integration)

| API | Reason | Estimated Effort | Business Value |
|-----|--------|-----------------|----------------|
| **JSearch (RapidAPI)** | Single API for all major boards via Google Jobs | Medium | Very High - Reduces API management |
| **Reed UK** | Major UK market coverage (1M+ jobs) | Low | High - Geographic expansion |
| **USAJobs** | Unique government job segment | Low | High - Niche market |
| **Greenhouse** | No auth, direct from employers, tech-focused | Low | High - High-quality jobs |
| **Lever** | No auth, direct from employers, tech-focused | Low | High - High-quality jobs |
| **O*NET** | Career enrichment, skills matching | Medium | Very High - Improves matching |

### Medium Priority (Good to Have)

| API | Reason | Estimated Effort | Business Value |
|-----|--------|-----------------|----------------|
| **SmartRecruiters** | Public jobs from major employers | Low | Medium |
| **Workable** | Public jobs from scale-ups | Low | Medium |
| **Fantastic Jobs** | High volume aggregation | Medium | Medium - Evaluate vs JSearch |

### Low Priority (Future Consideration)

| API | Reason | Estimated Effort | Business Value |
|-----|--------|-----------------|----------------|
| **TeamTailor** | Limited API, scraping needed | High | Low |
| **Canada Job Bank** | No official API | High | Low - Scraping required |
| **Payscale/Salary.com** | Paid only | N/A | Low - Already have Glassdoor |

---

## API Integration Checklist

When integrating a new API, ensure:

- [ ] **Authentication:** API key secured in environment variables
- [ ] **Rate Limiting:** Implement respect for rate limits
- [ ] **Error Handling:** Fallback mechanisms for API failures
- [ ] **Data Normalization:** Map to standard `RawJobData` interface
- [ ] **Caching:** Implement Redis caching (already in place ✅)
- [ ] **Health Checks:** Add health check endpoint
- [ ] **Testing:** Unit tests for provider
- [ ] **Documentation:** Update this document
- [ ] **Monitoring:** Add to Prometheus/Grafana dashboards

---

## Current Provider Architecture

**Location:** `/services/job-service/src/modules/aggregator/providers/`

**Interface:** `JobProvider` from `job-provider.interface.ts`

**Required Methods:**
```typescript
interface JobProvider {
  getName(): string;
  fetchJobs(params?: JobSearchParams): Promise<RawJobData[]>;
  fetchJobDetails(externalId: string): Promise<RawJobData>;
  normalizeJob(rawJob: RawJobData): Partial<Job>;
  healthCheck(): Promise<boolean>;
}
```

**Current Providers:**
1. adzuna.provider.ts
2. arbeitnow.provider.ts
3. careerjet.provider.ts
4. dice.provider.ts
5. glassdoor.provider.ts
6. indeed.provider.ts
7. jobicy.provider.ts
8. jooble.provider.ts
9. linkedin.provider.ts
10. remoteok.provider.ts
11. remotive.provider.ts
12. simplyhired.provider.ts
13. talent.provider.ts
14. themuse.provider.ts
15. weworkremotely.provider.ts
16. ziprecruiter.provider.ts

---

## Next Steps

1. **Prioritize JSearch Integration:** Single API to replace/supplement multiple sources
2. **Add Geographic Coverage:** Reed (UK), USAJobs (US Gov)
3. **Enhance with ATS APIs:** Greenhouse + Lever (no auth barriers)
4. **Implement O*NET Integration:** Career matching & skills enrichment
5. **Monitor RapidAPI Usage:** Optimize free tier usage across all RapidAPI providers

---

## References & Sources

### Research Sources
- [Public APIs - Jobs Category](https://publicapis.dev/category/jobs)
- [Arbeitnow Job Board API](https://www.arbeitnow.com/blog/job-board-api)
- [USAJobs API Reference](https://developer.usajobs.gov/api-reference/)
- [Reed.co.uk Developers](https://www.reed.co.uk/developers)
- [JSearch API on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
- [Greenhouse Job Board API](https://developers.greenhouse.io/job-board.html)
- [Lever Postings API](https://github.com/lever/postings-api)
- [SmartRecruiters API Platform](https://developers.smartrecruiters.com/)
- [Workable API Documentation](https://help.workable.com/hc/en-us/articles/115013356548-Workable-API-Documentation)
- [O*NET Web Services](https://services.onetcenter.org/)
- [JobApis Open Source](https://jobapis.github.io/open-source/)

---

**Document Maintained By:** Data Integration Architecture Team
**Contact:** tech@applyforus.com
**Version:** 1.0.0
**Last Review:** 2025-12-21
