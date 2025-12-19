import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ServiceAuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateServiceToken(serviceName: string): string {
    return this.jwtService.sign({
      sub: serviceName,
      type: 'service',
      iat: Date.now(),
    });
  }

  verifyServiceToken(token: string): { sub: string; type: string } | null {
    try {
      const payload = this.jwtService.verify(token);
      return payload as { sub: string; type: string };
    } catch {
      return null;
    }
  }
}
