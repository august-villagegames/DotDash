
import { memo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExpansionRule } from "@/types/expansion-rule";
import { AlertTriangle } from "lucide-react";

interface ConflictWarningProps {
  conflictingRule: ExpansionRule;
  onEditConflicting: () => void;
  onDismiss: () => void;
}

export const ConflictWarning = memo(function ConflictWarning({ 
  conflictingRule, 
  onEditConflicting, 
  onDismiss 
}: ConflictWarningProps) {
  // Truncate replacement text for preview
  const truncatedText = conflictingRule.replacementText.length > 50 
    ? conflictingRule.replacementText.slice(0, 50) + "..."
    : conflictingRule.replacementText;

  return (
    <Alert variant="warning" className="mt-2 animate-in slide-in-from-top-2 duration-200">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <strong>Command already exists:</strong> This command conflicts with an existing shortcut.
          </div>
          
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-md p-3 border">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {conflictingRule.command}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Created {new Date(conflictingRule.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {truncatedText}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEditConflicting}
              className="text-xs"
            >
              Edit existing shortcut
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="text-xs"
            >
              Use different command
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
});