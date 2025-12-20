import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardMetricsDto {
  @ApiProperty({ example: 1500, description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ example: 450, description: 'Total number of applications' })
  totalApplications: number;

  @ApiProperty({ example: 120, description: 'Applications submitted today' })
  todayApplications: number;

  @ApiProperty({ example: 15, description: 'Active users today' })
  activeUsersToday: number;

  @ApiProperty({ example: 75.5, description: 'Application success rate percentage' })
  successRate: number;

  @ApiProperty({ example: 3500, description: 'Total page views' })
  totalPageViews: number;

  @ApiProperty({ example: 2.5, description: 'Average session duration in minutes' })
  avgSessionDuration: number;

  @ApiProperty({
    example: [
      { date: '2024-01-01', count: 50 },
      { date: '2024-01-02', count: 65 },
    ],
    description: 'Daily application trend',
  })
  applicationTrend: Array<{ date: string; count: number }>;

  @ApiProperty({
    example: { accepted: 45, rejected: 30, pending: 25 },
    description: 'Application status distribution',
  })
  statusDistribution: Record<string, number>;

  @ApiPropertyOptional({
    example: {
      activeContracts: 15,
      totalInterviews: 45,
      averageProgress: 65.5,
      contractsAtRisk: 3,
    },
    description: 'SLA metrics summary',
  })
  slaMetrics?: {
    activeContracts: number;
    totalInterviews: number;
    averageProgress: number;
    contractsAtRisk: number;
  };
}

export class ApplicationFunnelDto {
  @ApiProperty({ example: 1000, description: 'Total job views' })
  jobViews: number;

  @ApiProperty({ example: 500, description: 'Total job saves' })
  jobSaves: number;

  @ApiProperty({ example: 450, description: 'Total applications started' })
  applicationsStarted: number;

  @ApiProperty({ example: 350, description: 'Total applications submitted' })
  applicationsSubmitted: number;

  @ApiProperty({ example: 100, description: 'Total applications accepted' })
  applicationsAccepted: number;

  @ApiProperty({ example: 35, description: 'Conversion rate from view to submit' })
  conversionRate: number;

  @ApiProperty({ example: 28.5, description: 'Success rate of submitted applications' })
  successRate: number;

  @ApiProperty({
    example: [
      { stage: 'viewed', count: 1000, percentage: 100 },
      { stage: 'saved', count: 500, percentage: 50 },
      { stage: 'applied', count: 350, percentage: 35 },
      { stage: 'accepted', count: 100, percentage: 10 },
    ],
    description: 'Funnel breakdown by stage',
  })
  funnelStages: Array<{ stage: string; count: number; percentage: number }>;
}

export class ActivityItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Event ID' })
  id: string;

  @ApiProperty({ example: 'application_submitted', description: 'Event type' })
  eventType: string;

  @ApiProperty({ example: 'application', description: 'Event category' })
  category: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'User ID' })
  userId?: string;

  @ApiPropertyOptional({
    example: 'John Doe applied to Software Engineer position',
    description: 'Description',
  })
  description?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp' })
  timestamp: string;

  @ApiPropertyOptional({
    example: { company: 'Tech Corp', position: 'Software Engineer' },
    description: 'Metadata',
  })
  metadata?: Record<string, any>;
}

export class PaginatedActivityDto {
  @ApiProperty({ type: [ActivityItemDto], description: 'List of activity items' })
  items: ActivityItemDto[];

  @ApiProperty({ example: 100, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages: number;
}

export class EventResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Event ID' })
  id: string;

  @ApiProperty({ example: 'application_submitted', description: 'Event type' })
  eventType: string;

  @ApiProperty({ example: 'application', description: 'Event category' })
  category: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Timestamp' })
  timestamp: string;

  @ApiProperty({ example: true, description: 'Whether the event was tracked successfully' })
  success: boolean;
}
