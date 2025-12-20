import { Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CohortService } from './cohort.service';
import { Cohort } from './entities/cohort.entity';
import { PlacementTracking } from './entities/placement-tracking.entity';
import { TenantDepartment } from './entities/tenant-department.entity';
import { TenantLicense } from './entities/tenant-license.entity';
import { TenantUser } from './entities/tenant-user.entity';
import { Tenant } from './entities/tenant.entity';
import { TenantLicenseGuard } from './guards/tenant-license.guard';
import { TenantRateLimitMiddleware } from './middleware/rate-limit.middleware';
import { TenantIsolationMiddleware } from './middleware/tenant-isolation.middleware';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { ExportUtil } from './utils/export.util';
import { AuthModule } from '../auth/auth.module';

import type { MiddlewareConsumer} from '@nestjs/common';

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
    AuthModule,
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
