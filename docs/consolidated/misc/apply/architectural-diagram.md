# JobPilot AI — Architectural Diagrams

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Client Architecture](#client-architecture)
4. [Backend Services Architecture](#backend-services-architecture)
5. [AI/ML Pipeline Architecture](#aiml-pipeline-architecture)
6. [Auto-Apply Engine Architecture](#auto-apply-engine-architecture)
7. [Data Flow Architecture](#data-flow-architecture)
8. [Security Architecture](#security-architecture)
9. [Infrastructure Architecture](#infrastructure-architecture)
10. [Integration Architecture](#integration-architecture)

---

## System Overview

JobPilot AI is built on a modern, event-driven microservices architecture designed for:

- **Scalability:** Handle millions of applications per day
- **Reliability:** 99.9% uptime SLA with automatic failover
- **Security:** Enterprise-grade with SOC 2 Type II compliance
- **Performance:** Sub-second AI responses, real-time updates

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLIENT LAYER                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Web App   │  │  iOS App    │  │ Android App │  │  Chrome Ext │  │ Firefox Ext │   │
│  │  Next.js 14 │  │React Native │  │React Native │  │Manifest V3  │  │ WebExtension│   │
│  │  App Router │  │  Expo 51    │  │  Expo 51    │  │             │  │             │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │                │          │
│         └────────────────┴────────────────┴────────────────┴────────────────┘          │
│                                           │                                             │
└───────────────────────────────────────────┼─────────────────────────────────────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │      EDGE NETWORK         │
                              │   CloudFlare / AWS CF     │
                              │  ┌─────────────────────┐  │
                              │  │ • CDN               │  │
                              │  │ • WAF               │  │
                              │  │ • DDoS Protection   │  │
                              │  │ • SSL Termination   │  │
                              │  │ • Bot Management    │  │
                              │  └─────────────────────┘  │
                              └─────────────┬─────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │     LOAD BALANCER         │
                              │   AWS ALB / NGINX Plus    │
                              │  ┌─────────────────────┐  │
                              │  │ • Health Checks     │  │
                              │  │ • Auto Scaling      │  │
                              │  │ • Session Affinity  │  │
                              │  │ • Rate Limiting     │  │
                              │  └─────────────────────┘  │
                              └─────────────┬─────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
          ┌─────────▼─────────┐   ┌─────────▼─────────┐   ┌─────────▼─────────┐
          │   API GATEWAY     │   │   WEBSOCKET SVC   │   │   GRAPHQL SVC     │
          │     (NestJS)      │   │   (Socket.io)     │   │    (Apollo)       │
          │  ┌─────────────┐  │   │  ┌─────────────┐  │   │  ┌─────────────┐  │
          │  │ REST API    │  │   │  │ Real-time   │  │   │  │ Queries     │  │
          │  │ Auth        │  │   │  │ Events      │  │   │  │ Mutations   │  │
          │  │ Validation  │  │   │  │ Presence    │  │   │  │ Subscriptions│ │
          │  │ Rate Limit  │  │   │  │ Notifications│ │   │  │ Federation  │  │
          │  └─────────────┘  │   │  └─────────────┘  │   │  └─────────────┘  │
          └─────────┬─────────┘   └─────────┬─────────┘   └─────────┬─────────┘
                    │                       │                       │
                    └───────────────────────┼───────────────────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │      MESSAGE QUEUE        │
                              │    RabbitMQ / AWS SQS     │
                              │  ┌─────────────────────┐  │
                              │  │ • Event Bus         │  │
                              │  │ • Job Queue         │  │
                              │  │ • Dead Letter Queue │  │
                              │  │ • Priority Queues   │  │
                              │  └─────────────────────┘  │
                              └─────────────┬─────────────┘
                                            │
    ┌───────────┬───────────┬───────────────┼───────────────┬───────────┬───────────┐
    │           │           │               │               │           │           │
┌───▼───┐  ┌────▼────┐  ┌───▼───┐  ┌────────▼────────┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│ Auth  │  │ Resume  │  │  Job  │  │   Auto-Apply    │  │  AI   │  │Analyt-│  │Notifi-│
│Service│  │ Service │  │Service│  │    Service      │  │Service│  │  ics  │  │cation │
│       │  │         │  │       │  │                 │  │       │  │Service│  │Service│
│Node.js│  │ Node.js │  │Node.js│  │ Python/Selenium │  │FastAPI│  │Python │  │Node.js│
└───┬───┘  └────┬────┘  └───┬───┘  └────────┬────────┘  └───┬───┘  └───┬───┘  └───┬───┘
    │           │           │               │               │           │           │
    └───────────┴───────────┴───────────────┼───────────────┴───────────┴───────────┘
                                            │
                              ┌─────────────▼─────────────┐
                              │        DATA LAYER         │
    ┌─────────────────────────┼─────────────────────────┐ │
    │                         │                         │ │
┌───▼────────────┐  ┌─────────▼─────────┐  ┌───────────▼──────────┐
│   PostgreSQL   │  │      Redis        │  │    Elasticsearch     │
│   (Primary)    │  │   (Cache/Queue)   │  │    (Search/Index)    │
│ ┌────────────┐ │  │ ┌───────────────┐ │  │ ┌──────────────────┐ │
│ │ Users      │ │  │ │ Sessions      │ │  │ │ Job Listings     │ │
│ │ Resumes    │ │  │ │ Rate Limits   │ │  │ │ Resume Content   │ │
│ │ Jobs       │ │  │ │ Job Cache     │ │  │ │ Application Log  │ │
│ │ Applications│ │  │ │ Real-time Data│ │  │ │ Analytics Data   │ │
│ │ Analytics  │ │  │ │ Pub/Sub       │ │  │ │ Full-Text Search │ │
│ └────────────┘ │  │ └───────────────┘ │  │ └──────────────────┘ │
└────────────────┘  └───────────────────┘  └──────────────────────┘
        │                     │                       │
        └─────────────────────┼───────────────────────┘
                              │
                ┌─────────────▼─────────────┐
                │      OBJECT STORAGE       │
                │        AWS S3             │
                │ ┌─────────────────────┐   │
                │ │ Resume Files (PDF)  │   │
                │ │ Profile Images      │   │
                │ │ Generated Documents │   │
                │ │ Backup Data         │   │
                │ │ Static Assets       │   │
                │ └─────────────────────┘   │
                └───────────────────────────┘
```

---

## Client Architecture

### Web Application (Next.js 14)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WEB APPLICATION (Next.js 14)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         APP ROUTER                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │  (auth)/           │  (dashboard)/        │  (marketing)/       │ │  │
│  │  │  ├─ login/         │  ├─ page.tsx         │  ├─ page.tsx        │ │  │
│  │  │  ├─ register/      │  ├─ resumes/         │  ├─ pricing/        │ │  │
│  │  │  ├─ forgot/        │  │  ├─ page.tsx      │  ├─ features/       │ │  │
│  │  │  └─ layout.tsx     │  │  ├─ [id]/         │  ├─ blog/           │ │  │
│  │  │                    │  │  └─ new/          │  └─ layout.tsx      │ │  │
│  │  │                    │  ├─ jobs/            │                     │ │  │
│  │  │                    │  ├─ applications/    │                     │ │  │
│  │  │                    │  ├─ analytics/       │                     │ │  │
│  │  │                    │  ├─ settings/        │                     │ │  │
│  │  │                    │  └─ layout.tsx       │                     │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       COMPONENT LAYER                                 │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │  │
│  │  │   UI/Base      │  │   Features     │  │   Layouts      │          │  │
│  │  │  ├─ Button     │  │  ├─ Resume     │  │  ├─ Header     │          │  │
│  │  │  ├─ Input      │  │  │  Builder    │  │  ├─ Sidebar    │          │  │
│  │  │  ├─ Card       │  │  ├─ Job        │  │  ├─ Footer     │          │  │
│  │  │  ├─ Modal      │  │  │  Matcher    │  │  ├─ Dashboard  │          │  │
│  │  │  ├─ Table      │  │  ├─ Analytics  │  │  └─ Auth       │          │  │
│  │  │  └─ ...        │  │  │  Dashboard  │  │                │          │  │
│  │  │                │  │  └─ AutoApply  │  │                │          │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        STATE MANAGEMENT                               │  │
│  │  ┌────────────────────────────────────────────────────────────────┐  │  │
│  │  │   Zustand Stores                    │   TanStack Query         │  │  │
│  │  │  ┌─────────────┐ ┌─────────────┐   │  ┌─────────────────────┐ │  │  │
│  │  │  │ authStore   │ │ uiStore     │   │  │ useResumes()        │ │  │  │
│  │  │  │ userStore   │ │ resumeStore │   │  │ useJobs()           │ │  │  │
│  │  │  │ settingsStore│└─────────────┘   │  │ useApplications()   │ │  │  │
│  │  │  └─────────────┘                   │  │ useAnalytics()      │ │  │  │
│  │  │                                    │  └─────────────────────┘ │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         SERVICE LAYER                                 │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │  │
│  │  │   API Client   │  │   WebSocket    │  │   Local        │          │  │
│  │  │  ├─ auth.ts    │  │   Client       │  │   Storage      │          │  │
│  │  │  ├─ resumes.ts │  │  ├─ connect()  │  │  ├─ drafts     │          │  │
│  │  │  ├─ jobs.ts    │  │  ├─ subscribe()│  │  ├─ cache      │          │  │
│  │  │  └─ ...        │  │  └─ emit()     │  │  └─ prefs      │          │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Application (React Native + Expo)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MOBILE APPLICATION (React Native)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      NAVIGATION (React Navigation)                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │   Root Navigator                                                 │ │  │
│  │  │   ├─ Auth Stack                                                  │ │  │
│  │  │   │   ├─ LoginScreen                                             │ │  │
│  │  │   │   ├─ RegisterScreen                                          │ │  │
│  │  │   │   └─ ForgotPasswordScreen                                    │ │  │
│  │  │   │                                                              │ │  │
│  │  │   └─ Main Tab Navigator                                          │ │  │
│  │  │       ├─ Dashboard Tab                                           │ │  │
│  │  │       │   └─ Dashboard Stack                                     │ │  │
│  │  │       │       ├─ HomeScreen                                      │ │  │
│  │  │       │       └─ NotificationsScreen                             │ │  │
│  │  │       │                                                          │ │  │
│  │  │       ├─ Jobs Tab                                                │ │  │
│  │  │       │   └─ Jobs Stack                                          │ │  │
│  │  │       │       ├─ JobSearchScreen                                 │ │  │
│  │  │       │       ├─ JobDetailScreen                                 │ │  │
│  │  │       │       └─ SavedJobsScreen                                 │ │  │
│  │  │       │                                                          │ │  │
│  │  │       ├─ Resumes Tab                                             │ │  │
│  │  │       │   └─ Resumes Stack                                       │ │  │
│  │  │       │       ├─ ResumeListScreen                                │ │  │
│  │  │       │       └─ ResumeDetailScreen                              │ │  │
│  │  │       │                                                          │ │  │
│  │  │       ├─ Applications Tab                                        │ │  │
│  │  │       │   └─ Applications Stack                                  │ │  │
│  │  │       │       ├─ ApplicationsScreen                              │ │  │
│  │  │       │       └─ ApplicationDetailScreen                         │ │  │
│  │  │       │                                                          │ │  │
│  │  │       └─ Settings Tab                                            │ │  │
│  │  │           └─ Settings Stack                                      │ │  │
│  │  │               ├─ SettingsScreen                                  │ │  │
│  │  │               ├─ ProfileScreen                                   │ │  │
│  │  │               └─ SubscriptionScreen                              │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         NATIVE MODULES                                │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │  │
│  │  │ Push Notif. │ │ Biometric   │ │ Document    │ │ Share       │    │  │
│  │  │ (Expo)      │ │ Auth        │ │ Picker      │ │ Extension   │    │  │
│  │  │             │ │ (Face/Touch)│ │             │ │             │    │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         OFFLINE SUPPORT                               │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │   AsyncStorage        │   SQLite (Watermelon)   │   NetInfo     │ │  │
│  │  │  ├─ User Prefs        │  ├─ Cached Jobs         │  ├─ Online    │ │  │
│  │  │  ├─ Auth Tokens       │  ├─ Draft Resumes       │  ├─ Offline   │ │  │
│  │  │  └─ Settings          │  ├─ Applications        │  └─ Sync Queue│ │  │
│  │  │                       │  └─ Search History      │               │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Browser Extension Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BROWSER EXTENSION (Manifest V3)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      SERVICE WORKER (Background)                      │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                                                                  │ │  │
│  │  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │  │
│  │  │   │  Message    │  │  AutoFill   │  │  Job        │             │ │  │
│  │  │   │  Handler    │  │  Engine     │  │  Scraper    │             │ │  │
│  │  │   │             │  │             │  │             │             │ │  │
│  │  │   │ ├─ popup    │  │ ├─ detect   │  │ ├─ parse    │             │ │  │
│  │  │   │ ├─ content  │  │ ├─ map      │  │ ├─ extract  │             │ │  │
│  │  │   │ └─ external │  │ ├─ fill     │  │ └─ save     │             │ │  │
│  │  │   │             │  │ └─ submit   │  │             │             │ │  │
│  │  │   └─────────────┘  └─────────────┘  └─────────────┘             │ │  │
│  │  │                                                                  │ │  │
│  │  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │ │  │
│  │  │   │  API        │  │  Storage    │  │  Alarm      │             │ │  │
│  │  │   │  Client     │  │  Manager    │  │  Scheduler  │             │ │  │
│  │  │   │             │  │             │  │             │             │ │  │
│  │  │   │ ├─ auth     │  │ ├─ local    │  │ ├─ sync     │             │ │  │
│  │  │   │ ├─ sync     │  │ ├─ session  │  │ ├─ clean    │             │ │  │
│  │  │   │ └─ webhooks │  │ └─ cache    │  │ └─ notify   │             │ │  │
│  │  │   └─────────────┘  └─────────────┘  └─────────────┘             │ │  │
│  │  │                                                                  │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      CONTENT SCRIPTS                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                                                                  │ │  │
│  │  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │ │  │
│  │  │   │  Form Detector  │  │  Value Injector │  │  DOM Observer   │ │ │  │
│  │  │   │                 │  │                 │  │                 │ │ │  │
│  │  │   │ ├─ findForms()  │  │ ├─ injectValue()│  │ ├─ observe()    │ │ │  │
│  │  │   │ ├─ mapFields()  │  │ ├─ selectOption│  │ ├─ onChange()   │ │ │  │
│  │  │   │ ├─ detectATS()  │  │ ├─ uploadFile() │  │ └─ onSubmit()  │ │ │  │
│  │  │   │ └─ getConfidence│ │ └─ triggerEvent│  │                 │ │ │  │
│  │  │   └─────────────────┘  └─────────────────┘  └─────────────────┘ │ │  │
│  │  │                                                                  │ │  │
│  │  │   Injected on: Job boards, Company career pages, ATS platforms   │ │  │
│  │  │                                                                  │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         POPUP UI (React)                              │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │   ┌───────────────────────────────────────────────────────────┐ │ │  │
│  │  │   │  Header: Logo + User Avatar + Settings                     │ │ │  │
│  │  │   ├───────────────────────────────────────────────────────────┤ │ │  │
│  │  │   │                                                           │ │ │  │
│  │  │   │  ┌─────────────────────────────────────────────────────┐ │ │ │  │
│  │  │   │  │  Current Page Status                                │ │ │ │  │
│  │  │   │  │  [✓] Job posting detected                           │ │ │ │  │
│  │  │   │  │  Company: Acme Corp                                 │ │ │ │  │
│  │  │   │  │  Position: Senior Software Engineer                 │ │ │ │  │
│  │  │   │  └─────────────────────────────────────────────────────┘ │ │ │  │
│  │  │   │                                                           │ │ │  │
│  │  │   │  ┌─────────────────────────────────────────────────────┐ │ │ │  │
│  │  │   │  │  Quick Actions                                      │ │ │ │  │
│  │  │   │  │  [Save Job] [Auto-Fill] [Quick Apply]               │ │ │ │  │
│  │  │   │  └─────────────────────────────────────────────────────┘ │ │ │  │
│  │  │   │                                                           │ │ │  │
│  │  │   │  ┌─────────────────────────────────────────────────────┐ │ │ │  │
│  │  │   │  │  Resume Selection                                   │ │ │ │  │
│  │  │   │  │  [ ] Master Resume                                  │ │ │ │  │
│  │  │   │  │  [●] Tech-focused Resume                            │ │ │ │  │
│  │  │   │  │  [ ] Leadership Resume                              │ │ │ │  │
│  │  │   │  └─────────────────────────────────────────────────────┘ │ │ │  │
│  │  │   │                                                           │ │ │  │
│  │  │   │  ┌─────────────────────────────────────────────────────┐ │ │ │  │
│  │  │   │  │  ATS Score: 87/100                                  │ │ │ │  │
│  │  │   │  │  [████████░░] Match: Strong                         │ │ │ │  │
│  │  │   │  └─────────────────────────────────────────────────────┘ │ │ │  │
│  │  │   │                                                           │ │ │  │
│  │  │   ├───────────────────────────────────────────────────────────┤ │ │  │
│  │  │   │  Footer: Today's Apps: 12/25 | [Open Dashboard]          │ │ │  │
│  │  │   └───────────────────────────────────────────────────────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Backend Services Architecture

### Microservices Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND MICROSERVICES                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            AUTH SERVICE (Node.js/NestJS)                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Responsibilities:                                                       │    │   │
│  │  │  • User authentication (email/password, OAuth)                           │    │   │
│  │  │  • Token management (JWT access/refresh)                                 │    │   │
│  │  │  • Session management                                                    │    │   │
│  │  │  • Password reset flow                                                   │    │   │
│  │  │  • Multi-factor authentication                                           │    │   │
│  │  │  • API key management                                                    │    │   │
│  │  │                                                                          │    │   │
│  │  │  Dependencies: PostgreSQL, Redis                                         │    │   │
│  │  │  External: Google OAuth, LinkedIn OAuth, SendGrid                        │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          RESUME SERVICE (Node.js/NestJS)                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Responsibilities:                                                       │    │   │
│  │  │  • Resume CRUD operations                                                │    │   │
│  │  │  • Version management                                                    │    │   │
│  │  │  • Template management                                                   │    │   │
│  │  │  • Export to PDF/DOCX/TXT                                                │    │   │
│  │  │  • A/B variant creation                                                  │    │   │
│  │  │  • Resume parsing (upload existing)                                      │    │   │
│  │  │                                                                          │    │   │
│  │  │  Dependencies: PostgreSQL, S3, AI Service                                │    │   │
│  │  │  External: PDFKit, Docx-templater                                        │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            JOB SERVICE (Node.js/NestJS)                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Responsibilities:                                                       │    │   │
│  │  │  • Job aggregation from multiple sources                                 │    │   │
│  │  │  • Job deduplication                                                     │    │   │
│  │  │  • Job enrichment (salary, company info)                                 │    │   │
│  │  │  • Job search & filtering                                                │    │   │
│  │  │  • Saved jobs management                                                 │    │   │
│  │  │  • Job matching coordination                                             │    │   │
│  │  │                                                                          │    │   │
│  │  │  Dependencies: PostgreSQL, Elasticsearch, Redis                          │    │   │
│  │  │  External: LinkedIn API, Indeed API, Glassdoor API                       │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         AUTO-APPLY SERVICE (Python/FastAPI)                      │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Responsibilities:                                                       │    │   │
│  │  │  • Headless browser management (Playwright/Selenium)                     │    │   │
│  │  │  • ATS adapter management (10,000+ sites)                                │    │   │
│  │  │  • Form field detection & mapping                                        │    │   │
│  │  │  • Automated form completion                                             │    │   │
│  │  │  • CAPTCHA handling (2Captcha integration)                               │    │   │
│  │  │  • Application queue processing                                          │    │   │
│  │  │  • Retry & failure handling                                              │    │   │
│  │  │                                                                          │    │   │
│  │  │  Dependencies: RabbitMQ, Redis, PostgreSQL                               │    │   │
│  │  │  External: Playwright, 2Captcha, Anti-detect browsers                    │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            AI SERVICE (Python/FastAPI)                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Responsibilities:                                                       │    │   │
│  │  │  • Resume content generation (GPT-4, Claude)                             │    │   │
│  │  │  • Cover letter generation                                               │    │   │
│  │  │  • Job matching (semantic + ML)                                          │    │   │
│  │  │  • ATS scoring                                                           │    │   │
│  │  │  • Interview question generation                                         │    │   │
│  │  │  • Salary estimation                                                     │    │   │
│  │  │  • Resume tailoring to job descriptions                                  │    │   │
│  │  │                                                                          │    │   │
│  │  │  Dependencies: Redis, PostgreSQL, Vector DB                              │    │   │
│  │  │  External: OpenAI API, Anthropic API, Pinecone/Weaviate                  │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                        ANALYTICS SERVICE (Python/FastAPI)                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Responsibilities:                                                       │    │   │
│  │  │  • Application tracking metrics                                          │    │   │
│  │  │  • Resume performance analytics                                          │    │   │
│  │  │  • A/B test result analysis                                              │    │   │
│  │  │  • Conversion funnel tracking                                            │    │   │
│  │  │  • Report generation                                                     │    │   │
│  │  │  • Predictive success modeling                                           │    │   │
│  │  │                                                                          │    │   │
│  │  │  Dependencies: PostgreSQL, Elasticsearch, Redis                          │    │   │
│  │  │  External: Datadog, Mixpanel                                             │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                      NOTIFICATION SERVICE (Node.js/NestJS)                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Responsibilities:                                                       │    │   │
│  │  │  • Email notifications (SendGrid)                                        │    │   │
│  │  │  • SMS notifications (Twilio)                                            │    │   │
│  │  │  • Push notifications (Firebase)                                         │    │   │
│  │  │  • In-app notifications (WebSocket)                                      │    │   │
│  │  │  • Notification preferences management                                   │    │   │
│  │  │  • Digest/summary generation                                             │    │   │
│  │  │                                                                          │    │   │
│  │  │  Dependencies: RabbitMQ, Redis, PostgreSQL                               │    │   │
│  │  │  External: SendGrid, Twilio, Firebase FCM                                │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## AI/ML Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                AI/ML PIPELINE                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              INPUT LAYER                                          │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │   Resume    │  │    Job      │  │   User      │  │  Historical │              │  │
│  │  │   Data      │  │ Description │  │  Profile    │  │    Data     │              │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │  │
│  │         │                │                │                │                      │  │
│  │         └────────────────┴────────────────┴────────────────┘                      │  │
│  │                                   │                                               │  │
│  └───────────────────────────────────┼───────────────────────────────────────────────┘  │
│                                      │                                                  │
│  ┌───────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                           PREPROCESSING LAYER                                      │  │
│  │                                                                                    │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐        │  │
│  │  │   Text Cleaning     │  │   Entity Extraction │  │   Normalization     │        │  │
│  │  │  • HTML removal     │  │  • Skills           │  │  • Dates            │        │  │
│  │  │  • Tokenization     │  │  • Job Titles       │  │  • Locations        │        │  │
│  │  │  • Stop words       │  │  • Companies        │  │  • Salaries         │        │  │
│  │  │  • Lemmatization    │  │  • Education        │  │  • Experience       │        │  │
│  │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘        │  │
│  │                                                                                    │  │
│  └───────────────────────────────────┬───────────────────────────────────────────────┘  │
│                                      │                                                  │
│  ┌───────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                            EMBEDDING LAYER                                         │  │
│  │                                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        Vector Embedding Generation                           │  │  │
│  │  │                                                                              │  │  │
│  │  │   Resume ──▶ OpenAI Ada-002 ──▶ 1536-dim vector ──▶ ┌────────────────┐      │  │  │
│  │  │                                                      │                │      │  │  │
│  │  │   Job Desc ──▶ OpenAI Ada-002 ──▶ 1536-dim vector ──▶│   Pinecone/    │      │  │  │
│  │  │                                                      │   Weaviate     │      │  │  │
│  │  │   Skills ──▶ Custom Encoder ──▶ 256-dim vector ──▶   │   Vector DB    │      │  │  │
│  │  │                                                      │                │      │  │  │
│  │  │                                                      └────────────────┘      │  │  │
│  │  │                                                                              │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                    │  │
│  └───────────────────────────────────┬───────────────────────────────────────────────┘  │
│                                      │                                                  │
│  ┌───────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                              ML MODELS LAYER                                       │  │
│  │                                                                                    │  │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐              │  │
│  │  │   JOB MATCHING    │  │   ATS SCORING     │  │   SUCCESS PRED.   │              │  │
│  │  │                   │  │                   │  │                   │              │  │
│  │  │  • Cosine Sim.    │  │  • Keyword Match  │  │  • XGBoost        │              │  │
│  │  │  • Neural Ranker  │  │  • Format Check   │  │  • Historical     │              │  │
│  │  │  • Career Path    │  │  • Section Score  │  │    Data           │              │  │
│  │  │    Alignment      │  │  • Length Score   │  │  • Feature Eng.   │              │  │
│  │  │                   │  │                   │  │                   │              │  │
│  │  │  Output: 0-100    │  │  Output: 0-100    │  │  Output: 0-100%   │              │  │
│  │  │  match score      │  │  ATS score        │  │  probability      │              │  │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────┘              │  │
│  │                                                                                    │  │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐              │  │
│  │  │   CONTENT GEN.    │  │  SALARY PREDICT.  │  │   SKILL GAP       │              │  │
│  │  │                   │  │                   │  │                   │              │  │
│  │  │  • GPT-4          │  │  • Regression     │  │  • Classification │              │  │
│  │  │  • Claude 3       │  │  • Market Data    │  │  • Course Reco.   │              │  │
│  │  │  • Fine-tuned     │  │  • Location Adj.  │  │  • Priority Rank  │              │  │
│  │  │    models         │  │                   │  │                   │              │  │
│  │  │                   │  │  Output: Salary   │  │  Output: Skills   │              │  │
│  │  │  Output: Text     │  │  range estimate   │  │  to develop       │              │  │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────┘              │  │
│  │                                                                                    │  │
│  └───────────────────────────────────┬───────────────────────────────────────────────┘  │
│                                      │                                                  │
│  ┌───────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                            OUTPUT LAYER                                            │  │
│  │                                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                         Response Formatting                                   │  │  │
│  │  │                                                                              │  │  │
│  │  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │  │  │
│  │  │   │ Matched Jobs│   │  Optimized  │   │  Cover      │   │  Analytics  │     │  │  │
│  │  │   │   (ranked)  │   │   Resume    │   │   Letter    │   │   Report    │     │  │  │
│  │  │   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘     │  │  │
│  │  │                                                                              │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Auto-Apply Engine Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTO-APPLY ENGINE                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           APPLICATION QUEUE                                       │  │
│  │                                                                                   │  │
│  │   ┌─────────────────────────────────────────────────────────────────────────┐    │  │
│  │   │                        RabbitMQ Queues                                   │    │  │
│  │   │                                                                          │    │  │
│  │   │   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │    │  │
│  │   │   │ Priority     │   │  Standard    │   │    Retry     │                │    │  │
│  │   │   │  Queue       │   │   Queue      │   │    Queue     │                │    │  │
│  │   │   │ (Enterprise) │   │ (Pro/Exec)   │   │ (Failed)     │                │    │  │
│  │   │   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                │    │  │
│  │   │          │                  │                  │                         │    │  │
│  │   │          └──────────────────┼──────────────────┘                         │    │  │
│  │   │                             │                                            │    │  │
│  │   └─────────────────────────────┼────────────────────────────────────────────┘    │  │
│  │                                 │                                                 │  │
│  └─────────────────────────────────┼─────────────────────────────────────────────────┘  │
│                                    │                                                    │
│  ┌─────────────────────────────────▼─────────────────────────────────────────────────┐  │
│  │                          WORKER POOL                                               │  │
│  │                                                                                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │  │
│  │  │  Worker 1  │  │  Worker 2  │  │  Worker 3  │  │  Worker N  │  │  Worker N+1│  │  │
│  │  │            │  │            │  │            │  │            │  │            │  │  │
│  │  │ Playwright │  │ Playwright │  │ Playwright │  │ Playwright │  │ Playwright │  │  │
│  │  │  Browser   │  │  Browser   │  │  Browser   │  │  Browser   │  │  Browser   │  │  │
│  │  │            │  │            │  │            │  │            │  │            │  │  │
│  │  │ ┌────────┐ │  │ ┌────────┐ │  │ ┌────────┐ │  │ ┌────────┐ │  │ ┌────────┐ │  │  │
│  │  │ │ Chromium│ │  │ │ Firefox│ │  │ │ Chromium│ │  │ │ Firefox│ │  │ │ Chromium│ │  │  │
│  │  │ │Headless │ │  │ │Headless│ │  │ │Headless │ │  │ │Headless│ │  │ │Headless │ │  │  │
│  │  │ └────────┘ │  │ └────────┘ │  │ └────────┘ │  │ └────────┘ │  │ └────────┘ │  │  │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘  └────────────┘  │  │
│  │                                                                                    │  │
│  └────────────────────────────────────┬───────────────────────────────────────────────┘  │
│                                       │                                                  │
│  ┌────────────────────────────────────▼───────────────────────────────────────────────┐  │
│  │                          ATS ADAPTER LAYER                                          │  │
│  │                                                                                     │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │                    Adapter Selection Engine                                  │   │  │
│  │  │                                                                              │   │  │
│  │  │   URL Pattern ──▶ ATS Detection ──▶ Adapter Selection ──▶ Form Mapping      │   │  │
│  │  │                                                                              │   │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                     │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │  │
│  │  │  Workday  │ │ Greenhouse│ │   Lever   │ │   Taleo   │ │ iCIMS     │            │  │
│  │  │  Adapter  │ │  Adapter  │ │  Adapter  │ │  Adapter  │ │ Adapter   │            │  │
│  │  │           │ │           │ │           │ │           │ │           │            │  │
│  │  │ • Login   │ │ • Parse   │ │ • OAuth   │ │ • Multi-  │ │ • Profile │            │  │
│  │  │ • Forms   │ │ • Submit  │ │ • Apply   │ │   page    │ │   import  │            │  │
│  │  │ • Upload  │ │ • Track   │ │ • Track   │ │ • Upload  │ │ • Submit  │            │  │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘            │  │
│  │                                                                                     │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐            │  │
│  │  │ SmartRecr.│ │ Jobvite   │ │  BambooHR │ │ SuccessF. │ │  Generic  │            │  │
│  │  │  Adapter  │ │  Adapter  │ │  Adapter  │ │  Adapter  │ │  Adapter  │            │  │
│  │  │           │ │           │ │           │ │           │ │           │            │  │
│  │  │ • AI form │ │ • Custom  │ │ • Simple  │ │ • Complex │ │ • ML-based│            │  │
│  │  │   detect  │ │   fields  │ │   forms   │ │   flow    │ │   mapping │            │  │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘            │  │
│  │                                                                                     │  │
│  │  Total ATS Adapters: 10,000+                                                        │  │
│  │                                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         APPLICATION FLOW                                            │  │
│  │                                                                                     │  │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │  │
│  │   │  1. Load │───▶│ 2. Detect│───▶│ 3. Fill  │───▶│4. Upload │───▶│5. Submit │    │  │
│  │   │   Page   │    │   ATS    │    │   Form   │    │  Resume  │    │   Apply  │    │  │
│  │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    │  │
│  │        │              │              │              │              │              │  │
│  │        ▼              ▼              ▼              ▼              ▼              │  │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │  │
│  │   │ Navigate │    │  Match   │    │  Map     │    │  Select  │    │  Verify  │    │  │
│  │   │ to URL   │    │ Adapter  │    │  Fields  │    │  File    │    │  Success │    │  │
│  │   │          │    │          │    │          │    │          │    │          │    │  │
│  │   │ Handle   │    │ Handle   │    │ Handle   │    │ Handle   │    │ Screenshot│   │  │
│  │   │ Redirects│    │ Login    │    │ Dropdowns│    │ Format   │    │ & Log    │    │  │
│  │   └──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘    │  │
│  │                                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         CAPTCHA HANDLING                                            │  │
│  │                                                                                     │  │
│  │   ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │                                                                              │  │  │
│  │   │   CAPTCHA Detected ──▶ Type Detection ──▶ Solver Selection ──▶ Solve        │  │  │
│  │   │                                                                              │  │  │
│  │   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                       │  │  │
│  │   │   │  reCAPTCHA  │   │  hCaptcha   │   │  Image      │                       │  │  │
│  │   │   │  v2/v3      │   │             │   │  Based      │                       │  │  │
│  │   │   │             │   │             │   │             │                       │  │  │
│  │   │   │  2Captcha   │   │  Anti-      │   │  AI Vision  │                       │  │  │
│  │   │   │  Service    │   │  Captcha    │   │  Model      │                       │  │  │
│  │   │   └─────────────┘   └─────────────┘   └─────────────┘                       │  │  │
│  │   │                                                                              │  │  │
│  │   └─────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               DATA FLOW DIAGRAM                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         USER REGISTRATION FLOW                                   │   │
│  │                                                                                  │   │
│  │   User ──▶ Web/Mobile ──▶ API Gateway ──▶ Auth Service ──▶ PostgreSQL           │   │
│  │    │                          │                │              │                  │   │
│  │    │                          ▼                ▼              │                  │   │
│  │    │                    Rate Limiter      SendGrid ────────▶ Email              │   │
│  │    │                          │          (verification)                          │   │
│  │    │                          ▼                                                  │   │
│  │    └──────────────────▶ Redis (session)                                         │   │
│  │                                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         RESUME CREATION FLOW                                     │   │
│  │                                                                                  │   │
│  │   User Input ──▶ Web App ──▶ API Gateway ──▶ Resume Service                     │   │
│  │                                                    │                             │   │
│  │                                   ┌────────────────┼────────────────┐            │   │
│  │                                   ▼                ▼                ▼            │   │
│  │                              PostgreSQL       AI Service         S3             │   │
│  │                              (metadata)      (generation)      (files)          │   │
│  │                                   │                │                │            │   │
│  │                                   │                ▼                │            │   │
│  │                                   │          OpenAI/Claude         │            │   │
│  │                                   │                │                │            │   │
│  │                                   └────────────────┼────────────────┘            │   │
│  │                                                    │                             │   │
│  │                                                    ▼                             │   │
│  │                                              WebSocket ──▶ Real-time Update     │   │
│  │                                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         AUTO-APPLY FLOW                                          │   │
│  │                                                                                  │   │
│  │   User Trigger ──▶ API Gateway ──▶ Job Service ──▶ RabbitMQ (queue)             │   │
│  │                                         │               │                        │   │
│  │                                         ▼               ▼                        │   │
│  │                                   AI Service     Auto-Apply Service             │   │
│  │                                   (tailoring)          │                        │   │
│  │                                         │               ▼                        │   │
│  │                                         └─────▶ Browser Pool                     │   │
│  │                                                         │                        │   │
│  │                                                         ▼                        │   │
│  │                                                  Employer Website               │   │
│  │                                                         │                        │   │
│  │                                                         ▼                        │   │
│  │   PostgreSQL ◀── Analytics ◀── Status Update ◀── Submit Result                 │   │
│  │        │              │                                                          │   │
│  │        ▼              ▼                                                          │   │
│  │   Elasticsearch  Notification Service ──▶ Push/Email/SMS                        │   │
│  │                                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         JOB MATCHING FLOW                                        │   │
│  │                                                                                  │   │
│  │   Job Sources ──▶ Job Service (scrapers) ──▶ Deduplication ──▶ Enrichment       │   │
│  │   (Indeed,         │                              │               │              │   │
│  │    LinkedIn,       ▼                              ▼               ▼              │   │
│  │    etc.)      Elasticsearch               AI Service        PostgreSQL          │   │
│  │                    │                      (embeddings)           │              │   │
│  │                    │                           │                 │              │   │
│  │                    │                           ▼                 │              │   │
│  │                    │                      Vector DB              │              │   │
│  │                    │                      (Pinecone)             │              │   │
│  │                    │                           │                 │              │   │
│  │                    └───────────────────────────┼─────────────────┘              │   │
│  │                                                │                                │   │
│  │   User Profile ──▶ AI Service ──▶ Similarity Search ──▶ Ranked Results         │   │
│  │                                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY ARCHITECTURE                                       │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         PERIMETER SECURITY                                        │  │
│  │                                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │  │
│  │  │ CloudFlare  │  │    WAF      │  │   DDoS      │  │    Bot      │             │  │
│  │  │    CDN      │  │  (OWASP)    │  │ Protection  │  │  Management │             │  │
│  │  │             │  │             │  │             │  │             │             │  │
│  │  │ • SSL/TLS   │  │ • SQL Inj.  │  │ • Rate Lim. │  │ • CAPTCHA   │             │  │
│  │  │ • Caching   │  │ • XSS       │  │ • IP Block  │  │ • Challenge │             │  │
│  │  │ • Minify    │  │ • CSRF      │  │ • Geo Block │  │ • Scoring   │             │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      AUTHENTICATION & AUTHORIZATION                               │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                                                                              │ │  │
│  │  │   User ──▶ Login ──▶ Auth Service ──▶ JWT (Access + Refresh)                │ │  │
│  │  │                          │                                                   │ │  │
│  │  │              ┌───────────┴───────────┐                                       │ │  │
│  │  │              ▼                       ▼                                       │ │  │
│  │  │         Password Auth           OAuth 2.0                                   │ │  │
│  │  │         │                       │                                           │ │  │
│  │  │         ▼                       ▼                                           │ │  │
│  │  │    bcrypt + salt          Google/LinkedIn                                   │ │  │
│  │  │         │                       │                                           │ │  │
│  │  │         └───────────┬───────────┘                                           │ │  │
│  │  │                     ▼                                                        │ │  │
│  │  │               MFA (TOTP/SMS)                                                │ │  │
│  │  │                     │                                                        │ │  │
│  │  │                     ▼                                                        │ │  │
│  │  │             Session Management                                               │ │  │
│  │  │             (Redis + JWT)                                                    │ │  │
│  │  │                                                                              │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                     ROLE-BASED ACCESS CONTROL (RBAC)                        │ │  │
│  │  │                                                                              │ │  │
│  │  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │ │  │
│  │  │   │   Guest     │   │    User     │   │    Admin    │   │ Super Admin │    │ │  │
│  │  │   │             │   │             │   │             │   │             │    │ │  │
│  │  │   │ • View jobs │   │ • All Guest │   │ • All User  │   │ • All Admin │    │ │  │
│  │  │   │ • Register  │   │ • CRUD own  │   │ • User mgmt │   │ • System    │    │ │  │
│  │  │   │             │   │   data      │   │ • Analytics │   │   config    │    │ │  │
│  │  │   │             │   │ • Apply     │   │ • Reports   │   │ • Billing   │    │ │  │
│  │  │   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘    │ │  │
│  │  │                                                                              │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         DATA SECURITY                                             │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    ENCRYPTION                                                │ │  │
│  │  │                                                                              │ │  │
│  │  │   At Rest:                          In Transit:                              │ │  │
│  │  │   • AES-256 (database)              • TLS 1.3                                │ │  │
│  │  │   • Server-side encryption (S3)     • Certificate pinning (mobile)          │ │  │
│  │  │   • Encrypted backups               • HSTS                                   │ │  │
│  │  │                                                                              │ │  │
│  │  │   Application Level:                                                         │ │  │
│  │  │   • Field-level encryption (PII)                                             │ │  │
│  │  │   • Tokenization (payment data)                                              │ │  │
│  │  │   • Key rotation (AWS KMS)                                                   │ │  │
│  │  │                                                                              │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    DATA PRIVACY                                              │ │  │
│  │  │                                                                              │ │  │
│  │  │   • GDPR Compliance (EU users)                                               │ │  │
│  │  │   • CCPA Compliance (CA users)                                               │ │  │
│  │  │   • Data minimization                                                        │ │  │
│  │  │   • Right to deletion                                                        │ │  │
│  │  │   • Data portability                                                         │ │  │
│  │  │   • Consent management                                                       │ │  │
│  │  │   • Privacy-by-design                                                        │ │  │
│  │  │                                                                              │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                      MONITORING & INCIDENT RESPONSE                               │  │
│  │                                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │  │
│  │  │   SIEM      │  │  Intrusion  │  │  Audit      │  │  Incident   │             │  │
│  │  │  (Datadog)  │  │  Detection  │  │   Logs      │  │  Response   │             │  │
│  │  │             │  │             │  │             │  │             │             │  │
│  │  │ • Real-time │  │ • Anomaly   │  │ • All API   │  │ • Playbooks │             │  │
│  │  │   alerts    │  │   detection │  │   calls     │  │ • On-call   │             │  │
│  │  │ • Dashboard │  │ • Pattern   │  │ • User      │  │ • Post-     │             │  │
│  │  │ • Reports   │  │   matching  │  │   actions   │  │   mortem    │             │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         COMPLIANCE                                                │  │
│  │                                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │  │
│  │  │  SOC 2      │  │    GDPR     │  │    CCPA     │  │  ISO 27001  │             │  │
│  │  │  Type II    │  │             │  │             │  │  (planned)  │             │  │
│  │  │             │  │             │  │             │  │             │             │  │
│  │  │ • Annual    │  │ • DPO       │  │ • Privacy   │  │ • ISMS      │             │  │
│  │  │   audit     │  │ • DPIA      │  │   notice    │  │ • Risk      │             │  │
│  │  │ • Controls  │  │ • Consent   │  │ • Opt-out   │  │   mgmt      │             │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           AWS INFRASTRUCTURE                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              VPC (10.0.0.0/16)                                     │  │
│  │                                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  PUBLIC SUBNETS (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24)                    │  │  │
│  │  │                                                                             │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │  │  │
│  │  │  │   NAT GW    │  │   NAT GW    │  │   NAT GW    │                         │  │  │
│  │  │  │   (AZ-a)    │  │   (AZ-b)    │  │   (AZ-c)    │                         │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘                         │  │  │
│  │  │                                                                             │  │  │
│  │  │  ┌─────────────────────────────────────────────────────────────────────┐   │  │  │
│  │  │  │                    APPLICATION LOAD BALANCER                         │   │  │  │
│  │  │  │                                                                      │   │  │  │
│  │  │  │   • HTTPS (443) ──▶ Target Groups                                    │   │  │  │
│  │  │  │   • HTTP (80) ──▶ Redirect to HTTPS                                  │   │  │  │
│  │  │  │   • WebSocket (wss://) ──▶ WS Target Group                           │   │  │  │
│  │  │  │                                                                      │   │  │  │
│  │  │  └─────────────────────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                                             │  │  │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  PRIVATE SUBNETS (10.0.10.0/24, 10.0.20.0/24, 10.0.30.0/24)                │  │  │
│  │  │                                                                             │  │  │
│  │  │  ┌─────────────────────────────────────────────────────────────────────┐   │  │  │
│  │  │  │                    EKS CLUSTER (Kubernetes 1.29)                     │   │  │  │
│  │  │  │                                                                      │   │  │  │
│  │  │  │  ┌───────────────────────────────────────────────────────────────┐  │   │  │  │
│  │  │  │  │  NODE GROUP 1 (General)         NODE GROUP 2 (ML/AI)          │  │   │  │  │
│  │  │  │  │  ┌─────────┐ ┌─────────┐        ┌─────────┐ ┌─────────┐      │  │   │  │  │
│  │  │  │  │  │ m6i.xl  │ │ m6i.xl  │        │g4dn.xl  │ │g4dn.xl  │      │  │   │  │  │
│  │  │  │  │  │         │ │         │        │ (GPU)   │ │ (GPU)   │      │  │   │  │  │
│  │  │  │  │  │ API     │ │ Web     │        │ AI Svc  │ │ ML Jobs │      │  │   │  │  │
│  │  │  │  │  │ Auth    │ │ Resume  │        │         │ │         │      │  │   │  │  │
│  │  │  │  │  │ Job     │ │ Notif   │        │         │ │         │      │  │   │  │  │
│  │  │  │  │  └─────────┘ └─────────┘        └─────────┘ └─────────┘      │  │   │  │  │
│  │  │  │  │                                                               │  │   │  │  │
│  │  │  │  │  NODE GROUP 3 (Auto-Apply)                                    │  │   │  │  │
│  │  │  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │  │   │  │  │
│  │  │  │  │  │ c6i.2xl │ │ c6i.2xl │ │ c6i.2xl │ │ c6i.2xl │            │  │   │  │  │
│  │  │  │  │  │         │ │         │ │         │ │         │            │  │   │  │  │
│  │  │  │  │  │ Browser │ │ Browser │ │ Browser │ │ Browser │            │  │   │  │  │
│  │  │  │  │  │ Workers │ │ Workers │ │ Workers │ │ Workers │            │  │   │  │  │
│  │  │  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │  │   │  │  │
│  │  │  │  └───────────────────────────────────────────────────────────────┘  │   │  │  │
│  │  │  │                                                                      │   │  │  │
│  │  │  └─────────────────────────────────────────────────────────────────────┘   │  │  │
│  │  │                                                                             │  │  │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                   │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  DATA SUBNETS (10.0.100.0/24, 10.0.110.0/24, 10.0.120.0/24)                │  │  │
│  │  │                                                                             │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │  │  │
│  │  │  │    RDS      │  │ ElastiCache │  │ OpenSearch  │                         │  │  │
│  │  │  │ PostgreSQL  │  │   Redis     │  │  Cluster    │                         │  │  │
│  │  │  │             │  │             │  │             │                         │  │  │
│  │  │  │ db.r6g.xl   │  │ cache.r6g   │  │ m6g.large   │                         │  │  │
│  │  │  │ Multi-AZ    │  │ .large      │  │ 3 nodes     │                         │  │  │
│  │  │  │ Read Replica│  │ Cluster     │  │             │                         │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘                         │  │  │
│  │  │                                                                             │  │  │
│  │  └────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          EXTERNAL SERVICES                                        │  │
│  │                                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │  │
│  │  │     S3      │  │   SQS       │  │   CloudWatch│  │    Secrets  │             │  │
│  │  │   Buckets   │  │   Queues    │  │   Logs      │  │   Manager   │             │  │
│  │  │             │  │             │  │             │  │             │             │  │
│  │  │ • Assets    │  │ • App Queue │  │ • App Logs  │  │ • API Keys  │             │  │
│  │  │ • Resumes   │  │ • DLQ       │  │ • Metrics   │  │ • DB Creds  │             │  │
│  │  │ • Backups   │  │             │  │ • Alarms    │  │ • Secrets   │             │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL INTEGRATIONS                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           AI/ML PROVIDERS                                         │  │
│  │                                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                   │  │
│  │  │     OpenAI      │  │    Anthropic    │  │    Pinecone     │                   │  │
│  │  │                 │  │                 │  │                 │                   │  │
│  │  │ • GPT-4         │  │ • Claude 3      │  │ • Vector DB     │                   │  │
│  │  │ • GPT-4 Vision  │  │ • Claude 3 Opus │  │ • Embeddings    │                   │  │
│  │  │ • Ada-002       │  │                 │  │ • Similarity    │                   │  │
│  │  │   (embeddings)  │  │                 │  │   Search        │                   │  │
│  │  │                 │  │                 │  │                 │                   │  │
│  │  │ Usage: Resume   │  │ Usage: Content  │  │ Usage: Job      │                   │  │
│  │  │ generation,     │  │ generation,     │  │ matching,       │                   │  │
│  │  │ cover letters   │  │ optimization    │  │ resume search   │                   │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                   │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                          JOB BOARD INTEGRATIONS                                   │  │
│  │                                                                                   │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │  │
│  │  │  LinkedIn   │ │   Indeed    │ │  Glassdoor  │ │   ZipRecr.  │ │   Monster   │ │  │
│  │  │             │ │             │ │             │ │             │ │             │ │  │
│  │  │ • Jobs API  │ │ • Jobs API  │ │ • Jobs API  │ │ • Jobs API  │ │ • Jobs API  │ │  │
│  │  │ • OAuth     │ │ • Scraping  │ │ • Scraping  │ │ • Partner   │ │ • Partner   │ │  │
│  │  │ • Profile   │ │             │ │ • Company   │ │             │ │             │ │  │
│  │  │   Import    │ │             │ │   Data      │ │             │ │             │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         PAYMENT & BILLING                                         │  │
│  │                                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                            Stripe                                            │ │  │
│  │  │                                                                              │ │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │  │
│  │  │  │ Payments    │  │ Subscript.  │  │ Invoicing   │  │  Webhooks   │         │ │  │
│  │  │  │             │  │             │  │             │  │             │         │ │  │
│  │  │  │ • Cards     │  │ • Plans     │  │ • Auto      │  │ • payment_  │         │ │  │
│  │  │  │ • ACH       │  │ • Trials    │  │   billing   │  │   succeeded │         │ │  │
│  │  │  │ • Apple Pay │  │ • Upgrades  │  │ • Receipts  │  │ • customer_ │         │ │  │
│  │  │  │ • Google Pay│  │ • Downgrades│  │             │  │   updated   │         │ │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │ │  │
│  │  │                                                                              │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                       COMMUNICATION SERVICES                                      │  │
│  │                                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                   │  │
│  │  │    SendGrid     │  │     Twilio      │  │    Firebase     │                   │  │
│  │  │                 │  │                 │  │                 │                   │  │
│  │  │ • Transactional │  │ • SMS           │  │ • Push Notif.   │                   │  │
│  │  │   email         │  │ • MFA codes     │  │ • iOS/Android   │                   │  │
│  │  │ • Email         │  │ • Alerts        │  │ • Analytics     │                   │  │
│  │  │   templates     │  │                 │  │                 │                   │  │
│  │  │ • Delivery      │  │                 │  │                 │                   │  │
│  │  │   tracking      │  │                 │  │                 │                   │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                   │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                       MONITORING & OBSERVABILITY                                  │  │
│  │                                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                   │  │
│  │  │    Datadog      │  │     Sentry      │  │   PagerDuty     │                   │  │
│  │  │                 │  │                 │  │                 │                   │  │
│  │  │ • APM           │  │ • Error         │  │ • Alerting      │                   │  │
│  │  │ • Logs          │  │   tracking      │  │ • On-call       │                   │  │
│  │  │ • Metrics       │  │ • Performance   │  │ • Escalation    │                   │  │
│  │  │ • Dashboards    │  │ • Releases      │  │ • Incident      │                   │  │
│  │  │ • Alerts        │  │                 │  │   management    │                   │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘                   │  │
│  │                                                                                   │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Document Information

| Property | Value |
|----------|-------|
| Version | 2.0.0 |
| Last Updated | 2025 |
| Author | JobPilot AI Engineering |
| Status | Production |

---

<div align="center">

**JobPilot AI — Architected for Scale, Built for Success**

</div>
