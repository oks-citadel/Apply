import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SearchBar } from '../SearchBar';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('SearchBar', () => {
  const mockOnSearch = jest.fn();
  const mockOnClear = jest.fn();
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useRouter } = require('next/navigation');
    useRouter.mockReturnValue(mockRouter);
  });

  it('should render search input', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle text input', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'software engineer');

    expect(searchInput).toHaveValue('software engineer');
  });

  it('should call onSearch when form is submitted', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'developer');

    const form = searchInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('developer');
    });
  });

  it('should call onSearch when search button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'react developer');

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    expect(mockOnSearch).toHaveBeenCalledWith('react developer');
  });

  it('should not submit empty search', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('should clear search input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'test query');

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should display initial value prop', () => {
    render(<SearchBar onSearch={mockOnSearch} initialValue="initial search" />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toHaveValue('initial search');
  });

  it('should trim whitespace from search query', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, '  software engineer  ');

    const form = searchInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('software engineer');
    });
  });

  it('should show search icon', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchIcon = screen.getByTestId('search-icon');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should be accessible via keyboard', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'keyboard test');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('keyboard test');
    });
  });

  it('should handle rapid typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'abcdefghijklmnopqrstuvwxyz', { delay: 1 });

    expect(searchInput).toHaveValue('abcdefghijklmnopqrstuvwxyz');
  });

  it('should support placeholder customization', () => {
    render(
      <SearchBar
        onSearch={mockOnSearch}
        placeholder="Search for jobs, companies, or skills..."
      />
    );

    const searchInput = screen.getByPlaceholderText(/search for jobs, companies, or skills/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should have proper ARIA labels', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAttribute('aria-label', 'Search jobs');
  });

  it('should disable submit button when loading', () => {
    render(<SearchBar onSearch={mockOnSearch} isLoading={true} />);

    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeDisabled();
  });

  it('should show loading spinner when searching', () => {
    render(<SearchBar onSearch={mockOnSearch} isLoading={true} />);

    const spinner = screen.getByTestId('loading-spinner');
    expect(spinner).toBeInTheDocument();
  });

  it('should focus input on mount when autoFocus is true', () => {
    render(<SearchBar onSearch={mockOnSearch} autoFocus={true} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toHaveFocus();
  });

  it('should handle special characters in search query', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    const specialChars = 'C++ developer (senior) @remote';
    await user.type(searchInput, specialChars);

    const form = searchInput.closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith(specialChars);
    });
  });

  it('should limit input length if maxLength is provided', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={mockOnSearch} maxLength={10} />);

    const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    await user.type(searchInput, 'this is a very long search query');

    expect(searchInput.value.length).toBeLessThanOrEqual(10);
  });

  describe('Recent searches', () => {
    it('should show recent searches when input is focused', async () => {
      const recentSearches = ['software engineer', 'react developer', 'remote jobs'];
      const user = userEvent.setup();

      render(
        <SearchBar
          onSearch={mockOnSearch}
          recentSearches={recentSearches}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.click(searchInput);

      await waitFor(() => {
        recentSearches.forEach(search => {
          expect(screen.getByText(search)).toBeInTheDocument();
        });
      });
    });

    it('should select recent search when clicked', async () => {
      const recentSearches = ['software engineer'];
      const user = userEvent.setup();

      render(
        <SearchBar
          onSearch={mockOnSearch}
          recentSearches={recentSearches}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.click(searchInput);

      const recentSearchItem = await screen.findByText('software engineer');
      await user.click(recentSearchItem);

      expect(mockOnSearch).toHaveBeenCalledWith('software engineer');
    });

    it('should hide recent searches when input has value', async () => {
      const recentSearches = ['software engineer'];
      const user = userEvent.setup();

      render(
        <SearchBar
          onSearch={mockOnSearch}
          recentSearches={recentSearches}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'developer');

      expect(screen.queryByText('software engineer')).not.toBeInTheDocument();
    });
  });

  describe('Voice search', () => {
    it('should show voice search button when supported', () => {
      render(<SearchBar onSearch={mockOnSearch} enableVoiceSearch={true} />);

      const voiceButton = screen.getByRole('button', { name: /voice search/i });
      expect(voiceButton).toBeInTheDocument();
    });

    it('should trigger voice search when button is clicked', async () => {
      const user = userEvent.setup();
      const mockRecognition = {
        start: jest.fn(),
        stop: jest.fn(),
      };

      global.SpeechRecognition = jest.fn(() => mockRecognition) as any;

      render(<SearchBar onSearch={mockOnSearch} enableVoiceSearch={true} />);

      const voiceButton = screen.getByRole('button', { name: /voice search/i });
      await user.click(voiceButton);

      expect(mockRecognition.start).toHaveBeenCalled();
    });
  });

  describe('Mobile responsiveness', () => {
    it('should adjust layout for mobile', () => {
      global.innerWidth = 375;
      render(<SearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      const container = searchInput.closest('.search-bar-container');

      expect(container).toHaveClass('mobile');
    });
  });
});
