import { describe, it, expect } from 'vitest';
import { 
  detectConflict, 
  generateCommandSuggestions, 
  detectImportConflicts,
  validateCommandWithConflicts 
} from '../conflict-utils';
import type { ExpansionRule } from '@/types/expansion-rule';

// Helper function to create test rules
const createRule = (id: string, command: string, replacementText: string = 'test'): ExpansionRule => ({
  id,
  command,
  replacementText,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('detectConflict', () => {
  const existingRules = [
    createRule('1', '.sig'),
    createRule('2', '.signature'),
    createRule('3', '.meeting'),
  ];

  it('should detect exact command conflicts (case insensitive)', () => {
    const conflict = detectConflict('.sig', existingRules);
    expect(conflict).toBeTruthy();
    expect(conflict?.command).toBe('.sig');
  });

  it('should detect conflicts with different casing', () => {
    const conflict = detectConflict('.SIG', existingRules);
    expect(conflict).toBeTruthy();
    expect(conflict?.command).toBe('.sig');
  });

  it('should return null when no conflict exists', () => {
    const conflict = detectConflict('.newcommand', existingRules);
    expect(conflict).toBeNull();
  });

  it('should exclude specified ID from conflict detection', () => {
    const conflict = detectConflict('.sig', existingRules, '1');
    expect(conflict).toBeNull();
  });

  it('should handle empty or invalid commands', () => {
    expect(detectConflict('', existingRules)).toBeNull();
    expect(detectConflict('   ', existingRules)).toBeNull();
  });

  it('should trim whitespace when checking conflicts', () => {
    const conflict = detectConflict('  .sig  ', existingRules);
    expect(conflict).toBeTruthy();
    expect(conflict?.command).toBe('.sig');
  });
});

describe('generateCommandSuggestions', () => {
  const existingCommands = ['.sig', '.sig2', '.signature', '.meeting'];

  it('should generate numeric suffix suggestions when other strategies are exhausted', () => {
    // Test with existing commands that block descriptive suffixes
    const commandsWithDescriptive = ['.xyz_new', '.xyz_alt', '.xyz_work', '.xyz_personal', '.xyz_temp'];
    const suggestions = generateCommandSuggestions('.xyz', commandsWithDescriptive);
    expect(suggestions.some(s => s.match(/\.xyz\d+/))).toBe(true);
  });

  it('should generate descriptive suffix suggestions', () => {
    const suggestions = generateCommandSuggestions('.test', existingCommands);
    expect(suggestions).toContain('.test_new');
    expect(suggestions).toContain('.test_alt');
    expect(suggestions).toContain('.test_work');
  });

  it('should generate abbreviation suggestions for longer commands', () => {
    const suggestions = generateCommandSuggestions('.meeting', existingCommands);
    // Should include either synonyms or abbreviations for meeting
    expect(suggestions).toContain('.meet');
    // .mee is only 4 chars total, which meets minimum length
    expect(suggestions.some(s => s.length >= 4)).toBe(true);
  });

  it('should generate synonym suggestions for common words', () => {
    const suggestions = generateCommandSuggestions('.sig', existingCommands);
    expect(suggestions).toContain('.sign');
  });

  it('should not suggest existing commands', () => {
    const suggestions = generateCommandSuggestions('.sig', existingCommands);
    expect(suggestions).not.toContain('.sig');
    expect(suggestions).not.toContain('.signature');
  });

  it('should return empty array for invalid commands', () => {
    expect(generateCommandSuggestions('', existingCommands)).toEqual([]);
    expect(generateCommandSuggestions('nosig', existingCommands)).toEqual([]);
  });

  it('should limit suggestions to 5 items', () => {
    const suggestions = generateCommandSuggestions('.test', []);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  it('should handle case insensitive conflict checking', () => {
    const commands = ['.SIG', '.SIGNATURE'];
    const suggestions = generateCommandSuggestions('.sig', commands);
    expect(suggestions).not.toContain('.sig');
    expect(suggestions).not.toContain('.signature');
  });
});

describe('detectImportConflicts', () => {
  const existingRules = [
    createRule('1', '.sig', 'Best regards'),
    createRule('2', '.meeting', 'Meeting agenda'),
  ];

  const importedRules = [
    createRule('3', '.sig', 'Different signature'),
    createRule('4', '.newcommand', 'New content'),
    createRule('5', '.meeting', 'Different meeting content'),
  ];

  it('should detect conflicts between imported and existing rules', () => {
    const conflicts = detectImportConflicts(importedRules, existingRules);
    expect(conflicts).toHaveLength(2);
    
    const sigConflict = conflicts.find(c => c.importedRule.command === '.sig');
    expect(sigConflict).toBeTruthy();
    expect(sigConflict?.existingRule.command).toBe('.sig');
    
    const meetingConflict = conflicts.find(c => c.importedRule.command === '.meeting');
    expect(meetingConflict).toBeTruthy();
    expect(meetingConflict?.existingRule.command).toBe('.meeting');
  });

  it('should provide suggestions for conflicting commands', () => {
    const conflicts = detectImportConflicts(importedRules, existingRules);
    const sigConflict = conflicts.find(c => c.importedRule.command === '.sig');
    
    expect(sigConflict?.suggestedAlternatives).toBeTruthy();
    expect(sigConflict?.suggestedAlternatives.length).toBeGreaterThan(0);
  });

  it('should return empty array when no conflicts exist', () => {
    const noConflictRules = [createRule('6', '.unique', 'Unique content')];
    const conflicts = detectImportConflicts(noConflictRules, existingRules);
    expect(conflicts).toEqual([]);
  });

  it('should handle case insensitive conflicts', () => {
    const importedWithDifferentCase = [createRule('7', '.SIG', 'Uppercase sig')];
    const conflicts = detectImportConflicts(importedWithDifferentCase, existingRules);
    expect(conflicts).toHaveLength(1);
  });
});

describe('validateCommandWithConflicts', () => {
  const existingRules = [
    createRule('1', '.signature'),
    createRule('2', '.meeting'),
  ];

  it('should validate command without conflicts', () => {
    const result = validateCommandWithConflicts('.newcommand', existingRules);
    expect(result.isValid).toBe(true);
    expect(result.hasConflict).toBe(false);
    expect(result.conflictingRule).toBeNull();
    expect(result.suggestions).toEqual([]);
  });

  it('should detect conflicts and provide suggestions', () => {
    const result = validateCommandWithConflicts('.signature', existingRules);
    expect(result.isValid).toBe(false);
    expect(result.hasConflict).toBe(true);
    expect(result.conflictingRule?.command).toBe('.signature');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should exclude specified ID from conflict checking', () => {
    const result = validateCommandWithConflicts('.signature', existingRules, '1');
    expect(result.isValid).toBe(true);
    expect(result.hasConflict).toBe(false);
    expect(result.conflictingRule).toBeNull();
  });

  it('should validate basic command format rules', () => {
    // Invalid format
    expect(validateCommandWithConflicts('nosig', existingRules).isValid).toBe(false);
    expect(validateCommandWithConflicts('.ab', existingRules).isValid).toBe(false);
    expect(validateCommandWithConflicts('.sig-test', existingRules).isValid).toBe(false);
    
    // Valid format, no conflicts
    expect(validateCommandWithConflicts('.valid_command', existingRules).isValid).toBe(true);
  });
});