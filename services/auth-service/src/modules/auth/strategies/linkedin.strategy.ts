import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';

import type { AuthService } from '../auth.service';
import type { ConfigService } from '@nestjs/config';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('linkedin.clientId'),
      clientSecret: configService.get<string>('linkedin.clientSecret'),
      callbackURL: configService.get<string>('linkedin.callbackUrl'),
      scope: ['r_emailaddress', 'r_liteprofile'],
      state: true,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      const { id, emails, name, photos } = profile;

      // LinkedIn profile structure
      const email = emails && emails.length > 0 ? emails[0].value : null;

      if (!email) {
        return done(new Error('Email not provided by LinkedIn'), null);
      }

      const user = await this.authService.validateOAuthUser({
        providerId: id,
        provider: 'linkedin',
        email,
        firstName: name?.givenName || null,
        lastName: name?.familyName || null,
        profilePicture: photos && photos.length > 0 ? photos[0].value : null,
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
