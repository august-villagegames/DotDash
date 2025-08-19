import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { ConflictItem } from "@/lib/conflict-utils";

export interface ConflictResolution {
  action: 'skip' | 'overwrite' | 'rename';
  newCommand?: string;
  ruleId: string;
}

interface ImportConflictDialogProps {
  open: boolean;
  conflicts: ConflictItem[];
  onResolve: (resolutions: ConflictResolution[]) => void;
  onCancel: () => void;
}

export function ImportConflictDialog({
  open,
  conflicts,
  onResolve,
  onCancel
}: ImportConflictDialogProps) {
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolution>>(
    new Map(conflicts.map(conflict => [
      conflict.importedRule.id,
      { action: 'skip', ruleId: conflict.importedRule.id }
    ]))
  );

  const updateResolution = (ruleId: string, updates: Partial<ConflictResolution>) => {
    setResolutions(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(ruleId) || { action: 'skip', ruleId };
      newMap.set(ruleId, { ...current, ...updates });
      return newMap;
    });
  };

  const handleResolve = () => {
    const resolutionArray = Array.from(resolutions.values());
    onResolve(resolutionArray);
  };

  const canResolve = Array.from(resolutions.values()).every(resolution => {
    if (resolution.action === 'rename') {
      return resolution.newCommand && resolution.newCommand.trim().length > 0;
    }
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resolve Import Conflicts</DialogTitle>
          <DialogDescription>
            {conflicts.length} shortcut{conflicts.length === 1 ? '' : 's'} in the import file 
            conflict{conflicts.length === 1 ? 's' : ''} with existing shortcuts. 
            Choose how to handle each conflict.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {conflicts.map((conflict, index) => {
            const resolution = resolutions.get(conflict.importedRule.id);
            const isRename = resolution?.action === 'rename';

            return (
              <div key={conflict.importedRule.id} className="space-y-4">
                {index > 0 && <Separator />}
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {conflict.importedRule.command}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      conflicts with existing shortcut
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-medium">Importing:</div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border">
                        <div className="font-mono text-xs mb-1">{conflict.importedRule.command}</div>
                        <div className="text-muted-foreground">
                          {conflict.importedRule.replacementText.slice(0, 100)}
                          {conflict.importedRule.replacementText.length > 100 ? '...' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-medium">Existing:</div>
                      <div className="bg-gray-50 dark:bg-gray-950/30 p-3 rounded border">
                        <div className="font-mono text-xs mb-1">{conflict.existingRule.command}</div>
                        <div className="text-muted-foreground">
                          {conflict.existingRule.replacementText.slice(0, 100)}
                          {conflict.existingRule.replacementText.length > 100 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Resolution:</Label>
                    
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`resolution-${conflict.importedRule.id}`}
                          checked={resolution?.action === 'skip'}
                          onChange={() => updateResolution(conflict.importedRule.id, { action: 'skip' })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Skip - Don't import this shortcut</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`resolution-${conflict.importedRule.id}`}
                          checked={resolution?.action === 'overwrite'}
                          onChange={() => updateResolution(conflict.importedRule.id, { action: 'overwrite' })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Overwrite - Replace the existing shortcut</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`resolution-${conflict.importedRule.id}`}
                          checked={resolution?.action === 'rename'}
                          onChange={() => updateResolution(conflict.importedRule.id, { action: 'rename' })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Rename - Import with a different command</span>
                      </label>
                    </div>

                    {isRename && (
                      <div className="ml-6 space-y-2">
                        <Label htmlFor={`rename-${conflict.importedRule.id}`} className="text-sm">
                          New command:
                        </Label>
                        <Input
                          id={`rename-${conflict.importedRule.id}`}
                          value={resolution?.newCommand || ''}
                          onChange={(e) => updateResolution(conflict.importedRule.id, { 
                            newCommand: e.target.value 
                          })}
                          placeholder="Enter new command..."
                          className="font-mono"
                        />
                        
                        {conflict.suggestedAlternatives.length > 0 && (
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Suggestions:</div>
                            <div className="flex flex-wrap gap-1">
                              {conflict.suggestedAlternatives.slice(0, 3).map(suggestion => (
                                <Badge
                                  key={suggestion}
                                  variant="secondary"
                                  className="cursor-pointer text-xs font-mono"
                                  onClick={() => updateResolution(conflict.importedRule.id, { 
                                    newCommand: suggestion 
                                  })}
                                >
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel Import
          </Button>
          <Button onClick={handleResolve} disabled={!canResolve}>
            Import with Resolutions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}