/* ============================================
   APPLYFORUS GLOBAL POLICY GENERATOR ENGINE

   Version: 1.0.0

   This engine generates region-specific legal
   and compliance policies for:
   - US (state-level, including CA + WA)
   - UK (UK GDPR, Modern Slavery Act)
   - EU (GDPR)
   - Canada (PIPEDA)
   - Australia (Privacy Act)
   - Nigeria (NDPR)
   - LATAM (LGPD Brazil, etc.)
   - APAC (PDPA Singapore, etc.)
   - Middle East (UAE PDPL, etc.)

   Features:
   - Template-based policy generation
   - Region-specific variable substitution
   - Version history tracking
   - Change detection and diff generation
   - Multi-format export (HTML, MD, JSON)
   ============================================ */

export * from './types';
export * from './regions';
export * from './templates';
export * from './generator';
export * from './versioning';
export * from './changelog';

// Default export for convenience
export { PolicyGenerator } from './generator';
