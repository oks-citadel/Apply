'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface AISuggestion {
  type: string;
  label: string;
  content: string;
  reason?: string;
  impact?: 'high' | 'medium' | 'low';
}

interface AISuggestionCardProps {
  suggestion: AISuggestion;
  onApply: () => void;
}

export function AISuggestionCard({ suggestion, onApply }: AISuggestionCardProps) {
  const [isApplied, setIsApplied] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleApply = () => {
    onApply();
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2000);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(suggestion.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {suggestion.label}
                </h4>
                {suggestion.impact && (
                  <Badge variant={getImpactColor(suggestion.impact)} size="sm">
                    {suggestion.impact} impact
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
              {suggestion.content}
            </p>

            {suggestion.reason && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">
                Why: {suggestion.reason}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleApply}
                disabled={isApplied}
              >
                {isApplied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Applied
                  </>
                ) : (
                  'Apply'
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
