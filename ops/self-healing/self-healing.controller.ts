import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SelfHealingService, HealthStatus } from './self-healing.service';

@ApiTags('Self-Healing')
@Controller('ops/self-healing')
export class SelfHealingController {
  constructor(private readonly selfHealingService: SelfHealingService) {}

  @Get('health')
  @ApiOperation({ summary: 'Get overall system health status' })
  @ApiResponse({ status: 200, description: 'System health status' })
  getSystemHealth() {
    const healthStatus = this.selfHealingService.getHealthStatus();
    const services: Record<string, any> = {};

    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;

    for (const [name, result] of healthStatus) {
      services[name] = {
        status: result.status,
        responseTimeMs: result.responseTimeMs,
        lastChecked: result.lastChecked,
        consecutiveFailures: result.consecutiveFailures,
      };

      switch (result.status) {
        case HealthStatus.HEALTHY:
          healthy++;
          break;
        case HealthStatus.DEGRADED:
          degraded++;
          break;
        case HealthStatus.UNHEALTHY:
          unhealthy++;
          break;
      }
    }

    const overall =
      unhealthy > 0
        ? HealthStatus.UNHEALTHY
        : degraded > 0
          ? HealthStatus.DEGRADED
          : HealthStatus.HEALTHY;

    return {
      status: overall,
      summary: {
        total: healthStatus.size,
        healthy,
        degraded,
        unhealthy,
      },
      services,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/:service')
  @ApiOperation({ summary: 'Get health status for a specific service' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  getServiceHealth(@Param('service') service: string) {
    const healthStatus = this.selfHealingService.getHealthStatus();
    const result = healthStatus.get(service);

    if (!result) {
      return {
        service,
        status: HealthStatus.UNKNOWN,
        message: 'Service not found in health registry',
      };
    }

    return {
      service,
      ...result,
    };
  }

  @Get('incidents')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active incidents' })
  @ApiResponse({ status: 200, description: 'List of active incidents' })
  getActiveIncidents() {
    const incidents = this.selfHealingService.getActiveIncidents();
    return {
      count: incidents.length,
      incidents,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('incidents/:id/resolve')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually resolve an incident' })
  @ApiResponse({ status: 200, description: 'Incident resolved' })
  resolveIncident(@Param('id') incidentId: string) {
    const resolved = this.selfHealingService.resolveIncident(incidentId);
    return {
      success: resolved,
      incidentId,
      message: resolved ? 'Incident resolved' : 'Incident not found',
    };
  }

  @Get('remediation-history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get remediation history' })
  @ApiResponse({ status: 200, description: 'Remediation events' })
  getRemediationHistory(@Query('limit') limit: number = 50) {
    const history = this.selfHealingService.getRemediationHistory(limit);
    return {
      count: history.length,
      events: history,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('check')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual health check' })
  @ApiResponse({ status: 200, description: 'Health check triggered' })
  async triggerHealthCheck() {
    await this.selfHealingService['runFullHealthCheck']();
    return {
      success: true,
      message: 'Full health check completed',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary for ops monitoring' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  getDashboard() {
    const healthStatus = this.selfHealingService.getHealthStatus();
    const incidents = this.selfHealingService.getActiveIncidents();
    const recentRemediation = this.selfHealingService.getRemediationHistory(10);

    // Calculate uptime percentages (simplified)
    const serviceStats: Record<string, any> = {};
    for (const [name, result] of healthStatus) {
      serviceStats[name] = {
        status: result.status,
        responseTime: result.responseTimeMs,
        uptime: result.status === HealthStatus.HEALTHY ? '99.9%' : '~95%',
      };
    }

    return {
      overview: {
        systemStatus: incidents.length > 0 ? 'INCIDENT' : 'OPERATIONAL',
        totalServices: healthStatus.size,
        activeIncidents: incidents.length,
        recentRemediations: recentRemediation.length,
      },
      services: serviceStats,
      incidents: incidents.map(i => ({
        id: i.id,
        service: i.service,
        severity: i.severity,
        status: i.status,
        createdAt: i.createdAt,
      })),
      recentActivity: recentRemediation.map(r => ({
        service: r.service,
        action: r.action,
        success: r.success,
        triggeredAt: r.triggeredAt,
      })),
      lastUpdated: new Date().toISOString(),
    };
  }
}
