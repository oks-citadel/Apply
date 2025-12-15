# Regional Playbooks Workflow

## High-Level Architecture

```
┌─────────────┐
│   Frontend  │
│  (User UI)  │
└──────┬──────┘
       │
       │ 1. View job
       │
       ▼
┌─────────────────────┐
│   Job Service API   │
│ /api/v1/playbooks   │
└──────┬──────────────┘
       │
       │ 2. Request recommendation
       │
       ▼
┌──────────────────────────┐
│  PlaybooksService        │
│  - recommendPlaybook()   │
│  - calculateMatchScore() │
└──────┬───────────────────┘
       │
       │ 3. Analyze job location
       │
       ▼
┌───────────────────────────┐
│  Regional Playbooks DB    │
│  - United States          │
│  - Canada                 │
│  - United Kingdom         │
│  - European Union         │
│  - Australia              │
│  - Global Remote          │
└───────┬───────────────────┘
        │
        │ 4. Return recommendation
        │
        ▼
┌────────────────────────┐
│  User Reviews &        │
│  Applies Playbook      │
└────────┬───────────────┘
         │
         │ 5. Apply playbook
         │
         ▼
┌─────────────────────────────┐
│  Resume Service             │
│  - Format resume            │
│  - Generate cover letter    │
│  - Optimize for ATS         │
└────────┬────────────────────┘
         │
         │ 6. Submit application
         │
         ▼
┌──────────────────────────────┐
│  PlaybookApplication Record  │
│  - Track status              │
│  - Monitor outcomes          │
│  - Calculate success rates   │
└──────────────────────────────┘
```

## Complete Workflow Documentation

For detailed workflow information, including:
- User journey flows
- Decision trees
- Integration patterns
- Error handling
- Performance considerations
- Monitoring strategies

Please see the comprehensive README.md in the playbooks module directory.

**Location**: `services/job-service/src/modules/playbooks/README.md`
