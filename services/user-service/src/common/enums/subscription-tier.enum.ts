export enum SubscriptionTier {
  // Free tier
  FREE = 'free',
  FREEMIUM = 'freemium',
  // Paid tiers - aligned with frontend pricing
  STARTER = 'starter',
  BASIC = 'basic',
  PRO = 'pro',
  PROFESSIONAL = 'professional',
  ADVANCED_CAREER = 'advanced_career',
  ENTERPRISE = 'enterprise',
  EXECUTIVE_ELITE = 'executive_elite',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
}

export enum RemotePreference {
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  ONSITE = 'onsite',
  ANY = 'any',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  PRINCIPAL = 'principal',
  EXECUTIVE = 'executive',
}

export enum SkillProficiency {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}
