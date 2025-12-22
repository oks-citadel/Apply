'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AutocompleteProps {
  suggestions?: string[];
  onSelect?: (value: string) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function Autocomplete({
  suggestions = [],
  onSelect,
  placeholder = 'Search...',
  value: controlledValue,
  onChange,
}: AutocompleteProps) {
  const [inputValue, setInputValue] = useState(controlledValue || '');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue) {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setIsOpen(false);
    }
  }, [inputValue, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (onChange) {
      onChange(value);
    }
  };

  const handleSelect = (suggestion: string) => {
    setInputValue(suggestion);
    setIsOpen(false);
    if (onSelect) {
      onSelect(suggestion);
    }
    if (onChange) {
      onChange(suggestion);
    }
  };

  return (
    <div data-testid="autocomplete" className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        aria-label="Search"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls="autocomplete-listbox"
      />
      {isOpen && filteredSuggestions.length > 0 && (
        <ul id="autocomplete-listbox" role="listbox" className="absolute w-full bg-white border shadow-lg">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              role="option"
              aria-selected={suggestion === inputValue}
              onClick={() => handleSelect(suggestion)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Autocomplete;
