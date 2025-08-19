import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PermissionStatus } from '../PermissionStatus';

// Mock the usePermissionFlow hook
const mockUsePermissionFlow = {
  isGranted: false,
  isLoading: false,
  error: null as string | null,
  openSystemSettings: vi.fn(),
  checkPermission: vi.fn(),
  resetError: vi.fn(),
};

vi.mock('@/hooks/usePermissionFlow', () => ({
  usePermissionFlow: () => mockUsePermissionFlow,
}));

describe('PermissionStatus', () => {
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockUsePermissionFlow.isGranted = false;
    mockUsePermissionFlow.isLoading = false;
    mockUsePermissionFlow.error = null;
  });

  it('renders nothing by default (headless component)', () => {
    const { container } = render(
      <PermissionStatus onStatusChange={mockOnStatusChange} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onStatusChange when permission status changes', async () => {
    mockUsePermissionFlow.isGranted = false;

    const { rerender } = render(
      <PermissionStatus onStatusChange={mockOnStatusChange} />
    );

    // Initial call should happen
    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(false);
    });

    // Change permission status
    mockUsePermissionFlow.isGranted = true;

    rerender(<PermissionStatus onStatusChange={mockOnStatusChange} />);

    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(true);
    });

    expect(mockOnStatusChange).toHaveBeenCalledTimes(2);
  });

  it('does not call onStatusChange if status has not changed', async () => {
    mockUsePermissionFlow.isGranted = false;

    const { rerender } = render(
      <PermissionStatus onStatusChange={mockOnStatusChange} />
    );

    // Initial call
    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(false);
    });

    // Re-render with same status
    rerender(<PermissionStatus onStatusChange={mockOnStatusChange} />);

    // Should not call again
    expect(mockOnStatusChange).toHaveBeenCalledTimes(1);
  });

  it('renders children with status when children render prop is provided', () => {
    mockUsePermissionFlow.isGranted = true;
    mockUsePermissionFlow.isLoading = false;
    mockUsePermissionFlow.error = null;

    render(
      <PermissionStatus onStatusChange={mockOnStatusChange}>
        {({ isGranted, isLoading, error }) => (
          <div>
            <span data-testid="granted">{isGranted ? 'granted' : 'denied'}</span>
            <span data-testid="loading">{isLoading ? 'loading' : 'idle'}</span>
            <span data-testid="error">{error || 'no-error'}</span>
          </div>
        )}
      </PermissionStatus>
    );

    expect(screen.getByTestId('granted')).toHaveTextContent('granted');
    expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('renders children with error state', () => {
    mockUsePermissionFlow.isGranted = false;
    mockUsePermissionFlow.isLoading = false;
    mockUsePermissionFlow.error = 'Test error';

    render(
      <PermissionStatus onStatusChange={mockOnStatusChange}>
        {({ isGranted, isLoading, error }) => (
          <div>
            <span data-testid="granted">{isGranted ? 'granted' : 'denied'}</span>
            <span data-testid="loading">{isLoading ? 'loading' : 'idle'}</span>
            <span data-testid="error">{error || 'no-error'}</span>
          </div>
        )}
      </PermissionStatus>
    );

    expect(screen.getByTestId('granted')).toHaveTextContent('denied');
    expect(screen.getByTestId('loading')).toHaveTextContent('idle');
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  it('renders children with loading state', () => {
    mockUsePermissionFlow.isGranted = false;
    mockUsePermissionFlow.isLoading = true;
    mockUsePermissionFlow.error = null;

    render(
      <PermissionStatus onStatusChange={mockOnStatusChange}>
        {({ isGranted, isLoading, error }) => (
          <div>
            <span data-testid="granted">{isGranted ? 'granted' : 'denied'}</span>
            <span data-testid="loading">{isLoading ? 'loading' : 'idle'}</span>
            <span data-testid="error">{error || 'no-error'}</span>
          </div>
        )}
      </PermissionStatus>
    );

    expect(screen.getByTestId('granted')).toHaveTextContent('denied');
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('handles status change from denied to granted', async () => {
    mockUsePermissionFlow.isGranted = false;

    const { rerender } = render(
      <PermissionStatus onStatusChange={mockOnStatusChange}>
        {({ isGranted }) => (
          <span data-testid="status">{isGranted ? 'granted' : 'denied'}</span>
        )}
      </PermissionStatus>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('denied');

    // Change to granted
    mockUsePermissionFlow.isGranted = true;
    rerender(
      <PermissionStatus onStatusChange={mockOnStatusChange}>
        {({ isGranted }) => (
          <span data-testid="status">{isGranted ? 'granted' : 'denied'}</span>
        )}
      </PermissionStatus>
    );

    expect(screen.getByTestId('status')).toHaveTextContent('granted');
    
    await waitFor(() => {
      expect(mockOnStatusChange).toHaveBeenCalledWith(true);
    });
  });
});