import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PauseStatusIndicator } from "@/components/PauseStatusIndicator";
import { usePauseToggle } from "@/state/pause-toggle-store";
import { openUrl } from "@tauri-apps/plugin-opener";

export default function DiagnosticsView() {
  const { isPaused, pauseReason } = usePauseToggle();
  
  // Placeholder statuses; wire to real permissions later via Tauri
  const status: { accessibility: string; automation: string } = {
    accessibility: "Unknown",
    automation: "Not requested",
  };

  return (
    <div className="p-6 space-y-4">
      {/* Pause status indicator */}
      <PauseStatusIndicator 
        variant="banner"
        showReason={true}
        showResumeButton={true}
      />

      <Card>
        <CardHeader>
          <CardTitle>Expansion Engine Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Expansion State</span>
            <Badge variant={isPaused ? "secondary" : "default"}>
              {isPaused ? 'Paused' : 'Active'}
            </Badge>
          </div>
          {isPaused && (
            <div className="flex items-center justify-between">
              <span>Pause Reason</span>
              <Badge variant="outline">
                {pauseReason === 'user' ? 'User Requested' : 
                 pauseReason === 'secure-input' ? 'Secure Input' :
                 pauseReason === 'both' ? 'User + Secure Input' : 'Unknown'}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Accessibility</span>
            <Badge variant={status.accessibility === "Granted" ? "default" : "secondary"}>{status.accessibility}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Automation</span>
            <Badge variant="secondary">{status.automation}</Badge>
          </div>
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => { void openUrl("x-apple.systempreferences:com.apple.preference.universalaccess"); }}
            >
              Open System Settings → Accessibility
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


