import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PermissionWindow } from '../PermissionWindow';

// Mock the usePermissionFlow hook
const mockUsePermissionFlow = {
  isGranted: false,
  isLoading: false,
  error: null as string | null,
  retryCount: 0,
  openSystemSettings: vi.fn(),
  checkPermission: vi.fn(),
  retryPermissionCheck: vi.fn(),
  resetError: vi.fn(),
};

vi.mock('@/hooks/usePermissionFlow', () => ({
  usePermissionFlow: () => mockUsePermissionFlow,
}));

describe('PermissionWindow', () => {
  const mockOnPermissionGranted = vi.fn();
  const mockOnPermissionRevoked = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockUsePermissionFlow.isGranted = false;
    mockUsePermissionFlow.isLoading = false;
    mockUsePermissionFlow.error = null;
    mockUsePermissionFlow.retryCount = 0;
  });

  it('renders the permission window with correct content', () => {
    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Accessibility Permission Required')).toBeInTheDocument();
    expect(screen.getByText(/DotDashDash needs accessibility permission/)).toBeInTheDocument();
    expect(screen.getByText(/Your keystrokes are never logged/)).toBeInTheDocument();
    expect(screen.getByText('Your Privacy is Protected')).toBeInTheDocument();
    expect(screen.getByText('How DotDashDash Works')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open System Settings/ })).toBeInTheDocument();
  });

  it('calls openSystemSettings when button is clicked', async () => {
    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    const button = screen.getByRole('button', { name: /Open System Settings/ });
    fireEvent.click(button);

    expect(mockUsePermissionFlow.resetError).toHaveBeenCalled();
    expect(mockUsePermissionFlow.openSystemSettings).toHaveBeenCalled();
  });

  it('shows loading state when isLoading is true', () => {
    mockUsePermissionFlow.isLoading = true;

    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    const button = screen.getByRole('button', { name: /Opening Settings/ });
    expect(button).toBeDisabled();
  });

  it('displays error message when error exists', () => {
    mockUsePermissionFlow.error = 'Failed to open system settings';

    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Unable to Open Settings')).toBeInTheDocument();
    expect(screen.getByText('Failed to open system settings')).toBeInTheDocument();
    expect(screen.getByText(/You can manually open System Settings/)).toBeInTheDocument();
  });

  it('calls onPermissionGranted when permission is granted', async () => {
    mockUsePermissionFlow.isGranted = true;

    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(mockOnPermissionGranted).toHaveBeenCalled();
    });
  });

  it('calls onError when error occurs', async () => {
    const errorMessage = 'Test error';
    mockUsePermissionFlow.error = errorMessage;

    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('has proper accessibility attributes', () => {
    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    const button = screen.getByRole('button', { name: /Open System Settings/ });
    expect(button).toBeInTheDocument();
    
    // Check that the main content is properly structured
    expect(screen.getByRole('heading', { name: 'Accessibility Permission Required' })).toBeInTheDocument();
    
    // Check dialog role and ARIA attributes
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'permission-title');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'permission-description');
    
    // Check privacy notes
    expect(screen.getByRole('note', { name: 'Privacy and security information' })).toBeInTheDocument();
    expect(screen.getByRole('note', { name: 'How it works' })).toBeInTheDocument();
  });

  it('shows automatic close message', () => {
    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/After enabling the permission, this window will automatically close/)).toBeInTheDocument();
  });

  it('calls onPermissionRevoked when permission is revoked after being granted', async () => {
    // Start with permission granted
    mockUsePermissionFlow.isGranted = true;
    
    const { rerender } = render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    // Wait for initial grant callback
    await waitFor(() => {
      expect(mockOnPermissionGranted).toHaveBeenCalled();
    });

    // Now revoke permission
    mockUsePermissionFlow.isGranted = false;
    mockUsePermissionFlow.isLoading = false;

    rerender(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(mockOnPermissionRevoked).toHaveBeenCalled();
    });
  });

  it('shows retry button when max retries reached', () => {
    mockUsePermissionFlow.error = 'Unable to check accessibility permissions';
    mockUsePermissionFlow.retryCount = 3;

    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    const retryButton = screen.getByRole('button', { name: 'Retry permission check' });
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent('Try Again');
  });

  it('calls retryPermissionCheck when retry button is clicked', async () => {
    mockUsePermissionFlow.error = 'Unable to check accessibility permissions';
    mockUsePermissionFlow.retryCount = 3;

    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    const retryButton = screen.getByRole('button', { name: 'Retry permission check' });
    fireEvent.click(retryButton);

    expect(mockUsePermissionFlow.retryPermissionCheck).toHaveBeenCalled();
  });

  it('shows different error message for retry attempts', () => {
    mockUsePermissionFlow.error = 'Checking permissions... (attempt 2/3)';
    mockUsePermissionFlow.retryCount = 2;

    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('Checking Permissions')).toBeInTheDocument();
    expect(screen.getByText('Checking permissions... (attempt 2/3)')).toBeInTheDocument();
    
    // Check that error has proper ARIA attributes
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
  });

  it('supports keyboard navigation', () => {
    render(
      <PermissionWindow 
        onPermissionGranted={mockOnPermissionGranted}
        onPermissionRevoked={mockOnPermissionRevoked}
        onError={mockOnError}
      />
    );

    const button = screen.getByRole('button', { name: /Open System Settings/ });
    
    // Check that button has proper focus styling
    expect(button).toHaveClass('focus:ring-2', 'focus:ring-primary', 'focus:ring-offset-2');
    
    // Check ARIA describedby
    expect(button).toHaveAttribute('aria-describedby', 'button-help-text');
  });
});