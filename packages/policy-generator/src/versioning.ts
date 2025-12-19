/* ============================================
   POLICY VERSION MANAGEMENT

   Tracks version history, detects changes,
   and manages policy updates across regions.
   ============================================ */

import {
  PolicyType,
  RegionCode,
  PolicyVersion,
  PolicyChange,
  RegulatoryUpdate,
} from './types';
import { format, differenceInDays } from 'date-fns';

/**
 * Version storage interface
 */
export interface VersionStore {
  getVersion(policyType: PolicyType, region: RegionCode): PolicyVersion | null;
  saveVersion(policyType: PolicyType, region: RegionCode, version: PolicyVersion): void;
  getHistory(policyType: PolicyType, region: RegionCode): PolicyVersion[];
  getChanges(policyType: PolicyType, region: RegionCode): PolicyChange[];
  saveChange(change: PolicyChange): void;
}

/**
 * In-memory version store (for development/testing)
 */
export class InMemoryVersionStore implements VersionStore {
  private versions: Map<string, PolicyVersion[]> = new Map();
  private changes: Map<string, PolicyChange[]> = new Map();

  private getKey(policyType: PolicyType, region: RegionCode): string {
    return `${policyType}:${region}`;
  }

  getVersion(policyType: PolicyType, region: RegionCode): PolicyVersion | null {
    const key = this.getKey(policyType, region);
    const versions = this.versions.get(key);
    return versions && versions.length > 0 ? versions[versions.length - 1] : null;
  }

  saveVersion(policyType: PolicyType, region: RegionCode, version: PolicyVersion): void {
    const key = this.getKey(policyType, region);
    const versions = this.versions.get(key) || [];
    versions.push(version);
    this.versions.set(key, versions);
  }

  getHistory(policyType: PolicyType, region: RegionCode): PolicyVersion[] {
    const key = this.getKey(policyType, region);
    return this.versions.get(key) || [];
  }

  getChanges(policyType: PolicyType, region: RegionCode): PolicyChange[] {
    const key = this.getKey(policyType, region);
    return this.changes.get(key) || [];
  }

  saveChange(change: PolicyChange): void {
    const key = `${change.policyType}:${change.region}`;
    const changes = this.changes.get(key) || [];
    changes.push(change);
    this.changes.set(key, changes);
  }
}

/**
 * Semantic version parser
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map(Number);
  return { major, minor, patch };
}

/**
 * Increment version based on change type
 */
export function incrementVersion(
  currentVersion: string,
  changeType: 'major' | 'minor' | 'patch'
): string {
  const { major, minor, patch } = parseVersion(currentVersion);

  switch (changeType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Determine change type based on changes
 */
export function determineChangeType(changes: PolicyChange['sections']): 'major' | 'minor' | 'patch' {
  const hasAddedSections = changes.some(c => c.changeType === 'added');
  const hasRemovedSections = changes.some(c => c.changeType === 'removed');
  // const hasModifiedSections = changes.some(c => c.changeType === 'modified');

  // Major: sections removed (could affect compliance)
  if (hasRemovedSections) return 'major';

  // Minor: new sections added
  if (hasAddedSections) return 'minor';

  // Patch: modifications only
  return 'patch';
}

/**
 * Version Manager Class
 */
export class VersionManager {
  private store: VersionStore;
  private regulatoryUpdates: RegulatoryUpdate[] = [];

  constructor(store: VersionStore = new InMemoryVersionStore()) {
    this.store = store;
  }

  /**
   * Create a new version
   */
  createVersion(
    policyType: PolicyType,
    region: RegionCode,
    changesSummary: string[],
    author: string = 'PolicyGenerator',
    approvedBy?: string
  ): PolicyVersion {
    const currentVersion = this.store.getVersion(policyType, region);
    const changeType = this.inferChangeType(changesSummary);

    const newVersionNumber = currentVersion
      ? incrementVersion(currentVersion.version, changeType)
      : '1.0.0';

    const newVersion: PolicyVersion = {
      version: newVersionNumber,
      effectiveDate: new Date(),
      lastUpdated: new Date(),
      changesSummary,
      previousVersion: currentVersion?.version,
      author,
      approvedBy,
    };

    this.store.saveVersion(policyType, region, newVersion);
    return newVersion;
  }

  /**
   * Get current version
   */
  getCurrentVersion(policyType: PolicyType, region: RegionCode): PolicyVersion | null {
    return this.store.getVersion(policyType, region);
  }

  /**
   * Get version history
   */
  getVersionHistory(policyType: PolicyType, region: RegionCode): PolicyVersion[] {
    return this.store.getHistory(policyType, region);
  }

  /**
   * Record a policy change
   */
  recordChange(
    policyType: PolicyType,
    region: RegionCode,
    sections: PolicyChange['sections'],
    summary: string,
    regulatoryTrigger?: string
  ): PolicyChange {
    const currentVersion = this.store.getVersion(policyType, region);
    const changeType = determineChangeType(sections);
    const newVersion = currentVersion
      ? incrementVersion(currentVersion.version, changeType)
      : '1.0.0';

    const change: PolicyChange = {
      id: `change-${Date.now()}`,
      policyType,
      region,
      previousVersion: currentVersion?.version || '0.0.0',
      newVersion,
      changeDate: new Date(),
      changeType,
      sections,
      summary,
      notificationRequired: changeType === 'major',
      regulatoryTrigger,
    };

    this.store.saveChange(change);
    return change;
  }

  /**
   * Get changes for a policy/region
   */
  getChanges(policyType: PolicyType, region: RegionCode): PolicyChange[] {
    return this.store.getChanges(policyType, region);
  }

  /**
   * Register a regulatory update
   */
  registerRegulatoryUpdate(update: Omit<RegulatoryUpdate, 'id' | 'status'>): RegulatoryUpdate {
    const regulatoryUpdate: RegulatoryUpdate = {
      ...update,
      id: `reg-${Date.now()}`,
      status: 'pending',
    };

    this.regulatoryUpdates.push(regulatoryUpdate);
    return regulatoryUpdate;
  }

  /**
   * Get pending regulatory updates
   */
  getPendingRegulatoryUpdates(): RegulatoryUpdate[] {
    return this.regulatoryUpdates.filter(u => u.status === 'pending');
  }

  /**
   * Get regulatory updates by region
   */
  getRegulatoryUpdatesByRegion(region: RegionCode): RegulatoryUpdate[] {
    return this.regulatoryUpdates.filter(u => u.region === region);
  }

  /**
   * Mark regulatory update as completed
   */
  completeRegulatoryUpdate(updateId: string): void {
    const update = this.regulatoryUpdates.find(u => u.id === updateId);
    if (update) {
      update.status = 'completed';
    }
  }

  /**
   * Get upcoming compliance deadlines
   */
  getUpcomingDeadlines(daysAhead: number = 30): RegulatoryUpdate[] {
    const now = new Date();
    return this.regulatoryUpdates.filter(u => {
      if (!u.complianceDeadline || u.status === 'completed') return false;
      const daysUntilDeadline = differenceInDays(u.complianceDeadline, now);
      return daysUntilDeadline >= 0 && daysUntilDeadline <= daysAhead;
    });
  }

  /**
   * Infer change type from summary
   */
  private inferChangeType(changesSummary: string[]): 'major' | 'minor' | 'patch' {
    const summaryText = changesSummary.join(' ').toLowerCase();

    if (summaryText.includes('breaking') ||
        summaryText.includes('removed') ||
        summaryText.includes('significant')) {
      return 'major';
    }

    if (summaryText.includes('added') ||
        summaryText.includes('new section') ||
        summaryText.includes('new feature')) {
      return 'minor';
    }

    return 'patch';
  }

  /**
   * Generate version diff report
   */
  generateDiffReport(
    policyType: PolicyType,
    region: RegionCode,
    fromVersion: string,
    toVersion: string
  ): string {
    const changes = this.store.getChanges(policyType, region);
    const relevantChanges = changes.filter(
      c => this.isVersionInRange(c.newVersion, fromVersion, toVersion)
    );

    let report = `# Policy Change Report\n\n`;
    report += `**Policy Type:** ${policyType}\n`;
    report += `**Region:** ${region}\n`;
    report += `**From Version:** ${fromVersion}\n`;
    report += `**To Version:** ${toVersion}\n\n`;
    report += `## Changes\n\n`;

    for (const change of relevantChanges) {
      report += `### Version ${change.newVersion}\n`;
      report += `**Date:** ${format(change.changeDate, 'MMMM d, yyyy')}\n`;
      report += `**Type:** ${change.changeType}\n\n`;
      report += `${change.summary}\n\n`;

      if (change.sections.length > 0) {
        report += `**Affected Sections:**\n`;
        for (const section of change.sections) {
          report += `- ${section.sectionId}: ${section.changeType} - ${section.reason}\n`;
        }
        report += '\n';
      }

      if (change.regulatoryTrigger) {
        report += `**Regulatory Trigger:** ${change.regulatoryTrigger}\n\n`;
      }
    }

    return report;
  }

  /**
   * Check if version is in range
   */
  private isVersionInRange(
    version: string,
    fromVersion: string,
    toVersion: string
  ): boolean {
    const v = parseVersion(version);
    const from = parseVersion(fromVersion);
    const to = parseVersion(toVersion);

    const vNum = v.major * 10000 + v.minor * 100 + v.patch;
    const fromNum = from.major * 10000 + from.minor * 100 + from.patch;
    const toNum = to.major * 10000 + to.minor * 100 + to.patch;

    return vNum > fromNum && vNum <= toNum;
  }
}

/**
 * Create a new version manager instance
 */
export function createVersionManager(store?: VersionStore): VersionManager {
  return new VersionManager(store);
}
