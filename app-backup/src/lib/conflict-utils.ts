import type { ExpansionRule } from "@/types/expansion-rule";

/**
 * Detects if a command conflicts with existing rules
 * @param command The command to check for conflicts
 * @param existingRules Array of existing expansion rules
 * @param excludeId Optional ID to exclude from conflict detection (for editing existing rules)
 * @returns The conflicting rule if found, null otherwise
 */
export function detectConflict(
  command: string,
  existingRules: ExpansionRule[],
  excludeId?: string
): ExpansionRule | null {
  if (!command || command.length === 0) {
    return null;
  }

  const normalizedCommand = command.toLowerCase().trim();
  
  const conflictingRule = existingRules.find(rule => {
    // Skip the rule being edited
    if (excludeId && rule.id === excludeId) {
      return false;
    }
    
    return rule.command.toLowerCase().trim() === normalizedCommand;
  });

  return conflictingRule || null;
}

/**
 * Generates intelligent command suggestions based on the original command
 * @param baseCommand The original command that has conflicts
 * @param existingCommands Array of existing command strings to avoid conflicts
 * @returns Array of suggested alternative commands
 */
// Memoization cache for suggestion generation
const suggestionCache = new Map<string, string[]>();

export function generateCommandSuggestions(
  baseCommand: string,
  existingCommands: string[]
): string[] {
  if (!baseCommand || !baseCommand.startsWith('.')) {
    return [];
  }

  // Create cache key
  const cacheKey = `${baseCommand}:${existingCommands.sort().join(',')}`;
  
  // Check cache first
  if (suggestionCache.has(cacheKey)) {
    return suggestionCache.get(cacheKey)!;
  }

  const suggestions: string[] = [];
  const existingSet = new Set(existingCommands.map(cmd => cmd.toLowerCase()));
  const baseWithoutDot = baseCommand.slice(1); // Remove the leading dot
  
  // Helper function to add suggestion if valid and unique
  const addSuggestion = (suggestion: string) => {
    if (!existingSet.has(suggestion.toLowerCase()) && suggestions.length < 5 && !suggestions.includes(suggestion)) {
      suggestions.push(suggestion);
      return true;
    }
    return false;
  };

  // Strategy 1: Common synonyms for frequent words (prioritize these)
  const synonymMap: Record<string, string[]> = {
    'sig': ['signature', 'sign'],
    'signature': ['sig', 'sign'],
    'meeting': ['meet', 'mtg'],
    'address': ['addr', 'location'],
    'phone': ['tel', 'mobile'],
    'email': ['mail', 'contact'],
    'thanks': ['thx', 'ty'],
    'regards': ['rgds', 'best'],
  };

  const synonyms = synonymMap[baseWithoutDot.toLowerCase()] || [];
  for (const synonym of synonyms) {
    const suggestion = `.${synonym}`;
    if (suggestion.length >= 4) {
      addSuggestion(suggestion);
    }
  }

  // Strategy 2: Common descriptive suffixes
  const descriptiveSuffixes = ['_new', '_alt', '_work', '_personal', '_temp'];
  for (const suffix of descriptiveSuffixes) {
    const suggestion = `.${baseWithoutDot}${suffix}`;
    addSuggestion(suggestion);
  }

  // Strategy 3: Abbreviation variations (if command is long enough)
  if (baseWithoutDot.length > 4) {
    const abbreviations = [
      `.${baseWithoutDot.slice(0, 3)}`, // First 3 chars
      `.${baseWithoutDot.slice(0, 4)}`, // First 4 chars
    ];
    
    for (const abbrev of abbreviations) {
      if (abbrev.length >= 4) {
        addSuggestion(abbrev);
      }
    }
  }

  // Strategy 4: Numeric suffixes (.sig -> .sig2, .sig3, etc.)
  for (let i = 2; i <= 10 && suggestions.length < 5; i++) {
    const suggestion = `.${baseWithoutDot}${i}`;
    addSuggestion(suggestion);
  }

  // Return up to 5 unique suggestions
  const result = suggestions.slice(0, 5);
  
  // Cache the result (limit cache size to prevent memory leaks)
  if (suggestionCache.size > 100) {
    suggestionCache.clear();
  }
  suggestionCache.set(cacheKey, result);
  
  return result;
}

/**
 * Interface for import conflict detection
 */
export interface ConflictItem {
  importedRule: ExpansionRule;
  existingRule: ExpansionRule;
  suggestedAlternatives: string[];
}

/**
 * Detects conflicts when importing multiple rules
 * @param importedRules Rules being imported
 * @param existingRules Current rules in the system
 * @returns Array of conflict items that need resolution
 */
export function detectImportConflicts(
  importedRules: ExpansionRule[],
  existingRules: ExpansionRule[]
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  const existingCommandMap = new Map<string, ExpansionRule>();
  
  // Create a map for efficient lookup
  existingRules.forEach(rule => {
    existingCommandMap.set(rule.command.toLowerCase(), rule);
  });

  // Check each imported rule for conflicts
  importedRules.forEach(importedRule => {
    const existingRule = existingCommandMap.get(importedRule.command.toLowerCase());
    
    if (existingRule) {
      const allCommands = [
        ...existingRules.map(r => r.command),
        ...importedRules.map(r => r.command)
      ];
      
      const suggestedAlternatives = generateCommandSuggestions(
        importedRule.command,
        allCommands
      );

      conflicts.push({
        importedRule,
        existingRule,
        suggestedAlternatives
      });
    }
  });

  return conflicts;
}

/**
 * Validates that a command follows the app's naming rules and doesn't conflict
 * @param command Command to validate
 * @param existingRules Existing rules to check against
 * @param excludeId Optional ID to exclude from conflict checking
 * @returns Object with validation result and conflict information
 */
export function validateCommandWithConflicts(
  command: string,
  existingRules: ExpansionRule[],
  excludeId?: string
): {
  isValid: boolean;
  hasConflict: boolean;
  conflictingRule: ExpansionRule | null;
  suggestions: string[];
} {
  const conflictingRule = detectConflict(command, existingRules, excludeId);
  const hasConflict = conflictingRule !== null;
  
  // Basic validation (from existing validation.ts logic)
  const hasValidFormat = command.startsWith('.') && 
                         command.length > 4 && 
                         /^\.[A-Za-z0-9_]+$/.test(command) &&
                         command.length <= 50 &&
                         !/__/.test(command) &&
                         !/^\._|_$/.test(command);
  
  const isValid = hasValidFormat && !hasConflict;

  const suggestions = hasConflict ? 
    generateCommandSuggestions(command, existingRules.map(r => r.command)) : 
    [];

  return {
    isValid,
    hasConflict,
    conflictingRule,
    suggestions
  };
}