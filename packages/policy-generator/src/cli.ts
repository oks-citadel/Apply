#!/usr/bin/env ts-node
/* ============================================
   POLICY GENERATOR CLI

   Command-line interface for generating
   region-specific policies.

   Usage:
     npx ts-node src/cli.ts generate --all
     npx ts-node src/cli.ts generate --region US_CA
     npx ts-node src/cli.ts generate --policy privacy --region EU
     npx ts-node src/cli.ts changelog
     npx ts-node src/cli.ts audit
   ============================================ */

import { PolicyGenerator } from './generator';
import { ChangelogGenerator } from './changelog';
import { getAllRegions, getRegionConfig,  } from './regions';
import { PolicyType, RegionCode } from './types';

const args = process.argv.slice(2);
const command = args[0];

/**
 * Parse command line arguments
 */
function parseArgs(): Record<string, string | boolean> {
  const parsed: Record<string, string | boolean> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
    if (!arg) continue;
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        parsed[key] = nextArg;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }

  return parsed;
}

/**
 * Generate policies command
 */
async function generateCommand(options: Record<string, string | boolean>): Promise<void> {
  console.log('🔧 ApplyForUs Policy Generator\n');

  const generator = new PolicyGenerator();
  const format = (options.format as string) || 'markdown';

  generator.updateOptions({ format: format as 'markdown' | 'html' | 'json' | 'react' });

  if (options.all) {
    console.log('Generating all policies for all regions...\n');

    const results = generator.generateAllPolicies();
    let successCount = 0;
    let failCount = 0;

    for (const [key, content] of results.entries()) {
      const [region, policyType] = key.split('/');
      if (content) {
        console.log(`✅ Generated: ${region}/${policyType}`);
        successCount++;
      } else {
        console.log(`❌ Failed: ${region}/${policyType}`);
        failCount++;
      }
    }

    console.log(`\n📊 Summary: ${successCount} succeeded, ${failCount} failed`);
    return;
  }

  if (options.region) {
    const regionCode = options.region as RegionCode;
    const regionConfig = getRegionConfig(regionCode);

    console.log(`Generating policies for ${regionConfig.name}...\n`);

    if (options.policy) {
      // Single policy for single region
      const policyType = options.policy as PolicyType;
      try {
        const content = generator.generatePolicy(policyType, regionCode);
        console.log(`✅ Generated: ${policyType} for ${regionCode}`);
        console.log(`\n--- Preview (first 500 chars) ---\n`);
        console.log(content.slice(0, 500) + '...\n');
      } catch (error) {
        console.log(`❌ Failed: ${policyType} for ${regionCode}`);
        console.error(error);
      }
    } else {
      // All required policies for region
      const results = generator.generateAllPoliciesForRegion(regionCode);
      for (const [policyType, content] of results.entries()) {
        if (content) {
          console.log(`✅ Generated: ${policyType}`);
        } else {
          console.log(`❌ Failed: ${policyType}`);
        }
      }
    }
    return;
  }

  // Show help if no valid options
  showHelp();
}

/**
 * Changelog command
 */
async function changelogCommand(options: Record<string, string | boolean>): Promise<void> {
  console.log('📋 Policy Changelog Generator\n');

  const changelogGen = new ChangelogGenerator();

  // Add sample entries for demonstration
  changelogGen.addEntry({
    version: '1.0.0',
    date: new Date(),
    region: 'GLOBAL',
    policyType: 'privacy',
    changes: [
      { type: 'added', description: 'Initial privacy policy release' },
    ],
  });

  const format = (options.format as string) || 'markdown';
  const output = format === 'json'
    ? changelogGen.generateJson()
    : changelogGen.generateMarkdown();

  console.log(output);
}

/**
 * Audit command - check policy compliance
 */
async function auditCommand(): Promise<void> {
  console.log('🔍 Policy Compliance Audit\n');

  const regions = getAllRegions();
  const issues: string[] = [];

  for (const region of regions) {
    const config = getRegionConfig(region);
    console.log(`\n📍 ${config.name} (${region})`);
    console.log(`   Regulations: ${config.regulations.join(', ')}`);
    console.log(`   Required Policies: ${config.requiredPolicies.join(', ')}`);

    if (config.additionalRequirements) {
      console.log(`   Additional Requirements:`);
      for (const req of config.additionalRequirements) {
        console.log(`     - ${req}`);
      }
    }
  }

  console.log('\n📊 Audit Complete');
  console.log(`   Total Regions: ${regions.length}`);
  console.log(`   Issues Found: ${issues.length}`);
}

/**
 * List regions command
 */
async function listRegionsCommand(): Promise<void> {
  console.log('🌍 Supported Regions\n');

  const regions = getAllRegions();

  for (const region of regions) {
    const config = getRegionConfig(region);
    console.log(`${region.padEnd(8)} │ ${config.name}`);
    console.log(`${''.padEnd(8)} │ Regulations: ${config.regulations.join(', ') || 'None'}`);
    console.log(`${''.padEnd(8)} │ Required: ${config.requiredPolicies.join(', ')}`);
    if (config.dataProtectionAuthority) {
      console.log(`${''.padEnd(8)} │ DPA: ${config.dataProtectionAuthority.name}`);
    }
    console.log('');
  }
}

/**
 * Show help
 */
function showHelp(): void {
  console.log(`
ApplyForUs Policy Generator CLI

Usage:
  npx ts-node src/cli.ts <command> [options]

Commands:
  generate    Generate policy documents
  changelog   Generate changelog
  audit       Run compliance audit
  regions     List supported regions
  help        Show this help message

Options for 'generate':
  --all                   Generate all policies for all regions
  --region <code>         Generate policies for specific region (e.g., US_CA, EU, UK)
  --policy <type>         Generate specific policy type (e.g., privacy, terms, cookies)
  --format <format>       Output format: markdown, html, json, react (default: markdown)

Examples:
  npx ts-node src/cli.ts generate --all
  npx ts-node src/cli.ts generate --region EU
  npx ts-node src/cli.ts generate --policy privacy --region US_CA
  npx ts-node src/cli.ts generate --all --format html
  npx ts-node src/cli.ts changelog --format json
  npx ts-node src/cli.ts audit
  npx ts-node src/cli.ts regions

Supported Regions:
  GLOBAL  - Global/Default policy
  US      - United States (federal)
  US_CA   - California (CCPA/CPRA)
  US_WA   - Washington (My Health My Data)
  US_VA   - Virginia (VCDPA)
  US_CO   - Colorado (CPA)
  US_CT   - Connecticut (CTDPA)
  UK      - United Kingdom (UK GDPR)
  EU      - European Union (GDPR)
  CA      - Canada (PIPEDA)
  AU      - Australia (Privacy Act)
  NG      - Nigeria (NDPR)
  BR      - Brazil (LGPD)
  MX      - Mexico (LFPDPPP)
  SG      - Singapore (PDPA)
  JP      - Japan (APPI)
  KR      - South Korea (PIPA)
  AE      - UAE (PDPL)
  SA      - Saudi Arabia (PDPL)

Policy Types:
  privacy            - Privacy Policy
  terms              - Terms of Service
  cookies            - Cookie Policy
  dpa                - Data Processing Agreement
  ccpa_notice        - CCPA Notice at Collection
  do_not_sell        - Do Not Sell My Information
  health_data        - Health Data Privacy
  ai_transparency    - AI Transparency Statement
  modern_slavery     - Modern Slavery Statement
  accessibility      - Accessibility Statement
  subscription_terms - Subscription Terms
  ip_dmca            - IP & DMCA Policy
`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const options = parseArgs();

  switch (command) {
    case 'generate':
      await generateCommand(options);
      break;
    case 'changelog':
      await changelogCommand(options);
      break;
    case 'audit':
      await auditCommand();
      break;
    case 'regions':
      await listRegionsCommand();
      break;
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
  }
}

main().catch(console.error);
