'use client';

import React from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
}

interface SearchResultsProps {
  results?: Job[];
  isLoading?: boolean;
  error?: string;
  onJobClick?: (jobId: string) => void;
}

export function SearchResults({
  results = [],
  isLoading = false,
  error,
  onJobClick,
}: SearchResultsProps) {
  if (isLoading) {
    return <div data-testid="search-results-loading">Loading...</div>;
  }

  if (error) {
    return (
      <div data-testid="search-results-error" role="alert">
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return <div data-testid="search-results-empty">No results found</div>;
  }

  return (
    <div data-testid="search-results">
      <p>{results.length} job(s) found</p>
      <ul>
        {results.map((job) => (
          <li key={job.id}>
            <button
              onClick={() => onJobClick?.(job.id)}
              className="w-full text-left"
            >
              <h3>{job.title}</h3>
              <p>{job.company}</p>
              <p>{job.location}</p>
              {job.salary && <p>{job.salary}</p>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchResults;
