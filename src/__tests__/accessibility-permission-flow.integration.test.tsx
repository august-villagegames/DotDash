import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import OnboardingView from '@/views/OnboardingView';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-opener', () => ({
  openUrl: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

const mockInvoke = vi.mocked(invoke);
const mockOpenUrl = vi.mocked(openUrl);

describe('Accessibility Permission Flow Integration', () => {
  const mockOnContinue = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders permission window when permission is denied', async () => {
    mockInvoke.mockResolvedValue(false);

    render(<OnboardingView onContinue={mockOnContinue} />);

    // Should show permission window
    expect(screen.getByText('Accessibility Permission Required')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Open System Settings/ })).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('calls onContinue when permission is granted', async () => {
    mockInvoke.mockResolvedValue(true);

    render(<OnboardingView onContinue={mockOnContinue} />);

    // Should call onContinue when permission is detected as granted
    await waitFor(() => {
      expect(mockOnContinue).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('opens system settings when button is clicked', async () => {
    mockInvoke.mockResolvedValue(false);

    render(<OnboardingView onContinue={mockOnContinue} />);

    // Wait for button to be available
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Open System Settings/ })).toBeInTheDocument();
    }, { timeout: 1000 });

    const settingsButton = screen.getByRole('button', { name: /Open System Settings/ });
    fireEvent.click(settingsButton);

    expect(mockOpenUrl).toHaveBeenCalledWith('x-apple.systempreferences:com.apple.preference.universalaccess');
  });

  it('shows error message when system settings fail to open', async () => {
    mockInvoke.mockResolvedValue(false);
    mockOpenUrl.mockRejectedValue(new Error('Failed to open URL'));

    render(<OnboardingView onContinue={mockOnContinue} />);

    // Wait for button to be available
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Open System Settings/ })).toBeInTheDocument();
    }, { timeout: 1000 });

    const settingsButton = screen.getByRole('button', { name: /Open System Settings/ });
    fireEvent.click(settingsButton);

    // Should show error message with fallback instructions
    await waitFor(() => {
      expect(screen.getByText(/Failed to open system settings/)).toBeInTheDocument();
    }, { timeout: 1000 });

    expect(screen.getByText(/manually navigate to System/)).toBeInTheDocument();
  });

  it('has proper accessibility structure', async () => {
    mockInvoke.mockResolvedValue(false);

    render(<OnboardingView onContinue={mockOnContinue} />);

    // Check ARIA structure
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'permission-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'permission-description');

    // Check heading structure
    expect(screen.getByRole('heading', { name: 'Accessibility Permission Required' })).toBeInTheDocument();

    // Check privacy information is marked as note
    expect(screen.getByRole('note', { name: 'Privacy and security information' })).toBeInTheDocument();
    expect(screen.getByRole('note', { name: 'How it works' })).toBeInTheDocument();
  });

  it('validates key requirements are met', async () => {
    mockInvoke.mockResolvedValue(false);

    render(<OnboardingView onContinue={mockOnContinue} />);

    // Requirement 1.1: Display simplified permission window
    expect(screen.getByText('Accessibility Permission Required')).toBeInTheDocument();

    // Requirement 1.2: Clear, user-friendly explanation
    expect(screen.getByText(/DotDashDash needs accessibility permission/)).toBeInTheDocument();

    // Requirement 1.4: No complex technical details (avoid false positives)
    expect(screen.queryByText(/debug log/i)).not.toBeInTheDocument();

    // Requirement 4.1: Clear explanation of permission use
    expect(screen.getByText(/detect when you type your custom shortcuts/)).toBeInTheDocument();

    // Requirement 4.2: Privacy reassurance
    expect(screen.getByText('Your Privacy is Protected')).toBeInTheDocument();
    expect(screen.getByText(/never logged, recorded, or stored/)).toBeInTheDocument();

    // Requirement 4.3: User-friendly language
    expect(screen.getByText(/No data is transmitted to external servers/)).toBeInTheDocument();
    expect(screen.getByText('How DotDashDash Works')).toBeInTheDocument();
  });
});