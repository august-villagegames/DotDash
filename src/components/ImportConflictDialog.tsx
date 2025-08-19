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
      <DialogContent >
        <DialogHeader>
          <DialogTitle>Resolve Import Conflicts</DialogTitle>
          <DialogDescription>
            {conflicts.length} shortcut{conflicts.length === 1 ? '' : 's'} in the import file 
            conflict{conflicts.length === 1 ? 's' : ''} with existing shortcuts. 
            Choose how to handle each conflict.
          </DialogDescription>
        </DialogHeader>

        <div >
          {conflicts.map((conflict, index) => {
            const resolution = resolutions.get(conflict.importedRule.id);
            const isRename = resolution?.action === 'rename';

            return (
              <div key={conflict.importedRule.id} >
                {index > 0 && <Separator />}
                
                <div >
                  <div >
                    <Badge variant="outline" >
                      {conflict.importedRule.command}
                    </Badge>
                    <span >
                      conflicts with existing shortcut
                    </span>
                  </div>

                  <div >
                    <div >
                      <div >Importing:</div>
                      <div >
                        <div >{conflict.importedRule.command}</div>
                        <div >
                          {conflict.importedRule.replacementText.slice(0, 100)}
                          {conflict.importedRule.replacementText.length > 100 ? '...' : ''}
                        </div>
                      </div>
                    </div>

                    <div >
                      <div >Existing:</div>
                      <div >
                        <div >{conflict.existingRule.command}</div>
                        <div >
                          {conflict.existingRule.replacementText.slice(0, 100)}
                          {conflict.existingRule.replacementText.length > 100 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div >
                    <Label >Resolution:</Label>
                    
                    <div >
                      <label >
                        <input
                          type="radio"
                          name={`resolution-${conflict.importedRule.id}`}
                          checked={resolution?.action === 'skip'}
                          onChange={() => updateResolution(conflict.importedRule.id, { action: 'skip' })}
                          
                        />
                        <span >Skip - Don't import this shortcut</span>
                      </label>

                      <label >
                        <input
                          type="radio"
                          name={`resolution-${conflict.importedRule.id}`}
                          checked={resolution?.action === 'overwrite'}
                          onChange={() => updateResolution(conflict.importedRule.id, { action: 'overwrite' })}
                          
                        />
                        <span >Overwrite - Replace the existing shortcut</span>
                      </label>

                      <label >
                        <input
                          type="radio"
                          name={`resolution-${conflict.importedRule.id}`}
                          checked={resolution?.action === 'rename'}
                          onChange={() => updateResolution(conflict.importedRule.id, { action: 'rename' })}
                          
                        />
                        <span >Rename - Import with a different command</span>
                      </label>
                    </div>

                    {isRename && (
                      <div >
                        <Label htmlFor={`rename-${conflict.importedRule.id}`} >
                          New command:
                        </Label>
                        <Input
                          id={`rename-${conflict.importedRule.id}`}
                          value={resolution?.newCommand || ''}
                          onChange={(e) => updateResolution(conflict.importedRule.id, { 
                            newCommand: e.target.value 
                          })}
                          placeholder="Enter new command..."
                          
                        />
                        
                        {conflict.suggestedAlternatives.length > 0 && (
                          <div >
                            <div >Suggestions:</div>
                            <div >
                              {conflict.suggestedAlternatives.slice(0, 3).map(suggestion => (
                                <Badge
                                  key={suggestion}
                                  variant="secondary"
                                  
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