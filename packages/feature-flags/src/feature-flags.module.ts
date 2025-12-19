import { Module, DynamicModule, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { FeatureFlagEntity } from './entities/feature-flag.entity';
import { FeatureFlagService } from './services/feature-flag.service';
import { FeatureFlagAdminService } from './services/feature-flag-admin.service';
import { FeatureFlagGuard } from './guards/feature-flag.guard';

export interface FeatureFlagsModuleOptions {
  redis?: Redis;
  isGlobal?: boolean;
}

@Module({})
export class FeatureFlagsModule {
  static forRoot(options: FeatureFlagsModuleOptions = {}): DynamicModule {
    const providers: any[] = [
      FeatureFlagService,
      FeatureFlagAdminService,
      FeatureFlagGuard,
    ];

    // Add Redis provider if instance is provided
    if (options.redis) {
      providers.push({
        provide: Redis,
        useValue: options.redis,
      });
    }

    return {
      module: FeatureFlagsModule,
      imports: [TypeOrmModule.forFeature([FeatureFlagEntity])],
      providers,
      exports: [
        FeatureFlagService,
        FeatureFlagAdminService,
        FeatureFlagGuard,
      ],
      global: options.isGlobal ?? true,
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: FeatureFlagsModule,
      imports: [TypeOrmModule.forFeature([FeatureFlagEntity])],
      providers: [FeatureFlagService, FeatureFlagAdminService, FeatureFlagGuard],
      exports: [FeatureFlagService, FeatureFlagAdminService, FeatureFlagGuard],
    };
  }
}
