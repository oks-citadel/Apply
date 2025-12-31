import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark routes as public (no authentication required)
 * Use this for health check endpoints and other public APIs
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
