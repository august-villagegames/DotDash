
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
    <Alert variant="warning" >
      <AlertTriangle  />
      <AlertDescription>
        <div >
          <div>
            <strong>Command already exists:</strong> This command conflicts with an existing shortcut.
          </div>
          
          <div >
            <div >
              <Badge variant="secondary" >
                {conflictingRule.command}
              </Badge>
              <span >
                Created {new Date(conflictingRule.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div >
              {truncatedText}
            </div>
          </div>

          <div >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEditConflicting}
              
            >
              Edit existing shortcut
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              
            >
              Use different command
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
});