import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('jwt.secret'),
  signOptions: {
    expiresIn: configService.get<string>('jwt.accessTokenExpiry'),
    issuer: configService.get<string>('jwt.issuer'),
    audience: configService.get<string>('jwt.audience'),
  },
});

export const jwtRefreshConfig = (configService: ConfigService): JwtModuleOptions => ({
  secret: configService.get<string>('jwt.secret'),
  signOptions: {
    expiresIn: configService.get<string>('jwt.refreshTokenExpiry'),
    issuer: configService.get<string>('jwt.issuer'),
    audience: configService.get<string>('jwt.audience'),
  },
});
