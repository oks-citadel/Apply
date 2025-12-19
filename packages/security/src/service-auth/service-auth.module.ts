import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ServiceAuthService } from './service-auth.service';
import { ServiceAuthGuard } from './service-auth.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.SERVICE_JWT_SECRET || 'service-secret-change-in-production',
        signOptions: { expiresIn: '5m' },
      }),
    }),
  ],
  providers: [ServiceAuthService, ServiceAuthGuard],
  exports: [ServiceAuthService, ServiceAuthGuard],
})
export class ServiceAuthModule {}
