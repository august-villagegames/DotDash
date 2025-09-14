import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShortcuts } from "@/state/shortcuts-store";
import { useTrayState } from "@/state/tray-store";
import { usePauseToggle } from "@/state/pause-toggle-store";
import { PauseToggleButton } from "@/components/PauseToggleButton";
import { PauseStatusIndicator } from "@/components/PauseStatusIndicator";
import { downloadText, parseRulesFile, serializeRules } from "@/lib/storage";
import { detectImportConflicts } from "@/lib/conflict-utils";
import { ImportConflictDialog, type ConflictResolution } from "@/components/ImportConflictDialog";
import type { ExpansionRule } from "@/types/expansion-rule";

export default function SettingsView() {
  const { rules, replaceAllRules } = useShortcuts();
  const { 
    showInDock, 
    startMinimized, 
    expansionEnabled,
    updateTrayPreferences,
    toggleExpansions 
  } = useTrayState();
  const { 
    isPaused, 
    pauseReason, 
    canResume 
  } = usePauseToggle();
  const [importConflicts, setImportConflicts] = useState<any[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [pendingImportRules, setPendingImportRules] = useState<ExpansionRule[]>([]);
  const [importSummary, setImportSummary] = useState<string>("");

  function handleExport() {
    const text = serializeRules(rules);
    downloadText("dotdash-rules.json", text);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const parsed = parseRulesFile(text);
      
      if (!parsed) {
        alert("Invalid rules file or version mismatch.");
        e.currentTarget.value = "";
        return;
      }

      // Check for conflicts
      const conflicts = detectImportConflicts(parsed, rules);
      
      if (conflicts.length > 0) {
        setImportConflicts(conflicts);
        setPendingImportRules(parsed);
        setShowConflictDialog(true);
      } else {
        // No conflicts, import directly
        replaceAllRules([...rules, ...parsed]);
        setImportSummary(`Successfully imported ${parsed.length} shortcuts with no conflicts.`);
        setTimeout(() => setImportSummary(""), 5000);
      }
    } catch (error) {
      alert("Error reading file. Please check the file format.");
    }
    
    e.currentTarget.value = "";
  }

  function handleConflictResolution(resolutions: ConflictResolution[]) {
    let importedCount = 0;
    let skippedCount = 0;
    let overwrittenCount = 0;
    let renamedCount = 0;

    const resolutionMap = new Map(resolutions.map(r => [r.ruleId, r]));
    const conflictMap = new Map(importConflicts.map(c => [c.importedRule.id, c]));
    
    // Start with existing rules
    let updatedRules = [...rules];
    
    // Process each imported rule
    for (const importedRule of pendingImportRules) {
      const resolution = resolutionMap.get(importedRule.id);
      const conflict = conflictMap.get(importedRule.id);
      
      if (conflict && resolution) {
        // This rule has a conflict, handle according to resolution
        switch (resolution.action) {
          case 'skip':
            skippedCount++;
            break;
            
          case 'overwrite':
            // Remove existing rule and add imported one
            updatedRules = updatedRules.filter(r => r.id !== conflict.existingRule.id);
            updatedRules.push(importedRule);
            overwrittenCount++;
            break;
            
          case 'rename':
            if (resolution.newCommand) {
              // Add with new command
              const renamedRule = { ...importedRule, command: resolution.newCommand };
              updatedRules.push(renamedRule);
              renamedCount++;
            } else {
              skippedCount++;
            }
            break;
        }
      } else {
        // No conflict, add directly
        updatedRules.push(importedRule);
        importedCount++;
      }
    }

    // Update the rules
    replaceAllRules(updatedRules);
    
    // Show summary
    const summaryParts = [];
    if (importedCount > 0) summaryParts.push(`${importedCount} imported`);
    if (overwrittenCount > 0) summaryParts.push(`${overwrittenCount} overwritten`);
    if (renamedCount > 0) summaryParts.push(`${renamedCount} renamed`);
    if (skippedCount > 0) summaryParts.push(`${skippedCount} skipped`);
    
    setImportSummary(`Import complete: ${summaryParts.join(', ')}.`);
    setTimeout(() => setImportSummary(""), 5000);
    
    // Clean up
    setShowConflictDialog(false);
    setImportConflicts([]);
    setPendingImportRules([]);
  }

  function handleCancelImport() {
    setShowConflictDialog(false);
    setImportConflicts([]);
    setPendingImportRules([]);
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Expansion Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="pauseToggle">Global Pause Control</Label>
              
              {/* Pause status indicator */}
              {isPaused && (
                <PauseStatusIndicator 
                  variant="banner"
                  showReason={true}
                  showResumeButton={canResume}
                  className="mb-3"
                />
              )}
              
              {/* Main pause toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    Text Expansions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isPaused 
                      ? `Expansions are paused${pauseReason === 'secure-input' ? ' (secure input detected)' : ''}`
                      : 'Expansions are active and ready'
                    }
                  </div>
                </div>
                
                <PauseToggleButton 
                  variant="default"
                  showLabel={true}
                  showStatus={false}
                />
              </div>
              
              <div className="text-xs text-muted-foreground">
                Use the pause toggle to temporarily disable all text expansions. 
                You can also control this from the system tray menu.
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="enableExpansions">Legacy Engine Control</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableExpansions"
                  checked={expansionEnabled}
                  onCheckedChange={toggleExpansions}
                />
                <Label htmlFor="enableExpansions" className="text-sm">
                  {expansionEnabled ? 'Engine is running' : 'Engine is stopped'}
                </Label>
              </div>
              <div className="text-xs text-muted-foreground">
                This controls the underlying expansion engine. Use the pause toggle above for temporary pausing.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Tray</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="showInDock">Show in Dock</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showInDock"
                  checked={showInDock}
                  onCheckedChange={(checked) => updateTrayPreferences({ showInDock: !!checked })}
                />
                <Label htmlFor="showInDock" className="text-sm">
                  Show DotDash icon in the dock
                </Label>
              </div>
              <div className="text-xs text-muted-foreground">
                When disabled, DotDash will only appear in the menu bar.
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startMinimized">Start Minimized</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="startMinimized"
                  checked={startMinimized}
                  onCheckedChange={(checked) => updateTrayPreferences({ startMinimized: !!checked })}
                />
                <Label htmlFor="startMinimized" className="text-sm">
                  Start minimized to system tray
                </Label>
              </div>
              <div className="text-xs text-muted-foreground">
                When enabled, the app will start in the background without showing the main window.
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trayIconStyle">Tray Icon Style</Label>
              <Select
                defaultValue="auto"
                onValueChange={(value) => updateTrayPreferences({ 
                  trayIconStyle: value as 'auto' | 'light' | 'dark' 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tray icon style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Follow system theme)</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                Choose how the tray icon appears in the menu bar.
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="showNotifications">Show Notifications</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showNotifications"
                  defaultChecked={true}
                  onCheckedChange={(checked) => updateTrayPreferences({ showNotifications: !!checked })}
                />
                <Label htmlFor="showNotifications" className="text-sm">
                  Show notifications for tray interactions
                </Label>
              </div>
              <div className="text-xs text-muted-foreground">
                Display brief notifications when toggling expansions from the tray.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startAtLogin">Start at login</Label>
              <div className="text-sm text-muted-foreground">Not yet implemented.</div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="import">Import/Export</Label>
              <div className="flex gap-2 items-center">
                <input id="import" type="file" accept="application/json" onChange={handleImport} className="text-sm" />
                <Button variant="secondary" onClick={handleExport}>Export</Button>
              </div>
              {importSummary && (
                <div className="text-sm text-green-600 dark:text-green-400 mt-2">
                  {importSummary}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ImportConflictDialog
        open={showConflictDialog}
        conflicts={importConflicts}
        onResolve={handleConflictResolution}
        onCancel={handleCancelImport}
      />
    </>
  );
}


