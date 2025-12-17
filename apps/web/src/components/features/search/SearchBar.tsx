'use client';

import React, { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search jobs...',
  initialValue = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="search-bar">
      <div className="flex">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          aria-label="Search"
          className="flex-1"
        />
        <button type="submit" aria-label="Search">
          Search
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
