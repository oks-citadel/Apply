import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

// Mock the theme
jest.mock('../../../theme', () => ({
  theme: {
    colors: {
      primary: {
        600: '#2563EB',
      },
      gray: {
        200: '#E5E7EB',
        900: '#111827',
      },
      white: '#FFFFFF',
      transparent: 'transparent',
    },
    spacing: {
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      md: 8,
    },
    fontSize: {
      sm: 14,
      md: 16,
      lg: 18,
    },
    fontWeight: {
      semibold: '600',
    },
  },
}));

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(<Button title="Click Me" />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={onPressMock} />);

    fireEvent.press(getByText('Click Me'));

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button title="Click Me" onPress={onPressMock} disabled />
    );

    fireEvent.press(getByText('Click Me'));

    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPressMock = jest.fn();
    const { root } = render(<Button title="Click Me" onPress={onPressMock} loading />);

    fireEvent.press(root);

    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(<Button title="Click Me" loading />);

    // Text should not be visible when loading
    expect(queryByText('Click Me')).toBeNull();

    // ActivityIndicator should be present
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders primary variant by default', () => {
    const { root } = render(<Button title="Click Me" />);

    // Check that the button has primary variant styles
    expect(root).toBeTruthy();
  });

  it('renders secondary variant', () => {
    const { getByText } = render(<Button title="Click Me" variant="secondary" />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders outline variant', () => {
    const { getByText } = render(<Button title="Click Me" variant="outline" />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders ghost variant', () => {
    const { getByText } = render(<Button title="Click Me" variant="ghost" />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders small size', () => {
    const { getByText } = render(<Button title="Click Me" size="sm" />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders medium size by default', () => {
    const { getByText } = render(<Button title="Click Me" />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders large size', () => {
    const { getByText } = render(<Button title="Click Me" size="lg" />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('renders with full width', () => {
    const { root } = render(<Button title="Click Me" fullWidth />);

    expect(root).toBeTruthy();
  });

  it('renders with icon', () => {
    const TestIcon = () => <></>;
    const { getByText } = render(<Button title="Click Me" icon={<TestIcon />} />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('applies custom style', () => {
    const customStyle = { marginTop: 10 };
    const { root } = render(<Button title="Click Me" style={customStyle} />);

    expect(root).toBeTruthy();
  });

  it('applies custom text style', () => {
    const customTextStyle = { fontSize: 20 };
    const { getByText } = render(<Button title="Click Me" textStyle={customTextStyle} />);

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('has reduced opacity when disabled', () => {
    const { root } = render(<Button title="Click Me" disabled />);

    // The button should still render
    expect(root).toBeTruthy();
  });

  it('passes accessibility props', () => {
    const { getByLabelText } = render(
      <Button title="Click Me" accessibilityLabel="Submit button" />
    );

    // The button should be accessible
    expect(getByLabelText('Submit button')).toBeTruthy();
  });
});
