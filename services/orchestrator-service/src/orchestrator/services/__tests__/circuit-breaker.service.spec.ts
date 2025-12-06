import { Test, TestingModule } from '@nestjs/testing';
import { CircuitBreakerService } from '../circuit-breaker.service';
import { AgentType, AgentStatus } from '../../interfaces/agent.interface';

// Mock opossum module
jest.mock('opossum', () => {
  return jest.fn().mockImplementation((action, options) => {
    const listeners: Record<string, Function[]> = {};

    return {
      fire: async (...args: any[]) => {
        try {
          const result = await action(...args);
          if (listeners['success']) {
            listeners['success'].forEach(fn => fn(result));
          }
          return result;
        } catch (error) {
          if (listeners['failure']) {
            listeners['failure'].forEach(fn => fn(error));
          }
          throw error;
        }
      },
      on: (event: string, handler: Function) => {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event].push(handler);
      },
      close: jest.fn(),
      open: jest.fn(),
      opened: false,
      closed: true,
      stats: {
        fires: 0,
        failures: 0,
        successes: 0,
        timeouts: 0,
        cacheHits: 0,
        cacheMisses: 0,
        fallbacks: 0,
      },
    };
  });
});

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircuitBreakerService],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBreaker', () => {
    it('should create a circuit breaker for an agent', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const breaker = service.createBreaker(
        AgentType.JOB_DISCOVERY,
        mockAction,
      );

      expect(breaker).toBeDefined();
      expect(service.getBreaker(AgentType.JOB_DISCOVERY)).toBeDefined();
    });

    it('should create circuit breaker with custom config', () => {
      const mockAction = jest.fn().mockResolvedValue('success');
      const customConfig = {
        timeout: 5000,
        errorThresholdPercentage: 60,
        resetTimeout: 10000,
        volumeThreshold: 10,
      };

      const breaker = service.createBreaker(
        AgentType.AUTO_APPLY,
        mockAction,
        customConfig,
      );

      expect(breaker).toBeDefined();
    });

    it('should use default config when no custom config provided', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const breaker = service.createBreaker(
        AgentType.RESUME_PARSER,
        mockAction,
      );

      expect(breaker).toBeDefined();
    });

    it('should create multiple breakers for different agents', () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      service.createBreaker(AgentType.JOB_DISCOVERY, mockAction);
      service.createBreaker(AgentType.AUTO_APPLY, mockAction);
      service.createBreaker(AgentType.RESUME_PARSER, mockAction);

      expect(service.getBreaker(AgentType.JOB_DISCOVERY)).toBeDefined();
      expect(service.getBreaker(AgentType.AUTO_APPLY)).toBeDefined();
      expect(service.getBreaker(AgentType.RESUME_PARSER)).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should execute action successfully through circuit breaker', async () => {
      const mockAction = jest.fn().mockResolvedValue({ data: 'success' });

      const result = await service.execute(
        AgentType.JOB_DISCOVERY,
        mockAction,
        'arg1',
        'arg2',
      );

      expect(result).toEqual({ data: 'success' });
      expect(mockAction).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should create breaker if it does not exist', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const result = await service.execute(
        AgentType.INTERVIEW_PREP,
        mockAction,
      );

      expect(result).toBe('success');
      expect(service.getBreaker(AgentType.INTERVIEW_PREP)).toBeDefined();
    });

    it('should use existing breaker if it already exists', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      service.createBreaker(AgentType.JOB_DISCOVERY, mockAction);
      const breaker1 = service.getBreaker(AgentType.JOB_DISCOVERY);

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      const breaker2 = service.getBreaker(AgentType.JOB_DISCOVERY);

      expect(breaker1).toBe(breaker2);
    });

    it('should handle action failures', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Agent failed'));

      await expect(
        service.execute(AgentType.JOB_DISCOVERY, mockAction),
      ).rejects.toThrow('Agent failed');
    });

    it('should track success count', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      await service.execute(AgentType.JOB_DISCOVERY, mockAction);

      const stats = service.getStats(AgentType.JOB_DISCOVERY);
      expect(stats?.successCount).toBeGreaterThan(0);
    });

    it('should track error count on failures', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Failed'));

      try {
        await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      } catch (error) {
        // Expected error
      }

      const stats = service.getStats(AgentType.JOB_DISCOVERY);
      expect(stats?.errorCount).toBeGreaterThan(0);
    });
  });

  describe('getStatus', () => {
    it('should return HEALTHY status for successful operations', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);

      const status = service.getStatus(AgentType.JOB_DISCOVERY);
      expect(status).toBe(AgentStatus.HEALTHY);
    });

    it('should return UNKNOWN status for non-existent circuit', () => {
      const status = service.getStatus(AgentType.JOB_DISCOVERY);
      expect(status).toBe(AgentStatus.UNKNOWN);
    });
  });

  describe('isOpen', () => {
    it('should return false for closed circuit', () => {
      const mockAction = jest.fn().mockResolvedValue('success');
      service.createBreaker(AgentType.JOB_DISCOVERY, mockAction);

      const isOpen = service.isOpen(AgentType.JOB_DISCOVERY);
      expect(isOpen).toBe(false);
    });

    it('should return false for non-existent circuit', () => {
      const isOpen = service.isOpen(AgentType.UNKNOWN as AgentType);
      expect(isOpen).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return stats for existing circuit', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);

      const stats = service.getStats(AgentType.JOB_DISCOVERY);

      expect(stats).toBeDefined();
      expect(stats?.status).toBeDefined();
      expect(stats?.isOpen).toBe(false);
      expect(stats?.errorCount).toBeDefined();
      expect(stats?.successCount).toBeDefined();
      expect(stats?.stats).toBeDefined();
    });

    it('should return undefined for non-existent circuit', () => {
      const stats = service.getStats(AgentType.UNKNOWN as AgentType);
      expect(stats).toBeUndefined();
    });

    it('should include lastSuccess timestamp', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);

      const stats = service.getStats(AgentType.JOB_DISCOVERY);

      expect(stats?.lastSuccess).toBeInstanceOf(Date);
    });

    it('should include lastError on failure', async () => {
      const mockAction = jest.fn().mockRejectedValue(new Error('Test error'));

      try {
        await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      } catch (error) {
        // Expected error
      }

      const stats = service.getStats(AgentType.JOB_DISCOVERY);

      expect(stats?.lastError).toBe('Test error');
    });
  });

  describe('getAllStats', () => {
    it('should return stats for all circuits', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      await service.execute(AgentType.AUTO_APPLY, mockAction);

      const allStats = service.getAllStats();

      expect(Object.keys(allStats).length).toBeGreaterThan(0);
      expect(allStats[AgentType.JOB_DISCOVERY]).toBeDefined();
      expect(allStats[AgentType.AUTO_APPLY]).toBeDefined();
    });

    it('should return empty object when no circuits exist', () => {
      const allStats = service.getAllStats();
      expect(allStats).toEqual({});
    });

    it('should include stats for multiple agents', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      await service.execute(AgentType.AUTO_APPLY, mockAction);
      await service.execute(AgentType.RESUME_PARSER, mockAction);

      const allStats = service.getAllStats();

      expect(Object.keys(allStats)).toHaveLength(3);
    });
  });

  describe('resetCircuit', () => {
    it('should reset circuit for specific agent', async () => {
      const mockAction = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValue('success');

      try {
        await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      } catch (error) {
        // Expected error
      }
      try {
        await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      } catch (error) {
        // Expected error
      }

      const statsBefore = service.getStats(AgentType.JOB_DISCOVERY);
      expect(statsBefore?.errorCount).toBeGreaterThan(0);

      service.resetCircuit(AgentType.JOB_DISCOVERY);

      const statsAfter = service.getStats(AgentType.JOB_DISCOVERY);
      expect(statsAfter?.errorCount).toBe(0);
      expect(statsAfter?.successCount).toBe(0);
      expect(statsAfter?.status).toBe(AgentStatus.HEALTHY);
    });

    it('should not affect other circuits when resetting one', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      await service.execute(AgentType.AUTO_APPLY, mockAction);

      service.resetCircuit(AgentType.JOB_DISCOVERY);

      const stats1 = service.getStats(AgentType.JOB_DISCOVERY);
      const stats2 = service.getStats(AgentType.AUTO_APPLY);

      expect(stats1?.successCount).toBe(0);
      expect(stats2?.successCount).toBeGreaterThan(0);
    });

    it('should handle reset of non-existent circuit gracefully', () => {
      expect(() => {
        service.resetCircuit(AgentType.UNKNOWN as AgentType);
      }).not.toThrow();
    });
  });

  describe('resetAllCircuits', () => {
    it('should reset all circuits', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      await service.execute(AgentType.AUTO_APPLY, mockAction);
      await service.execute(AgentType.RESUME_PARSER, mockAction);

      service.resetAllCircuits();

      const stats1 = service.getStats(AgentType.JOB_DISCOVERY);
      const stats2 = service.getStats(AgentType.AUTO_APPLY);
      const stats3 = service.getStats(AgentType.RESUME_PARSER);

      expect(stats1?.errorCount).toBe(0);
      expect(stats1?.successCount).toBe(0);
      expect(stats2?.errorCount).toBe(0);
      expect(stats2?.successCount).toBe(0);
      expect(stats3?.errorCount).toBe(0);
      expect(stats3?.successCount).toBe(0);
    });

    it('should handle reset when no circuits exist', () => {
      expect(() => {
        service.resetAllCircuits();
      }).not.toThrow();
    });
  });

  describe('Circuit Breaker Events', () => {
    it('should update status on success', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      await service.execute(AgentType.JOB_DISCOVERY, mockAction);

      const stats = service.getStats(AgentType.JOB_DISCOVERY);
      expect(stats?.status).toBe(AgentStatus.HEALTHY);
    });

    it('should track error message on failure', async () => {
      const mockAction = jest.fn().mockRejectedValue(
        new Error('Specific error message'),
      );

      try {
        await service.execute(AgentType.JOB_DISCOVERY, mockAction);
      } catch (error) {
        // Expected error
      }

      const stats = service.getStats(AgentType.JOB_DISCOVERY);
      expect(stats?.lastError).toBe('Specific error message');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive calls', async () => {
      const mockAction = jest.fn().mockResolvedValue('success');

      const promises = Array(100)
        .fill(null)
        .map(() => service.execute(AgentType.JOB_DISCOVERY, mockAction));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      results.forEach((result) => {
        expect(result).toBe('success');
      });
    });

    it('should handle mixed success and failures', async () => {
      let callCount = 0;
      const mockAction = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount % 2 === 0) {
          throw new Error('Even call failed');
        }
        return 'success';
      });

      for (let i = 0; i < 10; i++) {
        try {
          await service.execute(AgentType.JOB_DISCOVERY, mockAction);
        } catch (error) {
          // Expected for even calls
        }
      }

      const stats = service.getStats(AgentType.JOB_DISCOVERY);
      expect(stats?.successCount).toBeGreaterThan(0);
      expect(stats?.errorCount).toBeGreaterThan(0);
    });

    it('should handle long-running actions', async () => {
      const mockAction = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('success'), 100);
          }),
      );

      const result = await service.execute(AgentType.JOB_DISCOVERY, mockAction);

      expect(result).toBe('success');
    });

    it('should handle different return types', async () => {
      const mockActionString = jest.fn().mockResolvedValue('string');
      const mockActionNumber = jest.fn().mockResolvedValue(42);
      const mockActionObject = jest.fn().mockResolvedValue({ key: 'value' });
      const mockActionArray = jest.fn().mockResolvedValue([1, 2, 3]);

      const result1 = await service.execute(AgentType.JOB_DISCOVERY, mockActionString);
      const result2 = await service.execute(AgentType.AUTO_APPLY, mockActionNumber);
      const result3 = await service.execute(AgentType.RESUME_PARSER, mockActionObject);
      const result4 = await service.execute(AgentType.INTERVIEW_PREP, mockActionArray);

      expect(result1).toBe('string');
      expect(result2).toBe(42);
      expect(result3).toEqual({ key: 'value' });
      expect(result4).toEqual([1, 2, 3]);
    });
  });
});
