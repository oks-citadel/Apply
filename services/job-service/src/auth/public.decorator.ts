import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route as publicly accessible (no authentication required)
 * Use for health checks, public job listings, etc.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
