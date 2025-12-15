# Recruiter Marketplace - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Database Setup

```bash
cd services/user-service

# Generate migration
npm run typeorm -- migration:generate -n RecruiterMarketplace -d src/config/data-source.ts

# Run migration
npm run typeorm -- migration:run -d src/config/data-source.ts
```

### 2. Start the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### 3. Test the API

#### Register as a Recruiter
```bash
curl -X POST http://localhost:3000/api/v1/recruiters/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "TechRecruit Inc",
    "years_of_experience": 5,
    "industries": ["technology"],
    "roles": ["software_engineering"],
    "regions": ["US-CA"],
    "max_concurrent_assignments": 5,
    "placement_fee_percentage": 15
  }'
```

#### Search Recruiters
```bash
curl http://localhost:3000/api/v1/recruiters?industries=technology&verified_only=true
```

#### Assign a Recruiter
```bash
curl -X POST http://localhost:3000/api/v1/recruiters/assign \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recruiter_id": "RECRUITER_UUID",
    "assignment_type": "full_service",
    "target_salary_min": 150000,
    "target_salary_max": 200000
  }'
```

#### Escalate an Application
```bash
curl -X POST http://localhost:3000/api/v1/recruiters/escalate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "APPLICATION_UUID",
    "escalation_reason": "Need interview preparation",
    "assignment_type": "interview_prep"
  }'
```

#### Get Performance Stats
```bash
curl http://localhost:3000/api/v1/recruiters/RECRUITER_UUID/performance
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `entities/recruiter-profile.entity.ts` | Main recruiter profile |
| `entities/recruiter-assignment.entity.ts` | User-recruiter engagements |
| `entities/placement-outcome.entity.ts` | Placement tracking |
| `entities/recruiter-review.entity.ts` | Ratings and reviews |
| `entities/recruiter-revenue.entity.ts` | Financial tracking |
| `recruiter.service.ts` | Business logic |
| `recruiter.controller.ts` | API endpoints |
| `README.md` | Full documentation |
| `EXAMPLES.md` | Usage examples |

## 🎯 Common Tasks

### Create a New Assignment Type
Edit `entities/recruiter-assignment.entity.ts`:
```typescript
export enum AssignmentType {
  // ... existing types
  NEW_TYPE = 'new_type',
}
```

Update fee multiplier in `recruiter.service.ts`:
```typescript
private calculateAssignmentFee(type: AssignmentType, basePercentage: number): number {
  const multipliers = {
    // ... existing multipliers
    [AssignmentType.NEW_TYPE]: 0.6,
  };
  return basePercentage * (multipliers[type] || 1.0);
}
```

### Add a New Specialization
Edit `entities/recruiter-profile.entity.ts`:
```typescript
export enum IndustrySpecialization {
  // ... existing industries
  NEW_INDUSTRY = 'new_industry',
}
```

### Modify Quality Scoring
Edit `calculateQualityScore()` method in `recruiter-profile.entity.ts`:
```typescript
calculateQualityScore(): number {
  let score = 50;
  // Adjust scoring logic here
  return Math.min(Math.max(score, 0), 100);
}
```

### Change Platform Commission
Edit `getPlatformFeePercentage()` in `recruiter.service.ts`:
```typescript
private getPlatformFeePercentage(tier: RecruiterTier): number {
  const fees = {
    [RecruiterTier.STANDARD]: 25,  // Adjust here
    [RecruiterTier.PREMIUM]: 20,
    [RecruiterTier.ELITE]: 15,
  };
  return fees[tier] || 25;
}
```

## 🔧 Configuration

### Environment Variables
Uses existing user-service configuration:
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `JWT_SECRET` (for authentication)
- `STRIPE_SECRET_KEY` (for payouts)

### Swagger Documentation
Available at: `http://localhost:3000/api/docs`
All endpoints under the "Recruiters" tag

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific tests
npm test -- recruiter

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## 📊 Monitoring

### Key Metrics to Track
- Assignment creation rate
- Placement success rate
- Average quality score
- Revenue per recruiter
- User satisfaction (average rating)

### Database Queries

Get top recruiters:
```sql
SELECT company_name, quality_score, total_placements, average_rating
FROM recruiter_profiles
WHERE status = 'active' AND is_verified = true
ORDER BY quality_score DESC
LIMIT 10;
```

Revenue summary:
```sql
SELECT
  SUM(gross_amount) as total_revenue,
  SUM(platform_commission) as platform_earnings,
  SUM(net_amount) as recruiter_payouts
FROM recruiter_revenue
WHERE status = 'completed';
```

Assignment statistics:
```sql
SELECT
  assignment_type,
  COUNT(*) as total,
  AVG(progress_percentage) as avg_progress
FROM recruiter_assignments
WHERE status != 'cancelled'
GROUP BY assignment_type;
```

## 🚨 Troubleshooting

### Migration Fails
```bash
# Check current migration status
npm run typeorm -- migration:show -d src/config/data-source.ts

# Revert last migration
npm run typeorm -- migration:revert -d src/config/data-source.ts
```

### Service Won't Start
1. Check database connection
2. Verify all dependencies installed: `npm install`
3. Check for TypeScript errors: `npm run build`
4. Review logs for specific error

### Endpoints Return 404
1. Verify module imported in `app.module.ts`
2. Check route prefix in controller
3. Ensure service is running on correct port

### Quality Score Not Updating
1. Check if `updateRecruiterPerformance()` is being called
2. Verify placements are being tracked correctly
3. Review quality score calculation logic

## 📚 Additional Resources

- **Full Documentation**: `src/modules/recruiter/README.md`
- **Usage Examples**: `src/modules/recruiter/EXAMPLES.md`
- **Implementation Summary**: `../../RECRUITER_MARKETPLACE_IMPLEMENTATION.md`
- **API Spec**: Swagger UI at `/api/docs`

## 🎓 Learning Path

1. ✅ Read this Quick Start
2. ✅ Run database migrations
3. ✅ Test basic endpoints with curl/Postman
4. ✅ Review entity models
5. ✅ Study service methods
6. ✅ Read full documentation
7. ✅ Review example workflows
8. ✅ Build frontend integration

## 💡 Pro Tips

1. **Auto-matching**: Let the system find best recruiter by omitting `recruiter_id` in escalation
2. **Quality Boost**: Encourage verified placements for higher quality scores
3. **Tier Benefits**: Elite recruiters get 15% platform fee vs 25% for standard
4. **Review Power**: 5-star reviews significantly boost quality scores
5. **Guarantee Period**: 90-day default protects both users and recruiters

## 🆘 Support

- **Documentation**: Check README.md files
- **Issues**: Create GitHub issue
- **Questions**: Team Slack #recruiter-marketplace
- **API Help**: Swagger docs at `/api/docs`

---

**Ready to go!** Start with registering a test recruiter and creating an assignment.
