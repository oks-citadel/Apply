import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Autocomplete } from '../Autocomplete';
import { act } from 'react';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Autocomplete', () => {
  const mockSuggestions = [
    'Software Engineer',
    'Software Developer',
    'Software Architect',
    'Senior Software Engineer',
    'Junior Software Developer',
  ];

  const mockOnSelect = jest.fn();
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: mockSuggestions }),
    });
  });

  it('should render input field', () => {
    render(<Autocomplete onSelect={mockOnSelect} />);

    const input = screen.getByRole('combobox');
    expect(input).toBeInTheDocument();
  });

  it('should show suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      mockSuggestions.forEach(suggestion => {
        expect(screen.getByText(suggestion)).toBeInTheDocument();
      });
    });
  });

  it('should debounce API calls', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    render(<Autocomplete onSelect={mockOnSelect} debounceMs={300} />);

    const input = screen.getByRole('combobox');

    await user.type(input, 's');
    await user.type(input, 'o');
    await user.type(input, 'f');
    await user.type(input, 't');

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      // Should only make one API call after debounce
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });

  it('should select suggestion when clicked', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    const suggestion = screen.getByText('Software Engineer');
    await user.click(suggestion);

    expect(mockOnSelect).toHaveBeenCalledWith('Software Engineer');
    expect(input).toHaveValue('Software Engineer');
  });

  it('should navigate suggestions with keyboard', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    // Arrow down to first suggestion
    await user.keyboard('{ArrowDown}');
    const firstSuggestion = screen.getByText('Software Engineer');
    expect(firstSuggestion).toHaveClass('highlighted');

    // Arrow down to second suggestion
    await user.keyboard('{ArrowDown}');
    const secondSuggestion = screen.getByText('Software Developer');
    expect(secondSuggestion).toHaveClass('highlighted');
  });

  it('should select highlighted suggestion with Enter key', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(mockOnSelect).toHaveBeenCalledWith('Software Engineer');
  });

  it('should close suggestions with Escape key', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    await user.keyboard('{Escape}');

    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
  });

  it('should hide suggestions when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Autocomplete onSelect={mockOnSelect} />
        <button>Outside</button>
      </div>
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    const outsideButton = screen.getByRole('button', { name: /outside/i });
    await user.click(outsideButton);

    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
  });

  it('should show "No suggestions" message when no results', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [] }),
    });

    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'xyz123');

    await waitFor(() => {
      expect(screen.getByText(/no suggestions/i)).toBeInTheDocument();
    });
  });

  it('should show loading state while fetching', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ suggestions: mockSuggestions }),
      }), 100))
    );

    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      expect(screen.getByText(/error loading suggestions/i)).toBeInTheDocument();
    });
  });

  it('should not fetch suggestions for queries shorter than minLength', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} minLength={3} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'so');

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('should highlight matching text in suggestions', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} highlightMatch={true} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      const highlighted = screen.getAllByTestId('match-highlight');
      expect(highlighted.length).toBeGreaterThan(0);
    });
  });

  it('should support custom suggestion renderer', async () => {
    const customRenderer = (suggestion: string) => (
      <div data-testid="custom-suggestion">Custom: {suggestion}</div>
    );

    const user = userEvent.setup();
    render(
      <Autocomplete
        onSelect={mockOnSelect}
        renderSuggestion={customRenderer}
      />
    );

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      const customSuggestions = screen.getAllByTestId('custom-suggestion');
      expect(customSuggestions.length).toBeGreaterThan(0);
    });
  });

  it('should limit number of suggestions displayed', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} maxSuggestions={3} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'soft');

    await waitFor(() => {
      const suggestions = screen.getAllByRole('option');
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  it('should call onChange callback when input value changes', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} onChange={mockOnChange} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'test');

    expect(mockOnChange).toHaveBeenCalledWith('test');
  });

  it('should support initial value', () => {
    render(<Autocomplete onSelect={mockOnSelect} initialValue="Initial" />);

    const input = screen.getByRole('combobox');
    expect(input).toHaveValue('Initial');
  });

  it('should clear input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<Autocomplete onSelect={mockOnSelect} showClearButton={true} />);

    const input = screen.getByRole('combobox');
    await user.type(input, 'test');

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(input).toHaveValue('');
  });

  describe('Multiple suggestions sources', () => {
    it('should show grouped suggestions from different sources', async () => {
      const groupedSuggestions = {
        titles: ['Software Engineer', 'Software Developer'],
        companies: ['Software Inc', 'Software Corp'],
        locations: ['Software City'],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => groupedSuggestions,
      });

      const user = userEvent.setup();
      render(<Autocomplete onSelect={mockOnSelect} grouped={true} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'soft');

      await waitFor(() => {
        expect(screen.getByText(/titles/i)).toBeInTheDocument();
        expect(screen.getByText(/companies/i)).toBeInTheDocument();
        expect(screen.getByText(/locations/i)).toBeInTheDocument();
      });
    });
  });

  describe('Recent searches integration', () => {
    it('should show recent searches when input is empty and focused', async () => {
      const recentSearches = ['react developer', 'python engineer'];
      const user = userEvent.setup();

      render(
        <Autocomplete
          onSelect={mockOnSelect}
          recentSearches={recentSearches}
        />
      );

      const input = screen.getByRole('combobox');
      await user.click(input);

      await waitFor(() => {
        expect(screen.getByText('react developer')).toBeInTheDocument();
        expect(screen.getByText('python engineer')).toBeInTheDocument();
      });
    });

    it('should prioritize recent searches in suggestions', async () => {
      const recentSearches = ['Software Engineer'];
      const user = userEvent.setup();

      render(
        <Autocomplete
          onSelect={mockOnSelect}
          recentSearches={recentSearches}
          prioritizeRecent={true}
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'soft');

      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions[0]).toHaveTextContent('Software Engineer');
        expect(suggestions[0]).toHaveClass('recent');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<Autocomplete onSelect={mockOnSelect} />);

      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
      expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('should update aria-expanded when suggestions are shown', async () => {
      const user = userEvent.setup();
      render(<Autocomplete onSelect={mockOnSelect} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'soft');

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should set aria-activedescendant for highlighted suggestion', async () => {
      const user = userEvent.setup();
      render(<Autocomplete onSelect={mockOnSelect} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'soft');

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');

      expect(input).toHaveAttribute('aria-activedescendant');
    });

    it('should announce number of suggestions to screen readers', async () => {
      const user = userEvent.setup();
      render(<Autocomplete onSelect={mockOnSelect} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'soft');

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent(/5 suggestions available/i);
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid input changes efficiently', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });

      render(<Autocomplete onSelect={mockOnSelect} debounceMs={300} />);

      const input = screen.getByRole('combobox');

      // Type rapidly
      await user.type(input, 'software engineer senior');

      // Only the final state should trigger API call
      act(() => {
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      jest.useRealTimers();
    });

    it('should cancel pending requests when input changes', async () => {
      const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

      const user = userEvent.setup();
      render(<Autocomplete onSelect={mockOnSelect} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 's');
      await user.type(input, 'o');

      await waitFor(() => {
        expect(abortSpy).toHaveBeenCalled();
      });

      abortSpy.mockRestore();
    });

    it('should use memoization for suggestion rendering', async () => {
      const renderSpy = jest.fn((suggestion: string) => <div>{suggestion}</div>);

      const user = userEvent.setup();
      render(
        <Autocomplete
          onSelect={mockOnSelect}
          renderSuggestion={renderSpy}
        />
      );

      const input = screen.getByRole('combobox');
      await user.type(input, 'soft');

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      // Typing more shouldn't re-render existing suggestions
      const initialCallCount = renderSpy.mock.calls.length;
      await user.type(input, 'w');

      expect(renderSpy.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Mobile support', () => {
    it('should adjust suggestion list for mobile screens', () => {
      global.innerWidth = 375;
      render(<Autocomplete onSelect={mockOnSelect} />);

      const container = screen.getByTestId('autocomplete-container');
      expect(container).toHaveClass('mobile');
    });

    it('should show suggestions in fullscreen modal on mobile', async () => {
      global.innerWidth = 375;
      const user = userEvent.setup();

      render(<Autocomplete onSelect={mockOnSelect} mobileFullscreen={true} />);

      const input = screen.getByRole('combobox');
      await user.type(input, 'soft');

      await waitFor(() => {
        const modal = screen.getByTestId('mobile-suggestions-modal');
        expect(modal).toBeInTheDocument();
      });
    });
  });
});
