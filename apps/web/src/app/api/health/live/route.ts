import { NextResponse } from 'next/server';

/**
 * Liveness probe endpoint
 * GET /api/health/live
 * Used by Kubernetes to determine if the service is alive
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'web-app',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      heapUsed: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      rss: Math.round((process.memoryUsage().rss / 1024 / 1024) * 100) / 100,
    },
  });
}
