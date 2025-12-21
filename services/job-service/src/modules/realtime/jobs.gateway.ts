import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

interface JobSearchFilter {
  keywords?: string;
  location?: string;
  remote?: boolean;
  experienceLevel?: string[];
  employmentType?: string[];
  salaryMin?: number;
  salaryMax?: number;
  sources?: string[];
  postedAfter?: Date;
}

interface SubscribedClient {
  socketId: string;
  userId?: string;
  filters: JobSearchFilter;
  lastJobTimestamp: Date;
}

@Injectable()
@WebSocketGateway({
  namespace: '/jobs',
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class JobsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(JobsGateway.name);
  private subscribedClients: Map<string, SubscribedClient> = new Map();
  private jobBuffer: Job[] = [];
  private readonly BUFFER_FLUSH_INTERVAL = 2000; // 2 seconds
  private readonly MAX_BUFFER_SIZE = 100;

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');

    // Start buffer flush interval
    setInterval(() => this.flushJobBuffer(), this.BUFFER_FLUSH_INTERVAL);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send initial connection acknowledgment
    client.emit('connected', {
      socketId: client.id,
      timestamp: new Date().toISOString(),
      message: 'Connected to ApplyForUs Job Stream',
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.subscribedClients.delete(client.id);
  }

  /**
   * Subscribe to real-time job updates with filters
   */
  @SubscribeMessage('subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() filters: JobSearchFilter,
  ): Promise<void> {
    this.logger.log(`Client ${client.id} subscribing with filters:`, filters);

    // Store client subscription
    this.subscribedClients.set(client.id, {
      socketId: client.id,
      filters,
      lastJobTimestamp: new Date(),
    });

    // Send initial batch of recent jobs matching filters
    const recentJobs = await this.getRecentJobs(filters, 50);

    client.emit('initial_jobs', {
      jobs: recentJobs,
      count: recentJobs.length,
      timestamp: new Date().toISOString(),
    });

    client.emit('subscribed', {
      filters,
      message: 'Successfully subscribed to job updates',
    });
  }

  /**
   * Unsubscribe from job updates
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket): void {
    this.subscribedClients.delete(client.id);
    client.emit('unsubscribed', { message: 'Unsubscribed from job updates' });
  }

  /**
   * Update subscription filters
   */
  @SubscribeMessage('update_filters')
  async handleUpdateFilters(
    @ConnectedSocket() client: Socket,
    @MessageBody() filters: JobSearchFilter,
  ): Promise<void> {
    const existing = this.subscribedClients.get(client.id);
    if (existing) {
      existing.filters = filters;
      existing.lastJobTimestamp = new Date();

      // Send jobs matching new filters
      const jobs = await this.getRecentJobs(filters, 50);
      client.emit('filter_updated', { jobs, filters });
    }
  }

  /**
   * Request more jobs (pagination)
   */
  @SubscribeMessage('load_more')
  async handleLoadMore(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { before: string; limit?: number },
  ): Promise<void> {
    const subscription = this.subscribedClients.get(client.id);
    if (!subscription) {
      client.emit('error', { message: 'Not subscribed' });
      return;
    }

    const jobs = await this.getJobsBefore(
      subscription.filters,
      new Date(data.before),
      data.limit || 20,
    );

    client.emit('more_jobs', {
      jobs,
      hasMore: jobs.length === (data.limit || 20),
    });
  }

  /**
   * Add new job to buffer for broadcasting
   */
  addNewJob(job: Job): void {
    this.jobBuffer.push(job);

    if (this.jobBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.flushJobBuffer();
    }
  }

  /**
   * Broadcast new jobs to subscribed clients
   */
  private async flushJobBuffer(): Promise<void> {
    if (this.jobBuffer.length === 0) return;

    const jobs = [...this.jobBuffer];
    this.jobBuffer = [];

    // Group clients by filter compatibility for efficient broadcasting
    for (const [socketId, client] of this.subscribedClients) {
      const matchingJobs = jobs.filter((job) => this.matchesFilter(job, client.filters));

      if (matchingJobs.length > 0) {
        this.server.to(socketId).emit('new_jobs', {
          jobs: matchingJobs,
          count: matchingJobs.length,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Check if a job matches the given filter
   */
  private matchesFilter(job: Job, filter: JobSearchFilter): boolean {
    // Keyword filter
    if (filter.keywords) {
      const keywords = filter.keywords.toLowerCase();
      const searchText = `${job.title} ${job.description} ${job.company_name}`.toLowerCase();
      if (!searchText.includes(keywords)) {
        return false;
      }
    }

    // Location filter
    if (filter.location) {
      const location = filter.location.toLowerCase();
      const jobLocation = `${job.location || ''} ${job.city || ''} ${job.state || ''} ${job.country || ''}`.toLowerCase();
      if (!jobLocation.includes(location)) {
        return false;
      }
    }

    // Remote filter
    if (filter.remote !== undefined && filter.remote) {
      if (job.remote_type !== 'remote') {
        return false;
      }
    }

    // Experience level filter
    if (filter.experienceLevel && filter.experienceLevel.length > 0) {
      if (!filter.experienceLevel.includes(job.experience_level)) {
        return false;
      }
    }

    // Employment type filter
    if (filter.employmentType && filter.employmentType.length > 0) {
      if (!filter.employmentType.includes(job.employment_type)) {
        return false;
      }
    }

    // Salary filter
    if (filter.salaryMin && job.salary_max && job.salary_max < filter.salaryMin) {
      return false;
    }
    if (filter.salaryMax && job.salary_min && job.salary_min > filter.salaryMax) {
      return false;
    }

    // Source filter
    if (filter.sources && filter.sources.length > 0) {
      if (!filter.sources.includes(job.source)) {
        return false;
      }
    }

    // Posted after filter
    if (filter.postedAfter && job.posted_at < filter.postedAfter) {
      return false;
    }

    return true;
  }

  /**
   * Get recent jobs matching filters
   */
  private async getRecentJobs(filters: JobSearchFilter, limit: number): Promise<Job[]> {
    const query = this.jobRepository.createQueryBuilder('job')
      .where('job.is_active = :active', { active: true })
      .orderBy('job.posted_at', 'DESC')
      .take(limit);

    this.applyFiltersToQuery(query, filters);

    return query.getMany();
  }

  /**
   * Get jobs posted before a certain date
   */
  private async getJobsBefore(
    filters: JobSearchFilter,
    before: Date,
    limit: number,
  ): Promise<Job[]> {
    const query = this.jobRepository.createQueryBuilder('job')
      .where('job.is_active = :active', { active: true })
      .andWhere('job.posted_at < :before', { before })
      .orderBy('job.posted_at', 'DESC')
      .take(limit);

    this.applyFiltersToQuery(query, filters);

    return query.getMany();
  }

  /**
   * Apply filters to a query builder
   */
  private applyFiltersToQuery(query: any, filters: JobSearchFilter): void {
    if (filters.keywords) {
      query.andWhere(
        '(LOWER(job.title) LIKE :keywords OR LOWER(job.description) LIKE :keywords)',
        { keywords: `%${filters.keywords.toLowerCase()}%` },
      );
    }

    if (filters.location) {
      query.andWhere(
        '(LOWER(job.location) LIKE :location OR LOWER(job.city) LIKE :location)',
        { location: `%${filters.location.toLowerCase()}%` },
      );
    }

    if (filters.remote) {
      query.andWhere('job.remote_type = :remoteType', { remoteType: 'remote' });
    }

    if (filters.experienceLevel && filters.experienceLevel.length > 0) {
      query.andWhere('job.experience_level IN (:...levels)', {
        levels: filters.experienceLevel,
      });
    }

    if (filters.employmentType && filters.employmentType.length > 0) {
      query.andWhere('job.employment_type IN (:...types)', {
        types: filters.employmentType,
      });
    }

    if (filters.sources && filters.sources.length > 0) {
      query.andWhere('job.source IN (:...sources)', { sources: filters.sources });
    }

    if (filters.postedAfter) {
      query.andWhere('job.posted_at >= :postedAfter', { postedAfter: filters.postedAfter });
    }
  }

  /**
   * Broadcast statistics to all clients
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async broadcastStats(): Promise<void> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const stats = {
      totalActiveJobs: await this.jobRepository.count({ where: { is_active: true } }),
      newJobsToday: await this.jobRepository.count({
        where: {
          is_active: true,
          created_at: MoreThan(oneDayAgo),
        },
      }),
      connectedClients: this.subscribedClients.size,
      timestamp: new Date().toISOString(),
    };

    this.server.emit('stats', stats);
  }

  /**
   * Get gateway statistics
   */
  getStats(): {
    connectedClients: number;
    subscribedClients: number;
    bufferSize: number;
  } {
    return {
      connectedClients: this.server?.sockets?.sockets?.size || 0,
      subscribedClients: this.subscribedClients.size,
      bufferSize: this.jobBuffer.length,
    };
  }
}
