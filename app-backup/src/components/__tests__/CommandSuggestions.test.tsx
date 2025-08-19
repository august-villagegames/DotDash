import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandSuggestions } from '../CommandSuggestions';

describe('CommandSuggestions', () => {
  const mockProps = {
    originalCommand: '.test',
    existingCommands: ['.test', '.test2'],
    onSuggestionSelect: vi.fn(),
  };

  it('renders suggestions when provided', () => {
    const suggestions = ['.test_new', '.test_alt', '.test_work'];
    
    render(
      <CommandSuggestions
        {...mockProps}
        suggestions={suggestions}
      />
    );

    expect(screen.getByText('Suggested alternatives:')).toBeInTheDocument();
    expect(screen.getByText('.test_new')).toBeInTheDocument();
    expect(screen.getByText('.test_alt')).toBeInTheDocument();
    expect(screen.getByText('.test_work')).toBeInTheDocument();
  });

  it('does not render when no suggestions provided', () => {
    render(
      <CommandSuggestions
        {...mockProps}
        suggestions={[]}
      />
    );

    expect(screen.queryByText('Suggested alternatives:')).not.toBeInTheDocument();
  });

  it('calls onSuggestionSelect when suggestion is clicked', () => {
    const onSuggestionSelect = vi.fn();
    const suggestions = ['.test_new', '.test_alt'];
    
    render(
      <CommandSuggestions
        {...mockProps}
        onSuggestionSelect={onSuggestionSelect}
        suggestions={suggestions}
      />
    );

    fireEvent.click(screen.getByText('.test_new'));
    expect(onSuggestionSelect).toHaveBeenCalledWith('.test_new');
  });

  it('handles keyboard navigation', () => {
    const onSuggestionSelect = vi.fn();
    const suggestions = ['.test_new'];
    
    render(
      <CommandSuggestions
        {...mockProps}
        onSuggestionSelect={onSuggestionSelect}
        suggestions={suggestions}
      />
    );

    const suggestion = screen.getByText('.test_new');
    fireEvent.keyDown(suggestion, { key: 'Enter' });
    expect(onSuggestionSelect).toHaveBeenCalledWith('.test_new');

    fireEvent.keyDown(suggestion, { key: ' ' });
    expect(onSuggestionSelect).toHaveBeenCalledTimes(2);
  });

  it('has proper accessibility attributes', () => {
    const suggestions = ['.test_new'];
    
    render(
      <CommandSuggestions
        {...mockProps}
        suggestions={suggestions}
      />
    );

    const suggestion = screen.getByText('.test_new');
    expect(suggestion).toHaveAttribute('role', 'button');
    expect(suggestion).toHaveAttribute('tabIndex', '0');
    expect(suggestion).toHaveAttribute('aria-label', 'Use suggestion .test_new');
  });

  it('displays help text', () => {
    const suggestions = ['.test_new'];
    
    render(
      <CommandSuggestions
        {...mockProps}
        suggestions={suggestions}
      />
    );

    expect(screen.getByText('Click a suggestion to use it, or type your own alternative.')).toBeInTheDocument();
  });
});