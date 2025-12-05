import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalHeader, ModalFooter } from '../Modal';

describe('Modal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    children: <div>Modal Content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders modal when open is true', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render modal when open is false', () => {
      render(<Modal {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders with title', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('renders with description', () => {
      render(
        <Modal
          {...defaultProps}
          title="Test Modal"
          description="This is a test modal"
        />
      );
      expect(screen.getByText('This is a test modal')).toBeInTheDocument();
    });

    it('renders without header when no title or description', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders close button when title is present', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('renders with small size', () => {
      render(<Modal {...defaultProps} size="sm" />);
      const dialog = screen.getByRole('dialog');
      // Check that size class is applied somewhere in the modal
      expect(dialog.innerHTML).toContain('max-w-sm');
    });

    it('renders with medium size (default)', () => {
      render(<Modal {...defaultProps} size="md" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.innerHTML).toContain('max-w-md');
    });

    it('renders with large size', () => {
      render(<Modal {...defaultProps} size="lg" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.innerHTML).toContain('max-w-lg');
    });

    it('renders with extra large size', () => {
      render(<Modal {...defaultProps} size="xl" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.innerHTML).toContain('max-w-xl');
    });

    it('renders with full size', () => {
      render(<Modal {...defaultProps} size="full" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.innerHTML).toContain('max-w-full');
    });
  });

  describe('User Interactions', () => {
    it('calls onClose when backdrop is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} />);
      const backdrop = screen.getByRole('dialog');

      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} />);
      const content = screen.getByText('Modal Content');

      await user.click(content);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(
        <Modal {...defaultProps} onClose={onClose} title="Test Modal" />
      );
      const closeButton = screen.getByLabelText('Close modal');

      await user.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('calls onClose when Escape key is pressed', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not respond to Escape when modal is closed', async () => {
      const onClose = jest.fn();
      const user = userEvent.setup();

      render(<Modal {...defaultProps} open={false} onClose={onClose} />);

      await user.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('prevents body scroll when modal is open', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');
      unmount();
    });

    it('restores body scroll when modal is closed', () => {
      const { rerender, unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<Modal {...defaultProps} open={false} />);
      expect(document.body.style.overflow).toBe('unset');

      unmount();
    });

    it('restores body scroll when modal is unmounted', () => {
      const { unmount } = render(<Modal {...defaultProps} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('Accessibility', () => {
    it('has role dialog', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has aria-modal attribute', () => {
      render(<Modal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('links title with aria-labelledby', () => {
      render(<Modal {...defaultProps} title="Test Modal" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
      expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
    });

    it('links description with aria-describedby', () => {
      render(
        <Modal
          {...defaultProps}
          title="Test Modal"
          description="Test description"
        />
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
      expect(screen.getByText('Test description')).toHaveAttribute(
        'id',
        'modal-description'
      );
    });

    it('does not have aria-labelledby when no title', () => {
      render(<Modal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).not.toHaveAttribute('aria-labelledby');
    });

    it('close button has accessible label', () => {
      render(<Modal {...defaultProps} title="Test" />);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('applies custom className to modal content', () => {
      render(<Modal {...defaultProps} className="custom-modal" />);
      const dialog = screen.getByRole('dialog');
      expect(dialog.innerHTML).toContain('custom-modal');
    });
  });

  describe('ModalHeader Component', () => {
    it('renders ModalHeader', () => {
      render(
        <Modal {...defaultProps}>
          <ModalHeader>
            <h2>Header Content</h2>
          </ModalHeader>
        </Modal>
      );
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });
  });

  describe('ModalFooter Component', () => {
    it('renders ModalFooter', () => {
      render(
        <Modal {...defaultProps}>
          <ModalFooter>
            <button>Cancel</button>
            <button>Confirm</button>
          </ModalFooter>
        </Modal>
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('applies correct layout styles to ModalFooter', () => {
      render(
        <Modal {...defaultProps}>
          <ModalFooter>
            <div data-testid="footer-content">Footer</div>
          </ModalFooter>
        </Modal>
      );
      const footer = screen.getByTestId('footer-content').parentElement;
      expect(footer).toHaveClass('flex', 'items-center', 'justify-end', 'space-x-3');
    });
  });

  describe('Complex Content', () => {
    it('renders complex modal with all sections', () => {
      render(
        <Modal
          {...defaultProps}
          title="Complex Modal"
          description="This is a complex modal"
        >
          <ModalHeader>
            <p>Additional header content</p>
          </ModalHeader>
          <div>Body content</div>
          <ModalFooter>
            <button>Cancel</button>
            <button>Save</button>
          </ModalFooter>
        </Modal>
      );

      expect(screen.getByText('Complex Modal')).toBeInTheDocument();
      expect(screen.getByText('This is a complex modal')).toBeInTheDocument();
      expect(screen.getByText('Additional header content')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });
});
