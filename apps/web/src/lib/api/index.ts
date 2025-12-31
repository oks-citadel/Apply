export * from './client';
export * from './auth';
export * from './resumes';
export * from './jobs';
export * from './applications';
export * from './user';
export * from './ai';
export * from './alerts';
export * from './analytics';
export * from './gdpr';
export * from './utils';

// Re-export API instances for convenience
export { authApi } from './auth';
export { resumesApi } from './resumes';
export { jobsApi } from './jobs';
export { applicationsApi } from './applications';
export { userApi } from './user';
export { aiApi } from './ai';
export { alertsApi } from './alerts';
export { analyticsApi } from './analytics';

// Re-export GDPR API functions
export {
  exportUserData,
  requestDataExport,
  requestAccountDeletion,
  getGdprRequests,
  cancelGdprRequest,
  getDeletionCertificate,
  anonymizeUserData,
  getRetentionPolicies,
  submitPrivacyRequest,
} from './gdpr';

// Re-export error types and utilities
export { ErrorType, ApiError, isErrorType } from './client';
export { apiCache, cachedApiCall } from './utils';
