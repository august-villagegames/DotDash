import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OnboardingView from '../OnboardingView';

// Mock the PermissionWindow component
vi.mock('@/components/PermissionWindow', () => ({
  PermissionWindow: ({ onPermissionGranted, onPermissionRevoked, onError }: any) => (
    <div data-testid="permission-window">
      <button onClick={onPermissionGranted} data-testid="grant-permission">
        Grant Permission
      </button>
      <button onClick={onPermissionRevoked} data-testid="revoke-permission">
        Revoke Permission
      </button>
      <button onClick={() => onError('Test error')} data-testid="trigger-error">
        Trigger Error
      </button>
    </div>
  ),
}));

describe('OnboardingView', () => {
  const mockOnContinue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PermissionWindow component', () => {
    const { getByTestId } = render(
      <OnboardingView onContinue={mockOnContinue} />
    );

    expect(getByTestId('permission-window')).toBeInTheDocument();
  });

  it('calls onContinue when permission is granted', () => {
    const { getByTestId } = render(
      <OnboardingView onContinue={mockOnContinue} />
    );

    const grantButton = getByTestId('grant-permission');
    grantButton.click();

    expect(mockOnContinue).toHaveBeenCalled();
  });

  it('handles permission revocation gracefully', () => {
    const { getByTestId } = render(
      <OnboardingView onContinue={mockOnContinue} />
    );

    const revokeButton = getByTestId('revoke-permission');
    
    // Should not throw an error
    expect(() => revokeButton.click()).not.toThrow();
    
    // Should not call onContinue
    expect(mockOnContinue).not.toHaveBeenCalled();
  });

  it('handles errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { getByTestId } = render(
      <OnboardingView onContinue={mockOnContinue} />
    );

    const errorButton = getByTestId('trigger-error');
    errorButton.click();

    expect(consoleSpy).toHaveBeenCalledWith('Permission flow error:', 'Test error');
    
    consoleSpy.mockRestore();
  });
});