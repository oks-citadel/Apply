/* ============================================
   POLICY CHANGELOG GENERATOR

   Generates human-readable changelogs for
   policy updates across all regions.
   ============================================ */

import {
  PolicyType,
  RegionCode,
  ChangelogEntry,
  PolicyChange,
} from './types';
import { getRegionConfig } from './regions';
import { format } from 'date-fns';

/**
 * Changelog Generator Class
 */
export class ChangelogGenerator {
  private entries: ChangelogEntry[] = [];

  /**
   * Add a changelog entry
   */
  addEntry(entry: ChangelogEntry): void {
    this.entries.push(entry);
    this.sortEntries();
  }

  /**
   * Create entry from policy change
   */
  createEntryFromChange(change: PolicyChange): ChangelogEntry {
    const entry: ChangelogEntry = {
      version: change.newVersion,
      date: change.changeDate,
      region: change.region,
      policyType: change.policyType,
      changes: change.sections.map(section => ({
        type: section.changeType === 'added' ? 'added' :
              section.changeType === 'removed' ? 'removed' :
              'changed',
        description: `${section.sectionId}: ${section.reason}`,
      })),
      regulatoryReference: change.regulatoryTrigger,
    };

    this.addEntry(entry);
    return entry;
  }

  /**
   * Sort entries by date (newest first)
   */
  private sortEntries(): void {
    this.entries.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get entries for a specific policy type
   */
  getEntriesByPolicyType(policyType: PolicyType): ChangelogEntry[] {
    return this.entries.filter(e => e.policyType === policyType);
  }

  /**
   * Get entries for a specific region
   */
  getEntriesByRegion(region: RegionCode): ChangelogEntry[] {
    return this.entries.filter(e => e.region === region);
  }

  /**
   * Get entries within a date range
   */
  getEntriesInRange(startDate: Date, endDate: Date): ChangelogEntry[] {
    return this.entries.filter(e =>
      e.date >= startDate && e.date <= endDate
    );
  }

  /**
   * Generate markdown changelog
   */
  generateMarkdown(options: {
    policyType?: PolicyType;
    region?: RegionCode;
    limit?: number;
    includeRegulatory?: boolean;
  } = {}): string {
    let filteredEntries = [...this.entries];

    if (options.policyType) {
      filteredEntries = filteredEntries.filter(e => e.policyType === options.policyType);
    }

    if (options.region) {
      filteredEntries = filteredEntries.filter(e => e.region === options.region);
    }

    if (options.limit) {
      filteredEntries = filteredEntries.slice(0, options.limit);
    }

    let markdown = '# Policy Changelog\n\n';
    markdown += `_Generated on ${format(new Date(), 'MMMM d, yyyy')}_\n\n`;

    if (options.policyType) {
      markdown += `**Policy Type:** ${this.formatPolicyType(options.policyType)}\n`;
    }

    if (options.region) {
      const regionConfig = getRegionConfig(options.region);
      markdown += `**Region:** ${regionConfig.name}\n`;
    }

    markdown += '\n---\n\n';

    // Group entries by date
    const entriesByDate = new Map<string, ChangelogEntry[]>();
    for (const entry of filteredEntries) {
      const dateKey = format(entry.date, 'yyyy-MM-dd');
      const existing = entriesByDate.get(dateKey) || [];
      existing.push(entry);
      entriesByDate.set(dateKey, existing);
    }

    for (const [dateKey, dateEntries] of entriesByDate) {
      const displayDate = format(new Date(dateKey), 'MMMM d, yyyy');
      markdown += `## ${displayDate}\n\n`;

      for (const entry of dateEntries) {
        const regionConfig = getRegionConfig(entry.region);
        markdown += `### [${entry.version}] ${this.formatPolicyType(entry.policyType)} - ${regionConfig.name}\n\n`;

        // Group changes by type
        const added = entry.changes.filter(c => c.type === 'added');
        const changed = entry.changes.filter(c => c.type === 'changed');
        const removed = entry.changes.filter(c => c.type === 'removed');
        const fixed = entry.changes.filter(c => c.type === 'fixed');

        if (added.length > 0) {
          markdown += '#### Added\n';
          for (const change of added) {
            markdown += `- ${change.description}\n`;
          }
          markdown += '\n';
        }

        if (changed.length > 0) {
          markdown += '#### Changed\n';
          for (const change of changed) {
            markdown += `- ${change.description}\n`;
          }
          markdown += '\n';
        }

        if (removed.length > 0) {
          markdown += '#### Removed\n';
          for (const change of removed) {
            markdown += `- ${change.description}\n`;
          }
          markdown += '\n';
        }

        if (fixed.length > 0) {
          markdown += '#### Fixed\n';
          for (const change of fixed) {
            markdown += `- ${change.description}\n`;
          }
          markdown += '\n';
        }

        if (options.includeRegulatory && entry.regulatoryReference) {
          markdown += `> **Regulatory Reference:** ${entry.regulatoryReference}\n\n`;
        }
      }
    }

    return markdown;
  }

  /**
   * Generate JSON changelog
   */
  generateJson(options: {
    policyType?: PolicyType;
    region?: RegionCode;
    limit?: number;
  } = {}): string {
    let filteredEntries = [...this.entries];

    if (options.policyType) {
      filteredEntries = filteredEntries.filter(e => e.policyType === options.policyType);
    }

    if (options.region) {
      filteredEntries = filteredEntries.filter(e => e.region === options.region);
    }

    if (options.limit) {
      filteredEntries = filteredEntries.slice(0, options.limit);
    }

    const changelog = {
      generatedAt: new Date().toISOString(),
      entries: filteredEntries.map(entry => ({
        ...entry,
        date: entry.date.toISOString(),
        regionName: getRegionConfig(entry.region).name,
        policyTypeName: this.formatPolicyType(entry.policyType),
      })),
    };

    return JSON.stringify(changelog, null, 2);
  }

  /**
   * Generate summary of changes
   */
  generateSummary(
    startDate: Date,
    endDate: Date
  ): {
    totalChanges: number;
    byRegion: Record<string, number>;
    byPolicyType: Record<string, number>;
    byChangeType: Record<string, number>;
    majorChanges: ChangelogEntry[];
  } {
    const entries = this.getEntriesInRange(startDate, endDate);

    const byRegion: Record<string, number> = {};
    const byPolicyType: Record<string, number> = {};
    const byChangeType: Record<string, number> = {};
    const majorChanges: ChangelogEntry[] = [];

    for (const entry of entries) {
      // Count by region
      byRegion[entry.region] = (byRegion[entry.region] || 0) + 1;

      // Count by policy type
      byPolicyType[entry.policyType] = (byPolicyType[entry.policyType] || 0) + 1;

      // Count by change type
      for (const change of entry.changes) {
        byChangeType[change.type] = (byChangeType[change.type] || 0) + 1;
      }

      // Track major changes (version bump in major number)
      const [major] = entry.version.split('.');
      if (parseInt(major) > 1 || entry.changes.some(c => c.type === 'removed')) {
        majorChanges.push(entry);
      }
    }

    return {
      totalChanges: entries.length,
      byRegion,
      byPolicyType,
      byChangeType,
      majorChanges,
    };
  }

  /**
   * Generate notification-worthy changes summary
   */
  generateNotificationSummary(): string {
    const recentEntries = this.entries.slice(0, 10);
    const majorChanges = recentEntries.filter(entry =>
      entry.changes.some(c => c.type === 'removed' || c.type === 'added')
    );

    if (majorChanges.length === 0) {
      return 'No significant policy changes requiring notification.';
    }

    let summary = '## Policy Update Notification\n\n';
    summary += 'The following significant changes have been made to our policies:\n\n';

    for (const entry of majorChanges) {
      const regionConfig = getRegionConfig(entry.region);
      summary += `### ${this.formatPolicyType(entry.policyType)} (${regionConfig.name})\n`;
      summary += `**Version:** ${entry.version}\n`;
      summary += `**Date:** ${format(entry.date, 'MMMM d, yyyy')}\n\n`;

      for (const change of entry.changes) {
        const icon = change.type === 'added' ? '+' :
                     change.type === 'removed' ? '-' : '~';
        summary += `${icon} ${change.description}\n`;
      }

      if (entry.regulatoryReference) {
        summary += `\n_Regulatory Reference: ${entry.regulatoryReference}_\n`;
      }

      summary += '\n';
    }

    return summary;
  }

  /**
   * Format policy type for display
   */
  private formatPolicyType(policyType: PolicyType): string {
    const names: Record<PolicyType, string> = {
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      cookies: 'Cookie Policy',
      dpa: 'Data Processing Agreement',
      ccpa_notice: 'CCPA Notice at Collection',
      do_not_sell: 'Do Not Sell My Information',
      health_data: 'Health Data Privacy Policy',
      ai_transparency: 'AI Transparency Statement',
      modern_slavery: 'Modern Slavery Statement',
      accessibility: 'Accessibility Statement',
      subscription_terms: 'Subscription Terms',
      ip_dmca: 'IP & DMCA Policy',
    };

    return names[policyType] || policyType;
  }

  /**
   * Get all entries
   */
  getAllEntries(): ChangelogEntry[] {
    return [...this.entries];
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }

  /**
   * Export to file format
   */
  export(format: 'markdown' | 'json' = 'markdown'): string {
    return format === 'json' ? this.generateJson() : this.generateMarkdown();
  }
}

/**
 * Create a new changelog generator instance
 */
export function createChangelogGenerator(): ChangelogGenerator {
  return new ChangelogGenerator();
}

/**
 * Default changelog instance
 */
export const defaultChangelog = new ChangelogGenerator();
