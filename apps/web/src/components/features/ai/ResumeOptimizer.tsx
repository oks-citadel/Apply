'use client';

import React, { useState } from 'react';

interface Suggestion {
  type: string;
  section: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}

interface OptimizationResult {
  suggestions: Suggestion[];
  score: number;
  keywords: string[];
}

export function ResumeOptimizer() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const optimizeResume = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/optimize-resume', {
        method: 'POST',
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to optimize resume');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Resume Optimizer</h1>
      <p>Optimize your resume for specific job descriptions</p>

      <div>
        <label>
          Resume Text
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume here..."
          />
        </label>
      </div>

      <div>
        <label>
          Job Description
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
          />
        </label>
      </div>

      <button onClick={optimizeResume} disabled={isLoading}>
        {isLoading ? 'Optimizing...' : 'Optimize Resume'}
      </button>

      {error && <div role="alert">{error}</div>}

      {result && (
        <div>
          <h2>Optimization Results</h2>
          <p>Score: {result.score}%</p>

          <h3>Suggestions</h3>
          {result.suggestions.map((suggestion, index) => (
            <div key={index}>
              <strong>{suggestion.section}</strong>
              <p>{suggestion.suggestion}</p>
              <span>Priority: {suggestion.priority}</span>
            </div>
          ))}

          <h3>Keywords to Include</h3>
          <div>
            {result.keywords.map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResumeOptimizer;
