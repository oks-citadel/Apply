export enum AgentType {
  JOB_DISCOVERY = 'job_discovery',
  JOB_MATCHING = 'job_matching',
  RESUME_TAILORING = 'resume_tailoring',
  COVER_LETTER = 'cover_letter',
  APPLICATION_FORM = 'application_form',
  AUTHENTICATION = 'authentication',
  PROFILE_MANAGEMENT = 'profile_management',
  ANALYTICS = 'analytics',
  NOTIFICATION = 'notification',
  INTERVIEW_PREP = 'interview_prep',
  COMPLIANCE = 'compliance',
  DOCUMENT_PROCESSING = 'document_processing',
  SALARY_NEGOTIATION = 'salary_negotiation',
  NETWORK_INTELLIGENCE = 'network_intelligence',
  CULTURE_FIT = 'culture_fit',
  APPLICATION_TIMING = 'application_timing',
  REJECTION_ANALYSIS = 'rejection_analysis',
  CAREER_PATH = 'career_path',
  INTERVIEW_SIMULATION = 'interview_simulation',
  FOLLOW_UP = 'follow_up',
  MARKET_INTELLIGENCE = 'market_intelligence',
  PERSONAL_BRAND = 'personal_brand',
  COMPETITIVE_ANALYSIS = 'competitive_analysis',
  FRAUD_DETECTION = 'fraud_detection',
  EMOTIONAL_INTELLIGENCE = 'emotional_intelligence',
  SKILL_GAP = 'skill_gap',
  MULTI_LANGUAGE = 'multi_language',
}

export enum AgentStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
}

export interface AgentConfig {
  type: AgentType;
  name: string;
  baseUrl: string;
  healthEndpoint: string;
  timeout: number;
  retryAttempts: number;
  circuitBreakerThreshold: number;
}

export interface AgentHealth {
  agent: AgentType;
  status: AgentStatus;
  lastChecked: Date;
  responseTime?: number;
  errorCount: number;
  successRate: number;
  circuitOpen: boolean;
}

export interface AgentResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  agentType: AgentType;
  executionTimeMs: number;
  timestamp: Date;
}

export interface AgentRequest {
  agentType: AgentType;
  action: string;
  payload: Record<string, unknown>;
  userId: string;
  correlationId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeout?: number;
}
