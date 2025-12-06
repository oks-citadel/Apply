import { Injectable, Logger } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';
import { AgentType, AgentStatus } from '../interfaces/agent.interface';

interface CircuitBreakerConfig {
  timeout: number;
  errorThresholdPercentage: number;
  resetTimeout: number;
  volumeThreshold: number;
}

interface AgentCircuitState {
  breaker: CircuitBreaker;
  status: AgentStatus;
  errorCount: number;
  successCount: number;
  lastError?: string;
  lastSuccess?: Date;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly circuits: Map<AgentType, AgentCircuitState> = new Map();

  private readonly defaultConfig: CircuitBreakerConfig = {
    timeout: 30000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
    volumeThreshold: 5,
  };

  createBreaker<T>(
    agentType: AgentType,
    action: (...args: unknown[]) => Promise<T>,
    config?: Partial<CircuitBreakerConfig>,
  ): CircuitBreaker {
    const finalConfig = { ...this.defaultConfig, ...config };

    const breaker = new CircuitBreaker(action, {
      timeout: finalConfig.timeout,
      errorThresholdPercentage: finalConfig.errorThresholdPercentage,
      resetTimeout: finalConfig.resetTimeout,
      volumeThreshold: finalConfig.volumeThreshold,
    });

    // Event handlers
    breaker.on('success', () => {
      this.onSuccess(agentType);
    });

    breaker.on('failure', (error: Error) => {
      this.onFailure(agentType, error);
    });

    breaker.on('timeout', () => {
      this.logger.warn(`Circuit timeout for agent: ${agentType}`);
      this.onFailure(agentType, new Error('Timeout'));
    });

    breaker.on('open', () => {
      this.logger.warn(`Circuit OPEN for agent: ${agentType}`);
      this.updateStatus(agentType, AgentStatus.UNHEALTHY);
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`Circuit HALF-OPEN for agent: ${agentType}`);
      this.updateStatus(agentType, AgentStatus.DEGRADED);
    });

    breaker.on('close', () => {
      this.logger.log(`Circuit CLOSED for agent: ${agentType}`);
      this.updateStatus(agentType, AgentStatus.HEALTHY);
    });

    this.circuits.set(agentType, {
      breaker,
      status: AgentStatus.HEALTHY,
      errorCount: 0,
      successCount: 0,
    });

    return breaker;
  }

  getBreaker(agentType: AgentType): CircuitBreaker | undefined {
    return this.circuits.get(agentType)?.breaker;
  }

  async execute<T>(
    agentType: AgentType,
    action: (...args: unknown[]) => Promise<T>,
    ...args: unknown[]
  ): Promise<T> {
    let state = this.circuits.get(agentType);

    if (!state) {
      const breaker = this.createBreaker(agentType, action);
      state = this.circuits.get(agentType)!;
    }

    return state.breaker.fire(...args) as Promise<T>;
  }

  private onSuccess(agentType: AgentType): void {
    const state = this.circuits.get(agentType);
    if (state) {
      state.successCount++;
      state.lastSuccess = new Date();
      this.updateStatus(agentType, AgentStatus.HEALTHY);
    }
  }

  private onFailure(agentType: AgentType, error: Error): void {
    const state = this.circuits.get(agentType);
    if (state) {
      state.errorCount++;
      state.lastError = error.message;
      this.logger.error(`Agent ${agentType} failure: ${error.message}`);
    }
  }

  private updateStatus(agentType: AgentType, status: AgentStatus): void {
    const state = this.circuits.get(agentType);
    if (state) {
      state.status = status;
    }
  }

  getStatus(agentType: AgentType): AgentStatus {
    return this.circuits.get(agentType)?.status || AgentStatus.UNKNOWN;
  }

  isOpen(agentType: AgentType): boolean {
    const state = this.circuits.get(agentType);
    return state?.breaker.opened || false;
  }

  getStats(agentType: AgentType): Record<string, unknown> | undefined {
    const state = this.circuits.get(agentType);
    if (!state) return undefined;

    const stats = state.breaker.stats;
    return {
      status: state.status,
      isOpen: state.breaker.opened,
      errorCount: state.errorCount,
      successCount: state.successCount,
      lastError: state.lastError,
      lastSuccess: state.lastSuccess,
      stats: {
        fires: stats.fires,
        failures: stats.failures,
        successes: stats.successes,
        timeouts: stats.timeouts,
        cacheHits: stats.cacheHits,
        cacheMisses: stats.cacheMisses,
        fallbacks: stats.fallbacks,
      },
    };
  }

  getAllStats(): Record<string, Record<string, unknown>> {
    const allStats: Record<string, Record<string, unknown>> = {};

    for (const [agentType, _] of this.circuits) {
      const stats = this.getStats(agentType);
      if (stats) {
        allStats[agentType] = stats;
      }
    }

    return allStats;
  }

  resetCircuit(agentType: AgentType): void {
    const state = this.circuits.get(agentType);
    if (state) {
      state.breaker.close();
      state.errorCount = 0;
      state.successCount = 0;
      state.status = AgentStatus.HEALTHY;
      this.logger.log(`Circuit reset for agent: ${agentType}`);
    }
  }

  resetAllCircuits(): void {
    for (const [agentType, _] of this.circuits) {
      this.resetCircuit(agentType);
    }
  }
}
