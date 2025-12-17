'use client';

import React, { useState } from 'react';

interface JobMatch {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  skills: string[];
}

export function JobMatcher() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findMatches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/job-matches');
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      setError('Failed to find job matches');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Job Matcher</h1>
      <p>Find jobs that match your skills and experience</p>

      <button onClick={findMatches} disabled={isLoading}>
        {isLoading ? 'Finding Matches...' : 'Find Matching Jobs'}
      </button>

      {error && <div role="alert">{error}</div>}

      {matches.length > 0 && (
        <div>
          <h2>Your Matches</h2>
          {matches.map((match) => (
            <div key={match.id}>
              <h3>{match.title}</h3>
              <p>{match.company}</p>
              <p>Match Score: {match.matchScore}%</p>
              <div>
                {match.skills.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default JobMatcher;
