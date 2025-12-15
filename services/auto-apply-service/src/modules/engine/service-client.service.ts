import { Injectable, Logger, ServiceUnavailableException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, retry, timeout, catchError, throwError } from 'rxjs';
import { AxiosError } from 'axios';

/**
 * Circuit Breaker State
 */
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit Breaker Configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

/**
 * Circuit Breaker for individual services
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private readonly config: CircuitBreakerConfig;

  constructor(
    private readonly serviceName: string,
    config?: Partial<CircuitBreakerConfig>,
  ) {
    this.config = {
      failureThreshold: config?.failureThreshold || 10, // Increased from 5 to 10
      successThreshold: config?.successThreshold || 2,
      timeout: config?.timeout || 60000, // Increased from 30s to 60s
      resetTimeout: config?.resetTimeout || 60000,
    };
  }

  async execute<T>(fn: () => Promise<T>, fallback?: T): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        // If fallback is provided, return it instead of throwing error (fail-open)
        if (fallback !== undefined) {
          return fallback;
        }
        throw new ServiceUnavailableException(
          `Circuit breaker is OPEN for ${this.serviceName}. Service is temporarily unavailable.`,
        );
      }
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      // If fallback is provided and circuit just opened, return fallback
      if (fallback !== undefined && this.state === CircuitState.OPEN) {
        return fallback;
      }
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.resetTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Service Client for inter-service communication
 * Implements circuit breaker pattern for resilience
 */
@Injectable()
export class ServiceClientService {
  private readonly logger = new Logger(ServiceClientService.name);
  private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private readonly jobServiceUrl: string;
  private readonly userServiceUrl: string;
  private readonly resumeServiceUrl: string;
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.jobServiceUrl = this.configService.get<string>('JOB_SERVICE_URL', 'http://localhost:8004/api/v1');
    this.userServiceUrl = this.configService.get<string>('USER_SERVICE_URL', 'http://localhost:8002/api/v1');
    this.resumeServiceUrl = this.configService.get<string>('RESUME_SERVICE_URL', 'http://localhost:8003/api/v1');
    this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL', 'http://localhost:8007/api/v1');

    // Initialize circuit breakers for each service
    this.circuitBreakers.set('job-service', new CircuitBreaker('job-service'));
    this.circuitBreakers.set('user-service', new CircuitBreaker('user-service'));
    this.circuitBreakers.set('resume-service', new CircuitBreaker('resume-service'));
    this.circuitBreakers.set('ai-service', new CircuitBreaker('ai-service'));
  }

  /**
   * Get job data from job-service
   */
  async getJob(jobId: string): Promise<any> {
    const circuitBreaker = this.circuitBreakers.get('job-service');

    return circuitBreaker.execute(async () => {
      this.logger.log(`Fetching job data for job ${jobId} from job-service`);

      try {
        const response = await firstValueFrom(
          this.httpService.get(`${this.jobServiceUrl}/jobs/${jobId}`).pipe(
            timeout(60000), // Increased from 30s to 60s
            retry({ count: 2, delay: 1000 }),
            catchError((error: AxiosError) => {
              this.logger.error(`Error fetching job ${jobId}: ${error.message}`);
              return throwError(() => this.handleServiceError(error, 'job-service'));
            }),
          ),
        );

        this.logger.log(`Successfully fetched job data for job ${jobId}`);
        return response.data;
      } catch (error) {
        throw this.handleServiceError(error, 'job-service');
      }
    });
  }

  /**
   * Get user profile from user-service
   */
  async getUserProfile(userId: string, authToken?: string): Promise<any> {
    const circuitBreaker = this.circuitBreakers.get('user-service');

    return circuitBreaker.execute(async () => {
      this.logger.log(`Fetching user profile for user ${userId} from user-service`);

      try {
        const headers: any = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await firstValueFrom(
          this.httpService.get(`${this.userServiceUrl}/profile`, { headers }).pipe(
            timeout(60000), // Increased from 30s to 60s
            retry({ count: 2, delay: 1000 }),
            catchError((error: AxiosError) => {
              this.logger.error(`Error fetching user profile ${userId}: ${error.message}`);
              return throwError(() => this.handleServiceError(error, 'user-service'));
            }),
          ),
        );

        this.logger.log(`Successfully fetched user profile for user ${userId}`);
        return response.data;
      } catch (error) {
        throw this.handleServiceError(error, 'user-service');
      }
    });
  }

  /**
   * Get resume from resume-service
   */
  async getResume(resumeId: string, userId: string, authToken?: string): Promise<any> {
    const circuitBreaker = this.circuitBreakers.get('resume-service');

    return circuitBreaker.execute(async () => {
      this.logger.log(`Fetching resume ${resumeId} for user ${userId} from resume-service`);

      try {
        const headers: any = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await firstValueFrom(
          this.httpService.get(`${this.resumeServiceUrl}/resumes/${resumeId}`, { headers }).pipe(
            timeout(60000), // Increased from 30s to 60s
            retry({ count: 2, delay: 1000 }),
            catchError((error: AxiosError) => {
              this.logger.error(`Error fetching resume ${resumeId}: ${error.message}`);
              return throwError(() => this.handleServiceError(error, 'resume-service'));
            }),
          ),
        );

        this.logger.log(`Successfully fetched resume ${resumeId}`);
        return response.data;
      } catch (error) {
        throw this.handleServiceError(error, 'resume-service');
      }
    });
  }

  /**
   * Get all resumes for a user from resume-service
   */
  async getUserResumes(userId: string, authToken?: string): Promise<any[]> {
    const circuitBreaker = this.circuitBreakers.get('resume-service');

    return circuitBreaker.execute(async () => {
      this.logger.log(`Fetching all resumes for user ${userId} from resume-service`);

      try {
        const headers: any = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await firstValueFrom(
          this.httpService.get(`${this.resumeServiceUrl}/resumes`, {
            headers,
            params: { page: 1, limit: 100 }
          }).pipe(
            timeout(60000), // Increased from 30s to 60s
            retry({ count: 2, delay: 1000 }),
            catchError((error: AxiosError) => {
              this.logger.error(`Error fetching resumes for user ${userId}: ${error.message}`);
              return throwError(() => this.handleServiceError(error, 'resume-service'));
            }),
          ),
        );

        this.logger.log(`Successfully fetched resumes for user ${userId}`);
        // Handle both direct array and paginated response
        return response.data.resumes || response.data || [];
      } catch (error) {
        throw this.handleServiceError(error, 'resume-service');
      }
    });
  }

  /**
   * Get cover letter from resume-service
   * Note: Assuming cover letters are part of resume service
   */
  async getCoverLetter(coverLetterId: string, userId: string, authToken?: string): Promise<any> {
    const circuitBreaker = this.circuitBreakers.get('resume-service');

    return circuitBreaker.execute(async () => {
      this.logger.log(`Fetching cover letter ${coverLetterId} for user ${userId} from resume-service`);

      try {
        const headers: any = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        // Assuming cover letters endpoint exists, adjust as needed
        const response = await firstValueFrom(
          this.httpService.get(`${this.resumeServiceUrl}/cover-letters/${coverLetterId}`, { headers }).pipe(
            timeout(60000), // Increased from 30s to 60s
            retry({ count: 2, delay: 1000 }),
            catchError((error: AxiosError) => {
              this.logger.error(`Error fetching cover letter ${coverLetterId}: ${error.message}`);
              return throwError(() => this.handleServiceError(error, 'resume-service'));
            }),
          ),
        );

        this.logger.log(`Successfully fetched cover letter ${coverLetterId}`);
        return response.data;
      } catch (error) {
        throw this.handleServiceError(error, 'resume-service');
      }
    });
  }

  /**
   * Generate cover letter using AI service
   */
  async generateCoverLetter(jobData: any, resumeData: any, authToken?: string): Promise<any> {
    const circuitBreaker = this.circuitBreakers.get('ai-service');

    return circuitBreaker.execute(async () => {
      this.logger.log(`Generating cover letter using AI service`);

      try {
        const headers: any = {
          'Content-Type': 'application/json',
        };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await firstValueFrom(
          this.httpService.post(
            `${this.aiServiceUrl}/cover-letters/generate`,
            {
              jobDescription: jobData.description,
              resumeData,
            },
            { headers },
          ).pipe(
            timeout(60000), // Cover letter generation may take longer
            retry({ count: 1, delay: 2000 }),
            catchError((error: AxiosError) => {
              this.logger.error(`Error generating cover letter: ${error.message}`);
              return throwError(() => this.handleServiceError(error, 'ai-service'));
            }),
          ),
        );

        this.logger.log(`Successfully generated cover letter`);
        return response.data;
      } catch (error) {
        throw this.handleServiceError(error, 'ai-service');
      }
    });
  }

  /**
   * Get circuit breaker status for all services
   */
  getCircuitBreakerStatus(): Record<string, string> {
    const status: Record<string, string> = {};

    this.circuitBreakers.forEach((breaker, serviceName) => {
      status[serviceName] = breaker.getState();
    });

    return status;
  }

  /**
   * Handle service errors and convert to appropriate NestJS exceptions
   */
  private handleServiceError(error: any, serviceName: string): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      this.logger.error(
        `${serviceName} returned ${status}: ${message}`,
        error.stack,
      );

      if (status === 404) {
        return new NotFoundException(message);
      } else if (status >= 500) {
        return new ServiceUnavailableException(
          `${serviceName} is currently unavailable`,
        );
      }
    }

    // Network or timeout error
    this.logger.error(
      `Failed to communicate with ${serviceName}: ${error.message}`,
      error.stack,
    );

    return new ServiceUnavailableException(
      `Failed to communicate with ${serviceName}`,
    );
  }
}
