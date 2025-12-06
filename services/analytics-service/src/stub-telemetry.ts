// Temporary stub for @jobpilot/telemetry until monorepo linking is configured
export async function initTelemetry(config: any): Promise<void> {
  console.log('Telemetry disabled in Docker build');
  return Promise.resolve();
}
