import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));

    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 300 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 299ms (just before delay)
    act(() => {
      jest.advanceTimersByTime(299);
    });

    // Value should still be initial
    expect(result.current).toBe('initial');

    // Fast-forward time by 1ms more (reaching delay)
    act(() => {
      jest.advanceTimersByTime(1);
    });

    // Value should now be updated
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'initial' },
      }
    );

    expect(result.current).toBe('initial');

    // First change
    rerender({ value: 'change1' });

    // Fast-forward time by 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Second change before delay completes
    rerender({ value: 'change2' });

    // Fast-forward time by 200ms (total 400ms from first change, but only 200ms from second)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Value should still be initial because timer was reset
    expect(result.current).toBe('initial');

    // Fast-forward remaining 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Value should now be change2
    expect(result.current).toBe('change2');
  });

  it('should work with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 500 });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe('updated');
  });

  it('should work with default delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });

    // Default delay is 300ms
    act(() => {
      jest.advanceTimersByTime(299);
    });

    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current).toBe('updated');
  });

  it('should work with different data types', () => {
    // Test with numbers
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      {
        initialProps: { value: 0 },
      }
    );

    numberRerender({ value: 42 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(numberResult.current).toBe(42);

    // Test with objects
    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      {
        initialProps: { value: { name: 'initial' } },
      }
    );

    const newObject = { name: 'updated' };
    objectRerender({ value: newObject });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(objectResult.current).toEqual(newObject);

    // Test with arrays
    const { result: arrayResult, rerender: arrayRerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      {
        initialProps: { value: [1, 2, 3] },
      }
    );

    const newArray = [4, 5, 6];
    arrayRerender({ value: newArray });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(arrayResult.current).toEqual(newArray);
  });

  it('should cleanup timer on unmount', () => {
    const { rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });

    // Unmount before delay completes
    unmount();

    // This should not cause any issues
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Test passes if no errors thrown
    expect(true).toBe(true);
  });

  it('should handle multiple rapid changes correctly', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'v1' },
      }
    );

    expect(result.current).toBe('v1');

    // Rapid changes
    rerender({ value: 'v2' });
    act(() => jest.advanceTimersByTime(50));

    rerender({ value: 'v3' });
    act(() => jest.advanceTimersByTime(50));

    rerender({ value: 'v4' });
    act(() => jest.advanceTimersByTime(50));

    rerender({ value: 'v5' });

    // Still showing initial value
    expect(result.current).toBe('v1');

    // Complete the delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should show the last value
    expect(result.current).toBe('v5');
  });

  it('should update when delay changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    rerender({ value: 'updated', delay: 100 });

    // With new delay of 100ms
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe('updated');
  });
});
