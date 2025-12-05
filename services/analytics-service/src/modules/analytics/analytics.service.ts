import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { AnalyticsEvent, EventType, EventCategory } from './entities/analytics-event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { QueryAnalyticsDto, ExportAnalyticsDto } from './dto/query-analytics.dto';
import {
  DashboardMetricsDto,
  ApplicationFunnelDto,
  PaginatedActivityDto,
  ActivityItemDto,
  EventResponseDto,
} from './dto/analytics-response.dto';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepository: Repository<AnalyticsEvent>,
  ) {}

  async trackEvent(
    createEventDto: CreateEventDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<EventResponseDto> {
    try {
      const event = this.analyticsRepository.create({
        ...createEventDto,
        userAgent,
        ipAddress,
        eventDate: new Date(),
        isSuccessful: createEventDto.isSuccessful ?? true,
      });

      const savedEvent = await this.analyticsRepository.save(event);

      this.logger.log(`Event tracked: ${savedEvent.eventType} - ${savedEvent.id}`);

      return {
        id: savedEvent.id,
        eventType: savedEvent.eventType,
        category: savedEvent.category,
        timestamp: savedEvent.timestamp.toISOString(),
        success: true,
      };
    } catch (error) {
      this.logger.error('Failed to track event', error.stack);
      throw error;
    }
  }

  async getDashboardMetrics(query: QueryAnalyticsDto): Promise<DashboardMetricsDto> {
    const { startDate, endDate } = this.getDateRange(query);

    try {
      // Total users (unique user IDs)
      const totalUsersQuery = await this.analyticsRepository
        .createQueryBuilder('event')
        .select('COUNT(DISTINCT event.userId)', 'count')
        .where('event.userId IS NOT NULL')
        .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne();

      // Total applications
      const totalApplicationsQuery = await this.analyticsRepository
        .count({
          where: {
            eventType: EventType.APPLICATION_SUBMITTED,
            timestamp: Between(startDate, endDate),
          },
        });

      // Today's applications
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      const todayApplications = await this.analyticsRepository.count({
        where: {
          eventType: EventType.APPLICATION_SUBMITTED,
          timestamp: Between(todayStart, todayEnd),
        },
      });

      // Active users today
      const activeUsersToday = await this.analyticsRepository
        .createQueryBuilder('event')
        .select('COUNT(DISTINCT event.userId)', 'count')
        .where('event.userId IS NOT NULL')
        .andWhere('event.timestamp BETWEEN :todayStart AND :todayEnd', { todayStart, todayEnd })
        .getRawOne();

      // Success rate
      const successfulApps = await this.analyticsRepository.count({
        where: {
          eventType: EventType.APPLICATION_ACCEPTED,
          timestamp: Between(startDate, endDate),
        },
      });
      const successRate = totalApplicationsQuery > 0
        ? (successfulApps / totalApplicationsQuery) * 100
        : 0;

      // Total page views
      const totalPageViews = await this.analyticsRepository.count({
        where: {
          eventType: EventType.PAGE_VIEW,
          timestamp: Between(startDate, endDate),
        },
      });

      // Average session duration
      const avgDurationQuery = await this.analyticsRepository
        .createQueryBuilder('event')
        .select('AVG(event.duration)', 'avg')
        .where('event.duration IS NOT NULL')
        .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getRawOne();
      const avgSessionDuration = avgDurationQuery.avg ? parseFloat(avgDurationQuery.avg) / 60000 : 0;

      // Application trend (last 7 days)
      const applicationTrend = await this.getApplicationTrend(startDate, endDate);

      // Status distribution
      const statusDistribution = await this.getStatusDistribution(startDate, endDate);

      return {
        totalUsers: parseInt(totalUsersQuery.count) || 0,
        totalApplications: totalApplicationsQuery,
        todayApplications,
        activeUsersToday: parseInt(activeUsersToday.count) || 0,
        successRate: parseFloat(successRate.toFixed(2)),
        totalPageViews,
        avgSessionDuration: parseFloat(avgSessionDuration.toFixed(2)),
        applicationTrend,
        statusDistribution,
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard metrics', error.stack);
      throw error;
    }
  }

  async getApplicationFunnel(query: QueryAnalyticsDto): Promise<ApplicationFunnelDto> {
    const { startDate, endDate } = this.getDateRange(query);

    try {
      const jobViews = await this.analyticsRepository.count({
        where: {
          eventType: EventType.JOB_VIEWED,
          timestamp: Between(startDate, endDate),
        },
      });

      const jobSaves = await this.analyticsRepository.count({
        where: {
          eventType: EventType.JOB_SAVED,
          timestamp: Between(startDate, endDate),
        },
      });

      const applicationsSubmitted = await this.analyticsRepository.count({
        where: {
          eventType: EventType.APPLICATION_SUBMITTED,
          timestamp: Between(startDate, endDate),
        },
      });

      const applicationsAccepted = await this.analyticsRepository.count({
        where: {
          eventType: EventType.APPLICATION_ACCEPTED,
          timestamp: Between(startDate, endDate),
        },
      });

      // Estimate applications started (could be saved + submitted)
      const applicationsStarted = jobSaves + applicationsSubmitted;

      const conversionRate = jobViews > 0
        ? (applicationsSubmitted / jobViews) * 100
        : 0;

      const successRate = applicationsSubmitted > 0
        ? (applicationsAccepted / applicationsSubmitted) * 100
        : 0;

      const funnelStages = [
        {
          stage: 'viewed',
          count: jobViews,
          percentage: 100
        },
        {
          stage: 'saved',
          count: jobSaves,
          percentage: jobViews > 0 ? parseFloat(((jobSaves / jobViews) * 100).toFixed(2)) : 0
        },
        {
          stage: 'applied',
          count: applicationsSubmitted,
          percentage: jobViews > 0 ? parseFloat(((applicationsSubmitted / jobViews) * 100).toFixed(2)) : 0
        },
        {
          stage: 'accepted',
          count: applicationsAccepted,
          percentage: jobViews > 0 ? parseFloat(((applicationsAccepted / jobViews) * 100).toFixed(2)) : 0
        },
      ];

      return {
        jobViews,
        jobSaves,
        applicationsStarted,
        applicationsSubmitted,
        applicationsAccepted,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        successRate: parseFloat(successRate.toFixed(2)),
        funnelStages,
      };
    } catch (error) {
      this.logger.error('Failed to get application funnel', error.stack);
      throw error;
    }
  }

  async getRecentActivity(query: QueryAnalyticsDto): Promise<PaginatedActivityDto> {
    const { startDate, endDate } = this.getDateRange(query);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    try {
      const queryBuilder = this.analyticsRepository
        .createQueryBuilder('event')
        .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

      if (query.userId) {
        queryBuilder.andWhere('event.userId = :userId', { userId: query.userId });
      }

      if (query.eventType) {
        queryBuilder.andWhere('event.eventType = :eventType', { eventType: query.eventType });
      }

      if (query.category) {
        queryBuilder.andWhere('event.category = :category', { category: query.category });
      }

      const [events, total] = await queryBuilder
        .orderBy('event.timestamp', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      const items: ActivityItemDto[] = events.map(event => ({
        id: event.id,
        eventType: event.eventType,
        category: event.category,
        userId: event.userId,
        description: this.generateEventDescription(event),
        timestamp: event.timestamp.toISOString(),
        metadata: event.metadata,
      }));

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Failed to get recent activity', error.stack);
      throw error;
    }
  }

  async exportAnalytics(query: ExportAnalyticsDto): Promise<any> {
    const { startDate, endDate } = this.getDateRange(query);
    const format = query.format || 'csv';

    try {
      const queryBuilder = this.analyticsRepository
        .createQueryBuilder('event')
        .where('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate });

      if (query.userId) {
        queryBuilder.andWhere('event.userId = :userId', { userId: query.userId });
      }

      if (query.eventType) {
        queryBuilder.andWhere('event.eventType = :eventType', { eventType: query.eventType });
      }

      if (query.category) {
        queryBuilder.andWhere('event.category = :category', { category: query.category });
      }

      const events = await queryBuilder
        .orderBy('event.timestamp', 'DESC')
        .limit(50000) // Max export limit
        .getMany();

      if (format === 'json') {
        return events;
      }

      // Convert to CSV
      return this.convertToCSV(events);
    } catch (error) {
      this.logger.error('Failed to export analytics', error.stack);
      throw error;
    }
  }

  private async getApplicationTrend(startDate: Date, endDate: Date): Promise<Array<{ date: string; count: number }>> {
    const results = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('DATE(event.timestamp)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('event.eventType = :eventType', { eventType: EventType.APPLICATION_SUBMITTED })
      .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(event.timestamp)')
      .orderBy('DATE(event.timestamp)', 'ASC')
      .getRawMany();

    return results.map(r => ({
      date: format(new Date(r.date), 'yyyy-MM-dd'),
      count: parseInt(r.count),
    }));
  }

  private async getStatusDistribution(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const statusEvents = [
      EventType.APPLICATION_ACCEPTED,
      EventType.APPLICATION_REJECTED,
      EventType.APPLICATION_SUBMITTED,
    ];

    const results = await this.analyticsRepository
      .createQueryBuilder('event')
      .select('event.eventType', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('event.eventType IN (:...statusEvents)', { statusEvents })
      .andWhere('event.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('event.eventType')
      .getRawMany();

    const distribution: Record<string, number> = {
      accepted: 0,
      rejected: 0,
      pending: 0,
    };

    results.forEach(r => {
      if (r.status === EventType.APPLICATION_ACCEPTED) {
        distribution.accepted = parseInt(r.count);
      } else if (r.status === EventType.APPLICATION_REJECTED) {
        distribution.rejected = parseInt(r.count);
      } else if (r.status === EventType.APPLICATION_SUBMITTED) {
        distribution.pending = parseInt(r.count);
      }
    });

    return distribution;
  }

  private getDateRange(query: QueryAnalyticsDto): { startDate: Date; endDate: Date } {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : subDays(endDate, 30);

    return { startDate, endDate };
  }

  private generateEventDescription(event: AnalyticsEvent): string {
    const descriptions: Record<EventType, string> = {
      [EventType.PAGE_VIEW]: `Page viewed: ${event.path || 'unknown'}`,
      [EventType.APPLICATION_SUBMITTED]: 'Application submitted',
      [EventType.APPLICATION_VIEWED]: 'Application viewed',
      [EventType.APPLICATION_ACCEPTED]: 'Application accepted',
      [EventType.APPLICATION_REJECTED]: 'Application rejected',
      [EventType.JOB_SEARCHED]: `Job searched: ${event.metadata?.query || ''}`,
      [EventType.JOB_VIEWED]: 'Job posting viewed',
      [EventType.JOB_SAVED]: 'Job posting saved',
      [EventType.RESUME_GENERATED]: 'Resume generated',
      [EventType.COVER_LETTER_GENERATED]: 'Cover letter generated',
      [EventType.AI_SUGGESTION_USED]: 'AI suggestion used',
      [EventType.USER_REGISTERED]: 'User registered',
      [EventType.USER_LOGIN]: 'User logged in',
      [EventType.PROFILE_UPDATED]: 'Profile updated',
      [EventType.EXPORT_DATA]: 'Data exported',
      [EventType.ERROR_OCCURRED]: `Error: ${event.errorMessage || 'unknown'}`,
    };

    return descriptions[event.eventType] || event.eventType;
  }

  private convertToCSV(events: AnalyticsEvent[]): string {
    if (events.length === 0) {
      return '';
    }

    const headers = [
      'ID',
      'Event Type',
      'Category',
      'User ID',
      'Session ID',
      'Application ID',
      'Job ID',
      'Timestamp',
      'Path',
      'Success',
      'Duration',
      'Metadata',
    ];

    const rows = events.map(event => [
      event.id,
      event.eventType,
      event.category,
      event.userId || '',
      event.sessionId || '',
      event.applicationId || '',
      event.jobId || '',
      event.timestamp.toISOString(),
      event.path || '',
      event.isSuccessful,
      event.duration || '',
      JSON.stringify(event.metadata || {}),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}
