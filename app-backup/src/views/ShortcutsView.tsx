import { useMemo, useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useShortcuts } from "@/state/shortcuts-store";
import { validateRule } from "@/lib/validation";
import { generateCommandSuggestions } from "@/lib/conflict-utils";
import { ConflictWarning } from "@/components/ConflictWarning";
import { CommandSuggestions } from "@/components/CommandSuggestions";
import { PauseStatusIndicator } from "@/components/PauseStatusIndicator";
import type { ExpansionRule } from "@/types/expansion-rule";

export default function ShortcutsView() {
  const { rules, upsertRule, deleteRule } = useShortcuts();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(rules[0]?.id ?? null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rules.filter(r => r.command.toLowerCase().includes(q) || r.replacementText.toLowerCase().includes(q));
  }, [rules, query]);

  const selected = rules.find(r => r.id === selectedId) || null;

  return (
    <div className="h-full flex flex-col">
      {/* Pause status banner */}
      <PauseStatusIndicator 
        variant="banner"
        showReason={true}
        showResumeButton={true}
        className="mx-6 mt-4"
      />
      
      <div className="flex-1 grid grid-cols-[320px_1fr]">
        <section className="border-r p-4 space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Search" value={query} onChange={e => setQuery(e.target.value)} />
            <Button onClick={() => setSelectedId(null)}>New</Button>
          </div>
          <Separator />
          <ul className="space-y-1 overflow-auto max-h-[calc(100vh-8rem)] pr-1">
            {filtered.map(rule => (
              <li key={rule.id}>
                <button
                  onClick={() => setSelectedId(rule.id)}
                  className={`w-full rounded-md px-2 py-1.5 text-left ${selectedId === rule.id ? "bg-accent" : "hover:bg-accent"}`}
                >
                  <div className="font-mono text-sm">{rule.command}</div>
                  <div className="text-xs text-muted-foreground truncate">{rule.replacementText}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="p-6">
          <EditorCard
            key={selected?.id ?? "new"}
            initial={selected}
            onSave={(partial) => {
              if (selected) {
                upsertRule({ id: selected.id, command: partial.command, replacementText: partial.replacementText });
              } else {
                upsertRule({ command: partial.command, replacementText: partial.replacementText });
              }
            }}
            onDelete={() => selected && deleteRule(selected.id)}
            allRules={rules}
            onEditConflicting={(ruleId) => setSelectedId(ruleId)}
          />
        </section>
      </div>
    </div>
  );
}

interface ConflictState {
  hasConflict: boolean;
  conflictingRule: ExpansionRule | null;
  suggestions: string[];
}

function EditorCard({ 
  initial, 
  onSave, 
  onDelete, 
  allRules, 
  onEditConflicting 
}: { 
  initial: ExpansionRule | null; 
  onSave: (r: { command: string; replacementText: string }) => void; 
  onDelete: () => void; 
  allRules: ExpansionRule[]; 
  onEditConflicting?: (ruleId: string) => void;
}) {
  const [command, setCommand] = useState<string>(initial?.command ?? "");
  const [replacementText, setReplacementText] = useState<string>(initial?.replacementText ?? "");
  const [errors, setErrors] = useState<string[]>([]);
  const [conflictState, setConflictState] = useState<ConflictState>({
    hasConflict: false,
    conflictingRule: null,
    suggestions: []
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Memoized command map for efficient conflict detection
  const commandMap = useMemo(() => {
    const map = new Map<string, ExpansionRule>();
    allRules.forEach(rule => {
      if (rule.id !== initial?.id) {
        map.set(rule.command.toLowerCase(), rule);
      }
    });
    return map;
  }, [allRules, initial?.id]);

  // Debounced conflict detection with memoization
  const checkConflicts = useCallback((commandValue: string) => {
    if (!commandValue || commandValue.length <= 1) {
      setConflictState({ hasConflict: false, conflictingRule: null, suggestions: [] });
      setShowSuggestions(false);
      setIsCheckingConflicts(false);
      return;
    }

    setIsCheckingConflicts(true);
    
    // Use optimized conflict detection
    const normalizedCommand = commandValue.toLowerCase().trim();
    const conflictingRule = commandMap.get(normalizedCommand) || null;
    const hasConflict = conflictingRule !== null;
    
    // Only generate suggestions if there's a conflict (expensive operation)
    const suggestions = hasConflict ? 
      generateCommandSuggestions(commandValue, allRules.map(r => r.command)) : 
      [];
    
    // Simulate a brief delay for visual feedback
    setTimeout(() => {
      setConflictState({
        hasConflict,
        conflictingRule,
        suggestions
      });
      setIsCheckingConflicts(false);
    }, 50); // Reduced delay for better responsiveness
  }, [commandMap, allRules]);

  // Debounce conflict checking with performance monitoring
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const startTime = performance.now();
      checkConflicts(command);
      const endTime = performance.now();
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development' && endTime - startTime > 10) {
        console.warn(`Conflict detection took ${endTime - startTime}ms for command: ${command}`);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [command, checkConflicts]);

  function handleSave() {
    // Prevent saving if there are conflicts
    if (conflictState.hasConflict) {
      return;
    }

    const errs = validateRule({ command, replacementText }, allRules, initial?.id).map(e => `${e.field}: ${e.message}`);
    setErrors(errs);
    if (errs.length === 0) {
      onSave({ command, replacementText });
      setShowSuggestions(false);
    }
  }

  function handleConflictEdit() {
    if (conflictState.conflictingRule && onEditConflicting) {
      onEditConflicting(conflictState.conflictingRule.id);
    }
  }

  function handleUseDifferentCommand() {
    setShowSuggestions(true);
    // Focus the command input
    const commandInput = document.getElementById('command') as HTMLInputElement;
    if (commandInput) {
      commandInput.focus();
    }
  }

  function handleSuggestionSelect(suggestion: string) {
    setCommand(suggestion);
    setShowSuggestions(false);
    
    // Brief success feedback
    const commandInput = document.getElementById('command') as HTMLInputElement;
    if (commandInput) {
      commandInput.classList.add('border-green-500');
      setTimeout(() => {
        commandInput.classList.remove('border-green-500');
      }, 1000);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initial ? "Edit Shortcut" : "New Shortcut"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="command">Command</Label>
          <div className="relative">
            <Input 
              id="command" 
              value={command} 
              onChange={e => setCommand(e.target.value)} 
              placeholder=".sig"
              className={conflictState.hasConflict ? "border-yellow-500 focus:border-yellow-500" : ""}
              aria-describedby={conflictState.hasConflict ? "conflict-warning" : "command-help"}
              aria-invalid={conflictState.hasConflict}
            />
            {isCheckingConflicts && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p id="command-help" className="text-xs text-muted-foreground">Must start with "." and include letters, numbers, or underscores.</p>
            {conflictState.hasConflict && (
              <p id="conflict-warning" className="text-xs text-yellow-600 dark:text-yellow-400" role="alert">
                ⚠ Conflict detected
              </p>
            )}
          </div>
          
          {conflictState.hasConflict && conflictState.conflictingRule && (
            <ConflictWarning
              conflictingRule={conflictState.conflictingRule}
              onEditConflicting={handleConflictEdit}
              onDismiss={handleUseDifferentCommand}
            />
          )}

          {(showSuggestions || (conflictState.hasConflict && conflictState.suggestions.length > 0)) && (
            <CommandSuggestions
              originalCommand={command}
              existingCommands={allRules.map(r => r.command)}
              onSuggestionSelect={handleSuggestionSelect}
              suggestions={conflictState.suggestions}
            />
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="replacement">Replacement Text</Label>
          <Textarea id="replacement" value={replacementText} onChange={e => setReplacementText(e.target.value)} rows={8} />
        </div>
        
        {errors.length > 0 && (
          <ul className="text-sm text-destructive list-disc pl-5 space-y-1">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={handleSave}
            disabled={conflictState.hasConflict}
          >
            {initial ? "Save" : "Create"}
          </Button>
          {initial && (
            <Button variant="secondary" onClick={onDelete}>Delete</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


