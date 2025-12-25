import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EmployerProfile } from '../entities/employer-profile.entity';

import { Job } from '../../jobs/entities/job.entity';
import { Repository } from 'typeorm';


interface FraudDetectionResult {
  is_scam: boolean;
  scam_score: number; // 0-100
  scam_indicators: string[];
  fraud_signals: {
    suspicious_salary: boolean;
    fake_company: boolean;
    poor_grammar: boolean;
    requires_payment: boolean;
    too_good_to_be_true: boolean;
    phishing_links: boolean;
  };
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class FraudDetectorService {
  private readonly logger = new Logger(FraudDetectorService.name);

  // Scam indicators and patterns
  private readonly scamKeywords = [
    'work from home', 'easy money', 'no experience', 'guaranteed income',
    'earn $', 'make money fast', 'weekly payment', 'daily payment',
    'join now', 'limited spots', 'act now', 'exclusive opportunity',
    'investment required', 'starter kit', 'registration fee', 'training fee',
    'send money', 'wire transfer', 'western union', 'gift card',
    'crypto', 'bitcoin', 'forex trading', 'binary options',
  ];

  private readonly urgencyPhrases = [
    'urgent', 'immediate start', 'start today', 'right away',
    'hurry', 'limited time', 'act fast', 'don\'t miss',
  ];

  private readonly poorGrammarPatterns = [
    /\b(alot|cant|wont|dont|shouldnt|wouldnt)\b/i,
    /([.!?])\1{2,}/g, // Multiple punctuation
    /\b[A-Z]{10,}\b/, // All caps words
    /\s{2,}/g, // Multiple spaces
  ];

  private readonly suspiciousEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'protonmail.com', 'temp-mail.org', '10minutemail.com',
  ];

  private readonly knownScamCompanies = new Set<string>([
    // This would be populated from a database
  ]);

  constructor(
    @InjectRepository(EmployerProfile)
    private readonly employerProfileRepository: Repository<EmployerProfile>,
  ) {}

  /**
   * Detect if a job posting is fraudulent
   */
  async detectFraud(job: Job, employerProfile?: EmployerProfile): Promise<FraudDetectionResult> {
    try {
      const indicators: string[] = [];
      const signals = {
        suspicious_salary: false,
        fake_company: false,
        poor_grammar: false,
        requires_payment: false,
        too_good_to_be_true: false,
        phishing_links: false,
      };

      // Check employer profile first
      if (employerProfile) {
        const employerScore = this.checkEmployerCredibility(employerProfile, indicators, signals);
      }

      // Check salary anomalies
      const salaryScore = this.checkSalary(job, indicators, signals);

      // Check company legitimacy
      const companyScore = await this.checkCompany(job, indicators, signals);

      // Check job description quality
      const descriptionScore = this.checkDescription(job, indicators, signals);

      // Check for payment requirements
      const paymentScore = this.checkPaymentRequirements(job, indicators, signals);

      // Check for phishing/malicious links
      const linkScore = this.checkLinks(job, indicators, signals);

      // Check for unrealistic promises
      const promisesScore = this.checkUnrealisticPromises(job, indicators, signals);

      // Calculate overall scam score
      const scamScore = this.calculateScamScore({
        employerScore: employerProfile ? this.getEmployerRiskScore(employerProfile) : 0,
        salaryScore,
        companyScore,
        descriptionScore,
        paymentScore,
        linkScore,
        promisesScore,
      });

      // Determine risk level
      const riskLevel = this.determineRiskLevel(scamScore);

      // Determine if it's a scam (threshold: 70)
      const isScam = scamScore >= 70;

      return {
        is_scam: isScam,
        scam_score: Math.round(scamScore),
        scam_indicators: indicators,
        fraud_signals: signals,
        risk_level: riskLevel,
      };
    } catch (error) {
      this.logger.error(`Error detecting fraud for job ${job.id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check employer credibility
   */
  private checkEmployerCredibility(
    profile: EmployerProfile,
    indicators: string[],
    signals: any,
  ): number {
    let score = 0;

    // Check verification status
    if (profile.verification_status === 'blacklisted') {
      indicators.push('Blacklisted employer');
      signals.fake_company = true;
      score += 100;
    } else if (profile.verification_status === 'suspicious') {
      indicators.push('Suspicious employer profile');
      score += 50;
    }

    // Check scam reports
    if (profile.scam_reports_count > 5) {
      indicators.push(`${profile.scam_reports_count} scam reports filed`);
      score += Math.min(profile.scam_reports_count * 5, 40);
    }

    // Check credibility score
    if (profile.credibility_score < 30) {
      indicators.push('Low employer credibility score');
      score += 30;
    }

    // Check for fake reviews
    if (profile.has_fake_reviews) {
      indicators.push('Fake or manipulated reviews detected');
      score += 25;
    }

    return Math.min(score, 100);
  }

  /**
   * Check salary for anomalies
   */
  private checkSalary(job: Job, indicators: string[], signals: any): number {
    let score = 0;

    if (!job.salary_min && !job.salary_max) {
      // No salary listed is slightly suspicious
      score += 5;
    } else {
      const min = job.salary_min || 0;
      const max = job.salary_max || min;

      // Check for unrealistically high salaries
      const avgSalary = (min + max) / 2;

      // Define reasonable salary ranges by experience level
      const salaryRanges: Record<string, { min: number; max: number }> = {
        intern: { min: 30000, max: 80000 },
        entry: { min: 40000, max: 100000 },
        junior: { min: 50000, max: 120000 },
        mid: { min: 70000, max: 180000 },
        senior: { min: 100000, max: 300000 },
        lead: { min: 120000, max: 400000 },
        executive: { min: 150000, max: 1000000 },
      };

      // Check if salary is way above normal
      const expLevel = job.experience_level || 'mid';
      const range = salaryRanges[expLevel] || salaryRanges.mid;

      if (avgSalary > range.max * 2) {
        indicators.push('Unrealistically high salary for experience level');
        signals.suspicious_salary = true;
        signals.too_good_to_be_true = true;
        score += 40;
      }

      // Check for too-wide salary range
      if (max > min * 3) {
        indicators.push('Suspiciously wide salary range');
        score += 15;
      }
    }

    return score;
  }

  /**
   * Check company legitimacy
   */
  private async checkCompany(job: Job, indicators: string[], signals: any): Promise<number> {
    let score = 0;

    // Check if company is in known scam list
    if (job.company_name && this.knownScamCompanies.has(job.company_name.toLowerCase())) {
      indicators.push('Known scam company');
      signals.fake_company = true;
      return 100;
    }

    // Check if company has minimal information
    if (!job.company_logo_url && !job.company_id) {
      indicators.push('No company logo or profile');
      score += 15;
    }

    // Check application email domain
    if (job.application_url) {
      const emailMatch = job.application_url.match(/[\w.-]+@([\w.-]+\.\w+)/);
      if (emailMatch) {
        const domain = emailMatch[1].toLowerCase();
        if (this.suspiciousEmailDomains.includes(domain)) {
          indicators.push('Using personal email domain for applications');
          score += 25;
        }
      }
    }

    return score;
  }

  /**
   * Check job description quality
   */
  private checkDescription(job: Job, indicators: string[], signals: any): number {
    let score = 0;
    const description = job.description || '';

    // Check length
    if (description.length < 100) {
      indicators.push('Very short job description');
      score += 20;
    }

    // Check for poor grammar
    let grammarIssues = 0;
    for (const pattern of this.poorGrammarPatterns) {
      if (pattern.test(description)) {
        grammarIssues++;
      }
    }

    if (grammarIssues >= 2) {
      indicators.push('Poor grammar and spelling');
      signals.poor_grammar = true;
      score += 20;
    }

    // Check for excessive capitalization
    const capsWords = description.match(/\b[A-Z]{4,}\b/g);
    if (capsWords && capsWords.length > 5) {
      indicators.push('Excessive use of capital letters');
      score += 15;
    }

    // Check for scam keywords
    let scamKeywordCount = 0;
    const lowerDesc = description.toLowerCase();
    for (const keyword of this.scamKeywords) {
      if (lowerDesc.includes(keyword)) {
        scamKeywordCount++;
      }
    }

    if (scamKeywordCount >= 3) {
      indicators.push(`Contains ${scamKeywordCount} scam-related keywords`);
      score += Math.min(scamKeywordCount * 10, 40);
    }

    // Check for urgency tactics
    let urgencyCount = 0;
    for (const phrase of this.urgencyPhrases) {
      if (lowerDesc.includes(phrase)) {
        urgencyCount++;
      }
    }

    if (urgencyCount >= 2) {
      indicators.push('Uses urgency tactics');
      score += 15;
    }

    return score;
  }

  /**
   * Check for payment requirements
   */
  private checkPaymentRequirements(job: Job, indicators: string[], signals: any): number {
    const score = 0;
    const fullText = `${job.description} ${job.requirements.join(' ')}`.toLowerCase();

    const paymentKeywords = [
      'fee', 'payment', 'registration fee', 'training fee', 'starter kit',
      'investment', 'deposit', 'wire transfer', 'send money', 'pay upfront',
    ];

    for (const keyword of paymentKeywords) {
      if (fullText.includes(keyword)) {
        indicators.push('Requires payment or fees from applicants');
        signals.requires_payment = true;
        return 80; // Major red flag
      }
    }

    return score;
  }

  /**
   * Check for phishing or malicious links
   */
  private checkLinks(job: Job, indicators: string[], signals: any): number {
    let score = 0;

    // Check application URL
    if (job.application_url) {
      // Check for suspicious TLDs
      const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
      for (const tld of suspiciousTLDs) {
        if (job.application_url.includes(tld)) {
          indicators.push('Suspicious domain extension');
          signals.phishing_links = true;
          score += 35;
          break;
        }
      }

      // Check for IP address URLs
      if (/https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(job.application_url)) {
        indicators.push('Application URL is an IP address');
        signals.phishing_links = true;
        score += 40;
      }

      // Check for URL shorteners (can hide malicious links)
      const shortenerDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl'];
      for (const domain of shortenerDomains) {
        if (job.application_url.includes(domain)) {
          indicators.push('Uses URL shortener');
          score += 20;
          break;
        }
      }
    }

    return score;
  }

  /**
   * Check for unrealistic promises
   */
  private checkUnrealisticPromises(job: Job, indicators: string[], signals: any): number {
    let score = 0;
    const fullText = `${job.description} ${job.benefits.join(' ')}`.toLowerCase();

    const unrealisticPhrases = [
      'no experience required', 'make money fast', 'earn thousands',
      'guaranteed income', 'passive income', 'financial freedom',
      'be your own boss', 'work when you want', 'unlimited earning potential',
      'get rich', 'easy money',
    ];

    let promiseCount = 0;
    for (const phrase of unrealisticPhrases) {
      if (fullText.includes(phrase)) {
        promiseCount++;
      }
    }

    if (promiseCount >= 2) {
      indicators.push('Makes unrealistic promises');
      signals.too_good_to_be_true = true;
      score += Math.min(promiseCount * 15, 40);
    }

    return score;
  }

  /**
   * Calculate overall scam score
   */
  private calculateScamScore(scores: {
    employerScore: number;
    salaryScore: number;
    companyScore: number;
    descriptionScore: number;
    paymentScore: number;
    linkScore: number;
    promisesScore: number;
  }): number {
    // Weighted average
    const weights = {
      employer: 0.25,
      salary: 0.15,
      company: 0.15,
      description: 0.15,
      payment: 0.15, // High weight for payment requirements
      links: 0.10,
      promises: 0.05,
    };

    const weightedScore =
      scores.employerScore * weights.employer +
      scores.salaryScore * weights.salary +
      scores.companyScore * weights.company +
      scores.descriptionScore * weights.description +
      scores.paymentScore * weights.payment +
      scores.linkScore * weights.links +
      scores.promisesScore * weights.promises;

    return Math.min(weightedScore, 100);
  }

  /**
   * Determine risk level based on scam score
   */
  private determineRiskLevel(scamScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (scamScore >= 80) {return 'critical';}
    if (scamScore >= 60) {return 'high';}
    if (scamScore >= 40) {return 'medium';}
    return 'low';
  }

  /**
   * Get employer risk score
   */
  private getEmployerRiskScore(profile: EmployerProfile): number {
    if (profile.verification_status === 'blacklisted') {return 100;}
    if (profile.verification_status === 'suspicious') {return 70;}

    // Inverse of credibility score
    return 100 - profile.credibility_score;
  }

  /**
   * Batch fraud detection
   */
  async detectFraudInBatch(
    jobs: Job[],
    employerProfiles?: Map<string, EmployerProfile>,
  ): Promise<Map<string, FraudDetectionResult>> {
    const results = new Map<string, FraudDetectionResult>();

    for (const job of jobs) {
      try {
        const profile = employerProfiles?.get(job.company_id);
        const result = await this.detectFraud(job, profile);
        results.set(job.id, result);
      } catch (error) {
        this.logger.error(`Error detecting fraud for job ${job.id}: ${error.message}`);
      }
    }

    return results;
  }
}
