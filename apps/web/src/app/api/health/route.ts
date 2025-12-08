import { NextResponse } from 'next/server';

/**
 * Basic health check endpoint
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'web-app',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
