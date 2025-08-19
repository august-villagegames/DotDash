import { useState, useEffect } from "react";
import "./App.css";
import { AppShell } from "@/components/AppShell";
import ShortcutsView from "@/views/ShortcutsView";
import DiagnosticsView from "@/views/DiagnosticsView";
import SettingsView from "@/views/SettingsView";
import { ShortcutsProvider } from "@/state/shortcuts-store";
import { TrayStateProvider } from "@/state/tray-store";
import { PauseToggleProvider } from "@/state/pause-toggle-store";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import OnboardingView from "@/views/OnboardingView";

function App() {
  const [view, setView] = useState<"onboarding" | "shortcuts" | "diagnostics" | "settings">("onboarding");

  // Listen for navigation events from tray
  useEffect(() => {
    const setupNavigationListeners = async () => {
      try {
        const unlisten = await listen('navigate-to-diagnostics', () => {
          setView('diagnostics');
        });

        return unlisten;
      } catch (error) {
        console.error('Failed to setup navigation listeners:', error);
      }
    };

    setupNavigationListeners();
  }, []);

  return (
    <TrayStateProvider>
      <PauseToggleProvider>
        <ShortcutsProvider>
          {view === "onboarding" ? (
            <OnboardingView onContinue={async () => {
              try {
                // Start engine and send initial rules (basic MVP: from local storage provider)
                const rules = JSON.parse(localStorage.getItem("shortcuts_rules") || "null");
                const payload = Array.isArray(rules) && rules.length > 0
                  ? rules.map((r: any) => ({ command: r.command, replacementText: r.replacementText }))
                  : [{ command: ".test", replacementText: "TESTED" }];
                await invoke("set_rules", { rules: payload });
                await invoke("set_engine_options", { verbose: true, dryRun: false });
                await invoke("start_engine", { verbose: true });
              } catch (e) {
                // swallow; also shown in diagnostics log via backend log
              }
              setView("shortcuts");
            }} />
          ) : (
            <AppShell current={view} onNavigate={(v) => setView(v)}>
              {view === "shortcuts" && <ShortcutsView />}
              {view === "diagnostics" && <DiagnosticsView />}
              {view === "settings" && <SettingsView />}
            </AppShell>
          )}
        </ShortcutsProvider>
      </PauseToggleProvider>
    </TrayStateProvider>
  );
}

export default App;
