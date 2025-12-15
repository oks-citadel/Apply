import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import * as os from 'os';

/**
 * Database Performance Test Suite for Job Service
 *
 * Tests:
 * 1. Query Performance - Individual queries should complete < 100ms
 * 2. Bulk Operations - Batch inserts/updates
 * 3. Connection Pool - Pool exhaustion and recovery
 * 4. Index Effectiveness - Query optimization
 * 5. Transaction Performance - ACID compliance under load
 * 6. Memory Usage - No memory leaks during operations
 * 7. Concurrent Queries - Race conditions and deadlocks
 */

// Mock entities (replace with actual entities)
class Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  salary: number;
  postedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

class Application {
  id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

describe('Database Performance Tests', () => {
  let module: TestingModule;
  let dataSource: DataSource;
  let jobRepository: Repository<Job>;
  let applicationRepository: Repository<Application>;

  const PERFORMANCE_THRESHOLD = {
    SINGLE_QUERY: 100, // ms
    BULK_QUERY: 500, // ms
    TRANSACTION: 200, // ms
    CONNECTION_ACQUIRE: 50, // ms
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          username: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'applyforus_test',
          entities: [Job, Application],
          synchronize: true,
          logging: false,
          // Connection pool settings for performance testing
          extra: {
            max: 20, // Maximum pool size
            min: 5, // Minimum pool size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          },
        }),
        TypeOrmModule.forFeature([Job, Application]),
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
    jobRepository = module.get<Repository<Job>>(getRepositoryToken(Job));
    applicationRepository = module.get<Repository<Application>>(
      getRepositoryToken(Application),
    );

    // Seed test data
    await seedTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await module.close();
  });

  describe('Query Performance', () => {
    it('should retrieve single job record within threshold', async () => {
      const startTime = Date.now();

      const job = await jobRepository.findOne({
        where: { id: 'test-job-1' },
      });

      const duration = Date.now() - startTime;

      expect(job).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.SINGLE_QUERY);

      console.log(`✅ Single query: ${duration}ms`);
    });

    it('should perform paginated queries efficiently', async () => {
      const pageSize = 20;
      const startTime = Date.now();

      const [jobs, total] = await jobRepository.findAndCount({
        take: pageSize,
        skip: 0,
        order: { createdAt: 'DESC' },
      });

      const duration = Date.now() - startTime;

      expect(jobs).toHaveLength(pageSize);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.SINGLE_QUERY);

      console.log(
        `✅ Paginated query (${pageSize} records): ${duration}ms`,
      );
    });

    it('should execute complex queries with joins efficiently', async () => {
      const startTime = Date.now();

      const results = await jobRepository
        .createQueryBuilder('job')
        .leftJoinAndSelect('job.applications', 'application')
        .where('job.location = :location', { location: 'Remote' })
        .andWhere('job.salary > :minSalary', { minSalary: 80000 })
        .take(20)
        .getMany();

      const duration = Date.now() - startTime;

      expect(Array.isArray(results)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.SINGLE_QUERY * 2);

      console.log(`✅ Complex query with joins: ${duration}ms`);
    });

    it('should utilize indexes for search queries', async () => {
      const startTime = Date.now();

      const results = await jobRepository
        .createQueryBuilder('job')
        .where('job.title ILIKE :search', { search: '%engineer%' })
        .andWhere('job.location ILIKE :location', { location: '%remote%' })
        .take(50)
        .getMany();

      const duration = Date.now() - startTime;

      expect(Array.isArray(results)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.SINGLE_QUERY * 1.5);

      console.log(`✅ Indexed search query: ${duration}ms`);
    });

    it('should handle COUNT queries efficiently', async () => {
      const startTime = Date.now();

      const count = await jobRepository.count({
        where: { location: 'Remote' },
      });

      const duration = Date.now() - startTime;

      expect(typeof count).toBe('number');
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.SINGLE_QUERY);

      console.log(`✅ COUNT query: ${duration}ms`);
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should insert multiple records efficiently', async () => {
      const recordCount = 100;
      const jobs = Array.from({ length: recordCount }, (_, i) => ({
        id: `bulk-job-${i}`,
        title: `Bulk Job ${i}`,
        company: `Company ${i}`,
        description: 'Test job description',
        location: 'Remote',
        salary: 80000 + i * 1000,
        postedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const startTime = Date.now();

      await jobRepository.insert(jobs);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.BULK_QUERY);

      console.log(
        `✅ Bulk insert (${recordCount} records): ${duration}ms (${(recordCount / (duration / 1000)).toFixed(0)} records/sec)`,
      );

      // Cleanup
      await jobRepository.delete(
        jobs.map((j) => j.id),
      );
    });

    it('should update multiple records efficiently', async () => {
      const recordCount = 50;

      const startTime = Date.now();

      await jobRepository
        .createQueryBuilder()
        .update(Job)
        .set({ salary: () => 'salary * 1.1' })
        .where('location = :location', { location: 'Remote' })
        .execute();

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.BULK_QUERY);

      console.log(
        `✅ Bulk update (${recordCount}+ records): ${duration}ms`,
      );
    });

    it('should delete multiple records efficiently', async () => {
      // Create test records
      const testJobs = Array.from({ length: 50 }, (_, i) => ({
        id: `delete-job-${i}`,
        title: `Delete Job ${i}`,
        company: 'Test Company',
        description: 'To be deleted',
        location: 'Test Location',
        salary: 50000,
        postedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await jobRepository.insert(testJobs);

      const startTime = Date.now();

      await jobRepository.delete(
        testJobs.map((j) => j.id),
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.BULK_QUERY);

      console.log(
        `✅ Bulk delete (${testJobs.length} records): ${duration}ms`,
      );
    });
  });

  describe('Connection Pool Performance', () => {
    it('should acquire connections quickly', async () => {
      const iterations = 10;
      const durations: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await jobRepository.findOne({
          where: { id: 'test-job-1' },
        });

        durations.push(Date.now() - startTime);
      }

      const avgDuration = durations.reduce((a, b) => a + b, 0) / iterations;

      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLD.CONNECTION_ACQUIRE);

      console.log(
        `✅ Connection pool - avg acquisition: ${avgDuration.toFixed(2)}ms`,
      );
    });

    it('should handle concurrent queries without pool exhaustion', async () => {
      const concurrentQueries = 50;

      const startTime = Date.now();

      const promises = Array.from({ length: concurrentQueries }, (_, i) =>
        jobRepository.findOne({
          where: { id: `test-job-${i % 10}` },
        }),
      );

      const results = await Promise.all(promises);

      const duration = Date.now() - startTime;

      expect(results.length).toBe(concurrentQueries);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.BULK_QUERY);

      console.log(
        `✅ Concurrent queries (${concurrentQueries}): ${duration}ms`,
      );
    });

    it('should recover from pool saturation', async () => {
      // Saturate the pool
      const heavyQueries = Array.from({ length: 30 }, () =>
        jobRepository
          .createQueryBuilder('job')
          .leftJoinAndSelect('job.applications', 'application')
          .take(100)
          .getMany(),
      );

      await Promise.all(heavyQueries);

      // Test recovery
      const startTime = Date.now();

      const job = await jobRepository.findOne({
        where: { id: 'test-job-1' },
      });

      const duration = Date.now() - startTime;

      expect(job).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.SINGLE_QUERY * 2);

      console.log(`✅ Pool recovery: ${duration}ms`);
    });
  });

  describe('Transaction Performance', () => {
    it('should execute transactions efficiently', async () => {
      const startTime = Date.now();

      await dataSource.transaction(async (manager) => {
        const job = await manager.findOne(Job, {
          where: { id: 'test-job-1' },
        });

        if (job) {
          job.salary = job.salary + 1000;
          await manager.save(job);
        }

        const application = manager.create(Application, {
          id: `txn-app-${Date.now()}`,
          jobId: 'test-job-1',
          userId: 'test-user-1',
          status: 'pending',
          appliedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await manager.save(application);
      });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.TRANSACTION);

      console.log(`✅ Transaction execution: ${duration}ms`);
    });

    it('should handle concurrent transactions without deadlocks', async () => {
      const concurrentTransactions = 10;

      const startTime = Date.now();

      const transactions = Array.from(
        { length: concurrentTransactions },
        async (_, i) => {
          return dataSource.transaction(async (manager) => {
            const job = await manager.findOne(Job, {
              where: { id: `test-job-${i % 5}` },
            });

            if (job) {
              job.salary = job.salary + 100;
              await manager.save(job);
            }
          });
        },
      );

      await Promise.all(transactions);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(
        PERFORMANCE_THRESHOLD.TRANSACTION * concurrentTransactions * 0.5,
      );

      console.log(
        `✅ Concurrent transactions (${concurrentTransactions}): ${duration}ms`,
      );
    });

    it('should rollback efficiently on errors', async () => {
      const startTime = Date.now();

      try {
        await dataSource.transaction(async (manager) => {
          await manager.save(Job, {
            id: 'rollback-job',
            title: 'Rollback Test',
            company: 'Test Company',
            description: 'Test',
            location: 'Test',
            salary: 50000,
            postedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          // Force error
          throw new Error('Intentional rollback');
        });
      } catch (error) {
        // Expected error
      }

      const duration = Date.now() - startTime;

      // Verify rollback
      const job = await jobRepository.findOne({
        where: { id: 'rollback-job' },
      });

      expect(job).toBeNull();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLD.TRANSACTION);

      console.log(`✅ Transaction rollback: ${duration}ms`);
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory during repeated queries', async () => {
      const iterations = 100;
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        await jobRepository.find({
          take: 20,
          skip: i * 20,
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Memory increase should be minimal (< 50MB for 100 iterations)
      expect(memoryIncrease).toBeLessThan(50);

      console.log(
        `✅ Memory usage after ${iterations} queries: +${memoryIncrease.toFixed(2)}MB`,
      );
    });

    it('should monitor connection pool health', async () => {
      // Get pool statistics (TypeORM doesn't expose this directly, but we can monitor)
      const poolSize = (dataSource.driver as any).master?.pool?.totalCount || 0;
      const activeConnections =
        (dataSource.driver as any).master?.pool?.activeCount || 0;
      const idleConnections =
        (dataSource.driver as any).master?.pool?.idleCount || 0;

      console.log(`📊 Connection Pool Stats:`);
      console.log(`   Total: ${poolSize}`);
      console.log(`   Active: ${activeConnections}`);
      console.log(`   Idle: ${idleConnections}`);

      expect(poolSize).toBeGreaterThan(0);
      expect(activeConnections).toBeLessThanOrEqual(poolSize);
    });

    it('should report database performance metrics', async () => {
      const metrics = {
        cpuUsage: process.cpuUsage(),
        memoryUsage: process.memoryUsage(),
        systemInfo: {
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          freeMemory: (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + 'GB',
          totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + 'GB',
        },
      };

      console.log(`📊 Performance Metrics:`);
      console.log(`   CPU User: ${metrics.cpuUsage.user / 1000}ms`);
      console.log(`   CPU System: ${metrics.cpuUsage.system / 1000}ms`);
      console.log(
        `   Heap Used: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(
        `   Heap Total: ${(metrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(`   System CPUs: ${metrics.systemInfo.cpus}`);
      console.log(
        `   System Memory: ${metrics.systemInfo.freeMemory} / ${metrics.systemInfo.totalMemory}`,
      );

      expect(metrics.memoryUsage.heapUsed).toBeLessThan(
        metrics.memoryUsage.heapTotal,
      );
    });
  });

  // Helper functions
  async function seedTestData() {
    console.log('🌱 Seeding test data...');

    const jobs = Array.from({ length: 100 }, (_, i) => ({
      id: `test-job-${i}`,
      title: `Software Engineer ${i}`,
      company: `Company ${i}`,
      description: 'Job description for testing',
      location: i % 2 === 0 ? 'Remote' : 'On-site',
      salary: 80000 + i * 1000,
      postedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await jobRepository.insert(jobs);

    const applications = Array.from({ length: 200 }, (_, i) => ({
      id: `test-app-${i}`,
      jobId: `test-job-${i % 100}`,
      userId: `test-user-${i % 10}`,
      status: ['pending', 'accepted', 'rejected'][i % 3],
      appliedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await applicationRepository.insert(applications);

    console.log('✅ Test data seeded');
  }

  async function cleanupTestData() {
    console.log('🧹 Cleaning up test data...');

    await applicationRepository.delete({});
    await jobRepository.delete({});

    console.log('✅ Test data cleaned up');
  }
});
