import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictWarning } from '../ConflictWarning';
import type { ExpansionRule } from '@/types/expansion-rule';

const mockRule: ExpansionRule = {
  id: '1',
  command: '.test',
  replacementText: 'This is a test replacement text',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('ConflictWarning', () => {
  it('renders conflict warning with rule details', () => {
    const onEditConflicting = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ConflictWarning
        conflictingRule={mockRule}
        onEditConflicting={onEditConflicting}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('Command already exists:')).toBeInTheDocument();
    expect(screen.getByText('.test')).toBeInTheDocument();
    expect(screen.getByText('This is a test replacement text')).toBeInTheDocument();
    expect(screen.getByText('Edit existing shortcut')).toBeInTheDocument();
    expect(screen.getByText('Use different command')).toBeInTheDocument();
  });

  it('truncates long replacement text', () => {
    const longTextRule = {
      ...mockRule,
      replacementText: 'This is a very long replacement text that should be truncated because it exceeds the 50 character limit'
    };

    render(
      <ConflictWarning
        conflictingRule={longTextRule}
        onEditConflicting={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/This is a very long replacement text that should/)).toBeInTheDocument();
    expect(screen.getByText(/\.\.\./)).toBeInTheDocument();
  });

  it('calls onEditConflicting when edit button is clicked', () => {
    const onEditConflicting = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ConflictWarning
        conflictingRule={mockRule}
        onEditConflicting={onEditConflicting}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText('Edit existing shortcut'));
    expect(onEditConflicting).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onEditConflicting = vi.fn();
    const onDismiss = vi.fn();

    render(
      <ConflictWarning
        conflictingRule={mockRule}
        onEditConflicting={onEditConflicting}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByText('Use different command'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('displays creation date', () => {
    render(
      <ConflictWarning
        conflictingRule={mockRule}
        onEditConflicting={vi.fn()}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });
});