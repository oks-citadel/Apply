import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import {
  AgentType,
  AgentStatus
} from '../interfaces/agent.interface';

import type { CircuitBreakerService } from './circuit-breaker.service';
import type {
  AgentConfig,
  AgentHealth,
  AgentResponse,
  AgentRequest} from '../interfaces/agent.interface';
import type { HttpService } from '@nestjs/axios';
import type { ConfigService } from '@nestjs/config';
import type { AxiosError } from 'axios';

@Injectable()
export class AgentClientService {
  private readonly logger = new Logger(AgentClientService.name);
  private readonly agentConfigs: Map<AgentType, AgentConfig>;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {
    this.agentConfigs = this.initializeAgentConfigs();
  }

  private initializeAgentConfigs(): Map<AgentType, AgentConfig> {
    const configs = new Map<AgentType, AgentConfig>();

    const baseConfigs: Array<{
      type: AgentType;
      name: string;
      urlEnvVar: string;
      defaultUrl: string;
    }> = [
      {
        type: AgentType.JOB_DISCOVERY,
        name: 'Job Discovery Agent',
        urlEnvVar: 'JOB_SERVICE_URL',
        defaultUrl: 'http://job-service:8084',
      },
      {
        type: AgentType.JOB_MATCHING,
        name: 'Job Matching Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.RESUME_TAILORING,
        name: 'Resume Tailoring Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.COVER_LETTER,
        name: 'Cover Letter Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.APPLICATION_FORM,
        name: 'Application Form Agent',
        urlEnvVar: 'AUTO_APPLY_SERVICE_URL',
        defaultUrl: 'http://auto-apply-service:8085',
      },
      {
        type: AgentType.AUTHENTICATION,
        name: 'Authentication Agent',
        urlEnvVar: 'AUTH_SERVICE_URL',
        defaultUrl: 'http://auth-service:8081',
      },
      {
        type: AgentType.PROFILE_MANAGEMENT,
        name: 'Profile Management Agent',
        urlEnvVar: 'USER_SERVICE_URL',
        defaultUrl: 'http://user-service:8082',
      },
      {
        type: AgentType.ANALYTICS,
        name: 'Analytics Agent',
        urlEnvVar: 'ANALYTICS_SERVICE_URL',
        defaultUrl: 'http://analytics-service:8086',
      },
      {
        type: AgentType.NOTIFICATION,
        name: 'Notification Agent',
        urlEnvVar: 'NOTIFICATION_SERVICE_URL',
        defaultUrl: 'http://notification-service:8087',
      },
      {
        type: AgentType.INTERVIEW_PREP,
        name: 'Interview Prep Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.DOCUMENT_PROCESSING,
        name: 'Document Processing Agent',
        urlEnvVar: 'RESUME_SERVICE_URL',
        defaultUrl: 'http://resume-service:8083',
      },
      {
        type: AgentType.SALARY_NEGOTIATION,
        name: 'Salary Negotiation Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.NETWORK_INTELLIGENCE,
        name: 'Network Intelligence Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.CULTURE_FIT,
        name: 'Culture Fit Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.APPLICATION_TIMING,
        name: 'Application Timing Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.REJECTION_ANALYSIS,
        name: 'Rejection Analysis Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.CAREER_PATH,
        name: 'Career Path Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.INTERVIEW_SIMULATION,
        name: 'Interview Simulation Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.FOLLOW_UP,
        name: 'Follow-up Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.MARKET_INTELLIGENCE,
        name: 'Market Intelligence Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.PERSONAL_BRAND,
        name: 'Personal Brand Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.COMPETITIVE_ANALYSIS,
        name: 'Competitive Analysis Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.FRAUD_DETECTION,
        name: 'Fraud Detection Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.EMOTIONAL_INTELLIGENCE,
        name: 'Emotional Intelligence Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.SKILL_GAP,
        name: 'Skill Gap Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
      {
        type: AgentType.MULTI_LANGUAGE,
        name: 'Multi-Language Agent',
        urlEnvVar: 'AI_SERVICE_URL',
        defaultUrl: 'http://ai-service:8089',
      },
    ];

    for (const config of baseConfigs) {
      configs.set(config.type, {
        type: config.type,
        name: config.name,
        baseUrl: this.configService.get(config.urlEnvVar, config.defaultUrl),
        healthEndpoint: '/health',
        timeout: 30000,
        retryAttempts: 3,
        circuitBreakerThreshold: 50,
      });
    }

    return configs;
  }

  async callAgent<T>(request: AgentRequest): Promise<AgentResponse<T>> {
    const config = this.agentConfigs.get(request.agentType);
    if (!config) {
      return {
        success: false,
        error: `Unknown agent type: ${request.agentType}`,
        agentType: request.agentType,
        executionTimeMs: 0,
        timestamp: new Date(),
      };
    }

    const startTime = Date.now();
    const correlationId = request.correlationId || uuidv4();

    try {
      const response = await this.circuitBreakerService.execute(
        request.agentType,
        async () => {
          const result = await firstValueFrom(
            this.httpService
              .post<T>(`${config.baseUrl}${this.getEndpoint(request)}`, request.payload, {
                headers: {
                  'X-Correlation-ID': correlationId,
                  'X-User-ID': request.userId,
                  'Content-Type': 'application/json',
                },
                timeout: request.timeout || config.timeout,
              })
              .pipe(
                timeout(request.timeout || config.timeout),
                catchError((error: AxiosError) => {
                  throw error;
                }),
              ),
          );
          return result.data;
        },
      );

      return {
        success: true,
        data: response as T,
        agentType: request.agentType,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Agent call failed: ${request.agentType} - ${request.action}: ${errorMessage}`,
      );

      return {
        success: false,
        error: errorMessage,
        agentType: request.agentType,
        executionTimeMs: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private getEndpoint(request: AgentRequest): string {
    const endpointMap: Record<AgentType, Record<string, string>> = {
      [AgentType.JOB_DISCOVERY]: {
        search: '/jobs/search',
        discover: '/jobs/discover',
        verify: '/jobs/verify',
      },
      [AgentType.JOB_MATCHING]: {
        match: '/ai/match',
        score: '/ai/match-score',
      },
      [AgentType.RESUME_TAILORING]: {
        tailor: '/ai/optimize-resume',
        analyze: '/ai/ats-score',
      },
      [AgentType.COVER_LETTER]: {
        generate: '/ai/generate-cover-letter',
      },
      [AgentType.APPLICATION_FORM]: {
        submit: '/applications',
        fill: '/applications/auto-apply',
      },
      [AgentType.AUTHENTICATION]: {
        verify: '/auth/verify',
        refresh: '/auth/refresh',
      },
      [AgentType.PROFILE_MANAGEMENT]: {
        get: '/profile',
        update: '/profile',
      },
      [AgentType.ANALYTICS]: {
        track: '/analytics/events',
        report: '/analytics/report',
      },
      [AgentType.NOTIFICATION]: {
        send: '/notifications',
        digest: '/notifications/digest',
      },
      [AgentType.INTERVIEW_PREP]: {
        prepare: '/ai/interview-prep',
        questions: '/ai/interview-questions',
      },
      [AgentType.DOCUMENT_PROCESSING]: {
        parse: '/resumes/parse',
        export: '/resumes/export',
      },
      [AgentType.SALARY_NEGOTIATION]: {
        analyze: '/ai/salary-negotiation',
        predict: '/ai/salary-prediction',
      },
      [AgentType.NETWORK_INTELLIGENCE]: {
        analyze: '/ai/agents/network-intelligence',
      },
      [AgentType.CULTURE_FIT]: {
        analyze: '/ai/agents/culture-fit',
      },
      [AgentType.APPLICATION_TIMING]: {
        optimize: '/ai/agents/application-timing',
      },
      [AgentType.REJECTION_ANALYSIS]: {
        analyze: '/ai/agents/rejection-analysis',
      },
      [AgentType.CAREER_PATH]: {
        predict: '/ai/career-path',
      },
      [AgentType.INTERVIEW_SIMULATION]: {
        simulate: '/ai/agents/interview-simulation',
      },
      [AgentType.FOLLOW_UP]: {
        schedule: '/ai/agents/follow-up',
      },
      [AgentType.MARKET_INTELLIGENCE]: {
        analyze: '/ai/agents/market-intelligence',
      },
      [AgentType.PERSONAL_BRAND]: {
        optimize: '/ai/agents/personal-brand',
      },
      [AgentType.COMPETITIVE_ANALYSIS]: {
        analyze: '/ai/agents/competitive-analysis',
      },
      [AgentType.FRAUD_DETECTION]: {
        detect: '/ai/agents/fraud-detection',
      },
      [AgentType.EMOTIONAL_INTELLIGENCE]: {
        analyze: '/ai/agents/emotional-intelligence',
      },
      [AgentType.SKILL_GAP]: {
        analyze: '/ai/skill-gap-analysis',
      },
      [AgentType.MULTI_LANGUAGE]: {
        translate: '/ai/agents/multi-language',
      },
      [AgentType.COMPLIANCE]: {
        check: '/compliance/check',
      },
      [AgentType.AUTO_APPLY]: {
        apply: '/applications/auto-apply',
        status: '/applications/status',
      },
      [AgentType.RESUME_PARSER]: {
        parse: '/resumes/parse',
        analyze: '/resumes/analyze',
      },
      [AgentType.UNKNOWN]: {
        default: '/health',
      },
    };

    const agentEndpoints = endpointMap[request.agentType];
    return agentEndpoints?.[request.action] || `/${request.action}`;
  }

  async checkHealth(agentType: AgentType): Promise<AgentHealth> {
    const config = this.agentConfigs.get(agentType);
    if (!config) {
      return {
        agent: agentType,
        status: AgentStatus.UNKNOWN,
        lastChecked: new Date(),
        errorCount: 0,
        successRate: 0,
        circuitOpen: false,
      };
    }

    const startTime = Date.now();
    try {
      await firstValueFrom(
        this.httpService.get(`${config.baseUrl}${config.healthEndpoint}`).pipe(timeout(5000)),
      );

      return {
        agent: agentType,
        status: AgentStatus.HEALTHY,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorCount: 0,
        successRate: 100,
        circuitOpen: this.circuitBreakerService.isOpen(agentType),
      };
    } catch (error) {
      return {
        agent: agentType,
        status: AgentStatus.UNHEALTHY,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorCount: 1,
        successRate: 0,
        circuitOpen: this.circuitBreakerService.isOpen(agentType),
      };
    }
  }

  async checkAllAgentsHealth(): Promise<AgentHealth[]> {
    const healthChecks = Array.from(this.agentConfigs.keys()).map((agentType) =>
      this.checkHealth(agentType),
    );

    return Promise.all(healthChecks);
  }

  getAgentConfig(agentType: AgentType): AgentConfig | undefined {
    return this.agentConfigs.get(agentType);
  }
}
