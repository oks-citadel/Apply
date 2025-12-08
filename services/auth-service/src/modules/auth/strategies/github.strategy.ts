import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('github.clientId'),
      clientSecret: configService.get<string>('github.clientSecret'),
      callbackURL: configService.get<string>('github.callbackUrl'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    try {
      const { id, emails, displayName, photos } = profile;

      // GitHub profile structure
      const email = emails && emails.length > 0 ? emails[0].value : null;

      if (!email) {
        return done(new Error('Email not provided by GitHub'), null);
      }

      // Parse name from displayName
      const nameParts = displayName ? displayName.split(' ') : [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

      const user = await this.authService.validateOAuthUser({
        providerId: id.toString(),
        provider: 'github',
        email: email,
        firstName: firstName,
        lastName: lastName,
        profilePicture: photos && photos.length > 0 ? photos[0].value : null,
      });

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
