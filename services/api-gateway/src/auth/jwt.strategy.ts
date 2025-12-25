import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  tier?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      this.logger.warn('Invalid JWT payload');
      throw new UnauthorizedException('Invalid token');
    }

    this.logger.debug(`JWT validated for user: ${payload.sub}`);

    // Return user object that will be attached to request
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role || 'user',
      tier: payload.tier || 'free',
    };
  }
}
