import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as publicly accessible (no authentication required)
 * Use sparingly - only for health checks and truly public endpoints
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
