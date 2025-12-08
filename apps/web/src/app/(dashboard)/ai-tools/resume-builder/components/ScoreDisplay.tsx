'use client';

import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import type { ATSScore } from '@/types/resume';

interface ScoreDisplayProps {
  score: ATSScore;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getScoreLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="text-center">
        <div
          className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getScoreBgColor(
            score.percentage
          )} mb-3`}
        >
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(score.percentage)}`}>
              {score.percentage}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">/ 100</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getScoreLabel(score.percentage)}
          </h3>
          <Badge variant={score.percentage >= 60 ? 'success' : 'warning'} size="sm">
            ATS Score
          </Badge>
        </div>
      </div>

      {/* Score Breakdown */}
      {score.feedback && score.feedback.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Score Breakdown
          </h4>
          <div className="space-y-2">
            {score.feedback.map((item, index) => {
              const percentage = (item.score / score.maxScore) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {item.category}
                    </span>
                    <span className={getScoreColor(percentage)}>
                      {item.score}/{score.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentage >= 80
                          ? 'bg-green-600'
                          : percentage >= 60
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Keywords */}
      <div className="grid grid-cols-2 gap-3">
        {/* Matched Keywords */}
        {score.matchedKeywords && score.matchedKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                Matched ({score.matchedKeywords.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {score.matchedKeywords.slice(0, 5).map((keyword, index) => (
                <Badge key={index} variant="success" size="sm">
                  {keyword}
                </Badge>
              ))}
              {score.matchedKeywords.length > 5 && (
                <Badge variant="secondary" size="sm">
                  +{score.matchedKeywords.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Missing Keywords */}
        {score.missingKeywords && score.missingKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white">
                Missing ({score.missingKeywords.length})
              </h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {score.missingKeywords.slice(0, 5).map((keyword, index) => (
                <Badge key={index} variant="warning" size="sm">
                  {keyword}
                </Badge>
              ))}
              {score.missingKeywords.length > 5 && (
                <Badge variant="secondary" size="sm">
                  +{score.missingKeywords.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {score.feedback && score.feedback.some((f) => f.suggestions.length > 0) && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Improvement Suggestions
          </h4>
          <div className="space-y-2">
            {score.feedback.flatMap((item, itemIndex) =>
              item.suggestions.map((suggestion, suggestionIndex) => (
                <div
                  key={`${itemIndex}-${suggestionIndex}`}
                  className="flex items-start gap-2 text-xs"
                >
                  <TrendingUp className="w-3 h-3 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
