import { NextResponse } from 'next/server';

/**
 * Readiness probe endpoint
 * GET /api/health/ready
 * Used by Kubernetes to determine if the service is ready to accept traffic
 */
export async function GET() {
  const checks: Record<string, { status: string; message?: string }> = {};

  // Check if environment variables are set
  try {
    if (process.env.NEXT_PUBLIC_API_URL) {
      checks.environment = { status: 'ok', message: 'Environment variables configured' };
    } else {
      checks.environment = { status: 'warning', message: 'API URL not configured' };
    }
  } catch (error) {
    checks.environment = { status: 'error', message: 'Failed to check environment' };
  }

  // Check memory usage
  try {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    if (usagePercent < 90) {
      checks.memory = { status: 'ok', message: `Memory usage: ${usagePercent.toFixed(2)}%` };
    } else {
      checks.memory = { status: 'warning', message: `High memory usage: ${usagePercent.toFixed(2)}%` };
    }
  } catch (error) {
    checks.memory = { status: 'error', message: 'Failed to check memory' };
  }

  // Determine overall status
  const allOk = Object.values(checks).every(check => check.status === 'ok' || check.status === 'warning');
  const overallStatus = allOk ? 'ok' : 'degraded';

  const statusCode = overallStatus === 'ok' ? 200 : 503;

  return NextResponse.json(
    {
      status: overallStatus,
      service: 'web-app',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );
}
