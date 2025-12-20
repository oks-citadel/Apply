import { Injectable, Logger } from '@nestjs/common';

import type { DetectedField } from './field-detection.engine';
import type { FieldMatch } from './semantic-matching.engine';

export interface ConfidenceScore {
  overall: number;
  detectionScore: number;
  matchScore: number;
  validationScore: number;
  sourceScore: number;
  factors: ConfidenceFactor[];
  recommendation: 'auto_submit' | 'review_recommended' | 'manual_required';
}

export interface ConfidenceFactor {
  name: string;
  score: number;
  weight: number;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface ApplicationConfidence {
  overallScore: number;
  fieldScores: Map<string, ConfidenceScore>;
  lowConfidenceFields: string[];
  highConfidenceFields: string[];
  criticalIssues: string[];
  warnings: string[];
  readyToSubmit: boolean;
}

@Injectable()
export class ConfidenceScoringEngine {
  private readonly logger = new Logger(ConfidenceScoringEngine.name);

  // Confidence thresholds
  private readonly thresholds = {
    autoSubmit: 85,
    reviewRecommended: 60,
    manualRequired: 40,
  };

  // Weight factors for confidence calculation
  private readonly weights = {
    detection: 0.25,
    match: 0.35,
    validation: 0.25,
    source: 0.15,
  };

  /**
   * Calculate confidence score for a single field match
   */
  calculateFieldConfidence(match: FieldMatch, validationPassed: boolean): ConfidenceScore {
    const factors: ConfidenceFactor[] = [];

    // Detection score (how well was the field detected)
    const detectionScore = this.calculateDetectionScore(match.field);
    factors.push({
      name: 'Field Detection',
      score: detectionScore,
      weight: this.weights.detection,
      impact: detectionScore >= 70 ? 'positive' : detectionScore >= 40 ? 'neutral' : 'negative',
      description: this.getDetectionDescription(detectionScore),
    });

    // Match score (how confident are we in the matched value)
    const matchScore = match.confidence;
    factors.push({
      name: 'Value Matching',
      score: matchScore,
      weight: this.weights.match,
      impact: matchScore >= 70 ? 'positive' : matchScore >= 40 ? 'neutral' : 'negative',
      description: this.getMatchDescription(matchScore, match.source),
    });

    // Validation score
    const validationScore = validationPassed ? 100 : 30;
    factors.push({
      name: 'Validation',
      score: validationScore,
      weight: this.weights.validation,
      impact: validationPassed ? 'positive' : 'negative',
      description: validationPassed ? 'Value passed validation' : 'Value failed validation checks',
    });

    // Source score (reliability of data source)
    const sourceScore = this.calculateSourceScore(match.source);
    factors.push({
      name: 'Data Source',
      score: sourceScore,
      weight: this.weights.source,
      impact: sourceScore >= 70 ? 'positive' : sourceScore >= 40 ? 'neutral' : 'negative',
      description: this.getSourceDescription(match.source),
    });

    // Calculate weighted overall score
    const overall = Math.round(
      factors.reduce((sum, f) => sum + f.score * f.weight, 0),
    );

    // Determine recommendation
    const recommendation = this.getRecommendation(overall, match.field.required);

    return {
      overall,
      detectionScore,
      matchScore,
      validationScore,
      sourceScore,
      factors,
      recommendation,
    };
  }

  /**
   * Calculate overall application confidence
   */
  calculateApplicationConfidence(
    fieldMatches: FieldMatch[],
    validationResults: Map<string, boolean>,
  ): ApplicationConfidence {
    const fieldScores = new Map<string, ConfidenceScore>();
    const lowConfidenceFields: string[] = [];
    const highConfidenceFields: string[] = [];
    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    let totalScore = 0;
    let requiredFieldsScore = 0;
    let requiredFieldCount = 0;

    for (const match of fieldMatches) {
      const validationPassed = validationResults.get(match.field.id) ?? true;
      const score = this.calculateFieldConfidence(match, validationPassed);
      fieldScores.set(match.field.id, score);

      totalScore += score.overall;

      if (match.field.required) {
        requiredFieldsScore += score.overall;
        requiredFieldCount++;

        // Check for critical issues with required fields
        if (score.overall < this.thresholds.manualRequired) {
          criticalIssues.push(`Required field "${match.field.label}" has very low confidence (${score.overall}%)`);
        } else if (score.overall < this.thresholds.reviewRecommended) {
          warnings.push(`Required field "${match.field.label}" needs review (${score.overall}%)`);
        }
      }

      // Categorize by confidence level
      if (score.overall < this.thresholds.reviewRecommended) {
        lowConfidenceFields.push(match.field.id);
      } else if (score.overall >= this.thresholds.autoSubmit) {
        highConfidenceFields.push(match.field.id);
      }

      // Check for missing values
      if (!match.matchedValue && match.field.required) {
        criticalIssues.push(`Required field "${match.field.label}" is empty`);
      }
    }

    // Calculate overall score (weighted toward required fields)
    const averageScore = fieldMatches.length > 0 ? totalScore / fieldMatches.length : 0;
    const requiredAvgScore = requiredFieldCount > 0 ? requiredFieldsScore / requiredFieldCount : 100;
    const overallScore = Math.round(averageScore * 0.4 + requiredAvgScore * 0.6);

    // Determine if ready to submit
    const readyToSubmit =
      criticalIssues.length === 0 &&
      overallScore >= this.thresholds.reviewRecommended &&
      lowConfidenceFields.filter((id) => {
        const match = fieldMatches.find((m) => m.field.id === id);
        return match?.field.required;
      }).length === 0;

    return {
      overallScore,
      fieldScores,
      lowConfidenceFields,
      highConfidenceFields,
      criticalIssues,
      warnings,
      readyToSubmit,
    };
  }

  /**
   * Get confidence breakdown for display
   */
  getConfidenceBreakdown(score: ConfidenceScore): {
    label: string;
    color: string;
    percentage: number;
    description: string;
  } {
    let label: string;
    let color: string;
    let description: string;

    if (score.overall >= this.thresholds.autoSubmit) {
      label = 'High Confidence';
      color = 'green';
      description = 'This field can be auto-submitted safely';
    } else if (score.overall >= this.thresholds.reviewRecommended) {
      label = 'Medium Confidence';
      color = 'yellow';
      description = 'Review recommended before submission';
    } else if (score.overall >= this.thresholds.manualRequired) {
      label = 'Low Confidence';
      color = 'orange';
      description = 'Manual verification required';
    } else {
      label = 'Very Low Confidence';
      color = 'red';
      description = 'Manual entry likely needed';
    }

    return {
      label,
      color,
      percentage: score.overall,
      description,
    };
  }

  /**
   * Get suggestions for improving confidence
   */
  getImprovementSuggestions(score: ConfidenceScore): string[] {
    const suggestions: string[] = [];

    for (const factor of score.factors) {
      if (factor.impact === 'negative') {
        switch (factor.name) {
          case 'Field Detection':
            suggestions.push('The field label is unclear. Consider adding to the ATS field mapping database.');
            break;
          case 'Value Matching':
            suggestions.push('No matching data found. Update your profile or add a saved answer for this question.');
            break;
          case 'Validation':
            suggestions.push('The value failed validation. Check the format and try again.');
            break;
          case 'Data Source':
            suggestions.push('Using AI-generated value. Consider saving the correct answer for future applications.');
            break;
        }
      }
    }

    return suggestions;
  }

  // Private helper methods

  private calculateDetectionScore(field: DetectedField): number {
    let score = field.confidence;

    // Boost for known field category
    if (field.fieldCategory !== 'unknown') {
      score += 10;
    }

    // Boost for having options (select/radio)
    if (field.options && field.options.length > 0) {
      score += 5;
    }

    // Boost for standard field types
    if (['email', 'phone', 'date'].includes(field.type)) {
      score += 5;
    }

    return Math.min(100, score);
  }

  private calculateSourceScore(source: FieldMatch['source']): number {
    const sourceScores: Record<string, number> = {
      profile: 95,
      resume: 85,
      saved_answer: 90,
      ai_generated: 50,
    };

    return sourceScores[source] || 50;
  }

  private getDetectionDescription(score: number): string {
    if (score >= 80) {return 'Field clearly identified';}
    if (score >= 60) {return 'Field identified with moderate confidence';}
    if (score >= 40) {return 'Field identification uncertain';}
    return 'Field poorly identified';
  }

  private getMatchDescription(score: number, source: string): string {
    const sourceLabels: Record<string, string> = {
      profile: 'profile data',
      resume: 'resume',
      saved_answer: 'saved answers',
      ai_generated: 'AI generation',
    };

    if (score >= 80) {return `Strong match from ${sourceLabels[source]}`;}
    if (score >= 60) {return `Moderate match from ${sourceLabels[source]}`;}
    if (score >= 40) {return `Weak match from ${sourceLabels[source]}`;}
    return `No reliable match found`;
  }

  private getSourceDescription(source: string): string {
    const descriptions: Record<string, string> = {
      profile: 'Data from verified user profile',
      resume: 'Data extracted from resume',
      saved_answer: 'Previously saved answer',
      ai_generated: 'AI-generated response (review recommended)',
    };

    return descriptions[source] || 'Unknown source';
  }

  private getRecommendation(
    score: number,
    required: boolean,
  ): ConfidenceScore['recommendation'] {
    if (score >= this.thresholds.autoSubmit) {
      return 'auto_submit';
    }
    if (score >= this.thresholds.reviewRecommended) {
      return required ? 'review_recommended' : 'auto_submit';
    }
    return 'manual_required';
  }
}
