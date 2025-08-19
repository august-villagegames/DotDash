import React, { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CommandSuggestionsProps {
  originalCommand: string;
  existingCommands: string[];
  onSuggestionSelect: (suggestion: string) => void;
  suggestions?: string[]; // Allow passing pre-generated suggestions
}

export const CommandSuggestions = memo(function CommandSuggestions({ 
  onSuggestionSelect,
  suggestions: providedSuggestions
}: CommandSuggestionsProps) {
  // Use provided suggestions or generate them
  const suggestions = providedSuggestions || [];

  if (suggestions.length === 0) {
    return null;
  }

  const handleKeyDown = (event: React.KeyboardEvent, suggestion: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSuggestionSelect(suggestion);
    }
  };

  return (
    <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
      <div className="text-sm text-muted-foreground mb-2">
        Suggested alternatives:
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <Badge
            key={suggestion}
            variant="outline"
            className={cn(
              "cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "font-mono text-xs"
            )}
            tabIndex={0}
            role="button"
            aria-label={`Use suggestion ${suggestion}`}
            onClick={() => onSuggestionSelect(suggestion)}
            onKeyDown={(e) => handleKeyDown(e, suggestion)}
          >
            {suggestion}
          </Badge>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Click a suggestion to use it, or type your own alternative.
      </div>
    </div>
  );
});