import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { CohortService } from './cohort.service';
import { ExportUtil } from './utils/export.util';
import { TenantLicenseGuard } from './guards/tenant-license.guard';
import { TenantIsolationMiddleware } from './middleware/tenant-isolation.middleware';
import { TenantRateLimitMiddleware } from './middleware/rate-limit.middleware';
import { Tenant } from './entities/tenant.entity';
import { TenantUser } from './entities/tenant-user.entity';
import { TenantLicense } from './entities/tenant-license.entity';
import { TenantDepartment } from './entities/tenant-department.entity';
import { PlacementTracking } from './entities/placement-tracking.entity';
import { Cohort } from './entities/cohort.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      TenantUser,
      TenantLicense,
      TenantDepartment,
      PlacementTracking,
      Cohort,
    ]),
  ],
  controllers: [TenantController],
  providers: [
    TenantService,
    CohortService,
    ExportUtil,
    TenantLicenseGuard,
  ],
  exports: [TenantService, CohortService],
})
export class TenantModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantIsolationMiddleware, TenantRateLimitMiddleware)
      .forRoutes(
        { path: 'api/v1/tenants/*', method: RequestMethod.ALL },
      );
  }
}
