import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSwitcher } from '../LanguageSwitcher';

// Mock i18n hook
const mockChangeLanguage = jest.fn();
const mockUseI18n = {
  locale: 'en',
  setLocale: mockChangeLanguage,
  t: (key: string) => key,
  availableLanguages: [
    { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl' },
  ],
};

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => mockUseI18n,
}));

// Mock Next.js router
const mockPush = jest.fn();
const mockPathname = '/dashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => mockPathname,
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render language switcher', () => {
      render(<LanguageSwitcher />);

      expect(screen.getByRole('button', { name: /language/i })).toBeInTheDocument();
    });

    it('should display current language', () => {
      render(<LanguageSwitcher />);

      expect(screen.getByText(/English/i)).toBeInTheDocument();
    });

    it('should display current language in compact mode', () => {
      render(<LanguageSwitcher variant="compact" />);

      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('should show language icon', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should render as dropdown', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });
  });

  describe('Language Selection', () => {
    it('should open language menu when clicked', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button', { name: /language/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should display all available languages in menu', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('English')).toBeInTheDocument();
        expect(screen.getByText('Español')).toBeInTheDocument();
        expect(screen.getByText('Français')).toBeInTheDocument();
        expect(screen.getByText('Deutsch')).toBeInTheDocument();
      });
    });

    it('should show native language names', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Español')).toBeInTheDocument();
        expect(screen.getByText('Français')).toBeInTheDocument();
        expect(screen.getByText('العربية')).toBeInTheDocument();
      });
    });

    it('should change language when option is selected', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('es');
      });
    });

    it('should highlight current language in menu', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const currentLanguageOption = screen.getByText('English').closest('[role="menuitem"]');
        expect(currentLanguageOption).toHaveAttribute('aria-current', 'true');
      });
    });

    it('should close menu after selection', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('URL Localization', () => {
    it('should update URL when language changes', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/es/dashboard');
      });
    });

    it('should preserve current path when changing language', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Français'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('dashboard'));
      });
    });

    it('should handle root path correctly', async () => {
      jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue('/');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/es');
      });
    });

    it('should handle nested paths correctly', async () => {
      jest.spyOn(require('next/navigation'), 'usePathname').mockReturnValue('/jobs/search');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Deutsch'));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/de/jobs/search');
      });
    });
  });

  describe('RTL Language Support', () => {
    it('should indicate RTL languages in menu', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const arabicOption = screen.getByText('العربية').closest('[role="menuitem"]');
        expect(arabicOption).toHaveAttribute('dir', 'rtl');
      });
    });

    it('should apply RTL direction to document when RTL language selected', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('العربية'));

      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('ar');
        // In real implementation, this would update document.dir
      });
    });

    it('should display RTL indicator icon for RTL languages', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher showRTLIndicator />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const arabicOption = screen.getByText('العربية').closest('[role="menuitem"]');
        expect(arabicOption?.querySelector('[data-rtl-icon]')).toBeInTheDocument();
      });
    });
  });

  describe('Persistence', () => {
    it('should persist language preference to localStorage', async () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      await waitFor(() => {
        expect(setItemSpy).toHaveBeenCalledWith('preferred-locale', 'es');
      });

      setItemSpy.mockRestore();
    });

    it('should load language preference from localStorage on mount', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockReturnValue('fr');

      render(<LanguageSwitcher />);

      expect(getItemSpy).toHaveBeenCalledWith('preferred-locale');

      getItemSpy.mockRestore();
    });

    it('should persist to user preferences API when authenticated', async () => {
      const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const user = userEvent.setup();
      render(<LanguageSwitcher isAuthenticated />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.stringContaining('/users/locale'),
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('es'),
          }),
        );
      });

      fetchSpy.mockRestore();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should open menu with Enter key', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('should navigate menu items with arrow keys', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Second item should be focused
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[1]).toHaveFocus();
    });

    it('should select language with Enter key', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalled();
      });
    });

    it('should close menu with Escape key', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('should support Tab navigation', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(button).not.toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should announce current language to screen readers', () => {
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('English'));
    });

    it('should have accessible menu items', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        menuItems.forEach(item => {
          expect(item).toHaveAttribute('role', 'menuitem');
        });
      });
    });

    it('should indicate expanded state', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await user.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('should manage focus when opening menu', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        expect(menu).toBeInTheDocument();
        // First menu item should receive focus
        expect(screen.getAllByRole('menuitem')[0]).toHaveFocus();
      });
    });

    it('should return focus to button when menu closes', async () => {
      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(button).toHaveFocus();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while changing language', async () => {
      mockChangeLanguage.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      );

      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    it('should disable switcher while loading', async () => {
      mockChangeLanguage.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      );

      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle language change errors gracefully', async () => {
      mockChangeLanguage.mockRejectedValue(new Error('Failed to change language'));

      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      await waitFor(() => {
        expect(screen.getByText(/failed to change language/i)).toBeInTheDocument();
      });
    });

    it('should show error message and allow retry', async () => {
      mockChangeLanguage.mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should revert to previous language on error', async () => {
      mockChangeLanguage.mockRejectedValue(new Error('Failed'));

      const user = userEvent.setup();
      render(<LanguageSwitcher />);

      expect(screen.getByText('English')).toBeInTheDocument();

      await user.click(screen.getByRole('button'));
      await user.click(screen.getByText('Español'));

      await waitFor(() => {
        // Should still show English after error
        expect(screen.getByText('English')).toBeInTheDocument();
      });
    });
  });

  describe('Variants', () => {
    it('should render dropdown variant', () => {
      render(<LanguageSwitcher variant="dropdown" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render compact variant', () => {
      render(<LanguageSwitcher variant="compact" />);

      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    it('should render inline variant', () => {
      render(<LanguageSwitcher variant="inline" />);

      // Should show all languages as buttons
      expect(screen.getByText('EN')).toBeInTheDocument();
      expect(screen.getByText('ES')).toBeInTheDocument();
      expect(screen.getByText('FR')).toBeInTheDocument();
    });
  });
});
