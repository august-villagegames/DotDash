import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { invoke } from "@tauri-apps/api/core";

export default function OnboardingView({ onContinue }: { onContinue: () => void }) {
  const [trusted, setTrusted] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  async function refresh() {
    try {
      const ok = await invoke<boolean>("check_accessibility");
      setTrusted(ok);
      const lines = await invoke<string[]>("get_logs");
      setLogs(lines);
    } catch (e) {
      setLogs((prev) => prev.concat(`error: ${String(e)}`));
    }
  }

  useEffect(() => {
    void refresh();
    const id = setInterval(() => { void refresh(); }, 1500);
    return () => clearInterval(id);
  }, []);

  async function request() {
    try {
      await invoke<boolean>("prompt_accessibility");
      await refresh();
    } catch (e) {
      setLogs((prev) => prev.concat(`prompt error: ${String(e)}`));
    }
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Permission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            DotDashDash needs Accessibility permission to monitor keystrokes and insert expansions. We do not log or
            store your keystrokes; only user-defined shortcuts are stored locally.
          </p>
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <Badge variant={trusted ? "default" : "secondary"}>{trusted ? "Granted" : "Not granted"}</Badge>
          </div>
          <div className="flex gap-2">
            <Button onClick={request}>Open System Prompt</Button>
            <Button variant="secondary" onClick={refresh}>Refresh</Button>
            {trusted && <Button variant="secondary" onClick={onContinue}>Continue</Button>}
          </div>
          <div className="pt-2">
            <p className="text-xs font-medium">Debug log</p>
            <pre className="mt-1 max-h-48 overflow-auto rounded border bg-muted/30 p-2 text-xs whitespace-pre-wrap">{logs.join("\n")}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


