import { createParamDecorator } from '@nestjs/common';

import type { User } from '../../modules/users/entities/user.entity';
import type { ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
