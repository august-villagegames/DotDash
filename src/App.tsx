import { useState, useEffect } from "react";
import "./App.css";
import { AppShell } from "@/components/AppShell";
import ShortcutsView from "@/views/ShortcutsView";
import DiagnosticsView from "@/views/DiagnosticsView";

import { ShortcutsProvider } from "@/state/shortcuts-store";
import { TrayStateProvider } from "@/state/tray-store";
import { PauseToggleProvider } from "@/state/pause-toggle-store";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { mockInvoke, mockListen, shouldUseMocks } from "@/lib/dev-mocks";
import OnboardingView from "@/views/OnboardingView";

function App() {
  // Dev mode: skip onboarding and go straight to shortcuts view for styling work
  const isDev = import.meta.env.DEV && import.meta.env.VITE_SKIP_ONBOARDING === 'true';
  const [view, setView] = useState<"onboarding" | "shortcuts" | "diagnostics">(
    isDev ? "shortcuts" : "onboarding"
  );

  // Listen for navigation events from tray (use mocks in dev mode)
  useEffect(() => {
    const setupNavigationListeners = async () => {
      try {
        const listenFn = shouldUseMocks() ? mockListen : listen;
        const unlisten = await listenFn('navigate-to-diagnostics', () => {
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
                
                const invokeFn = shouldUseMocks() ? mockInvoke : invoke;
                await invokeFn("set_rules", { rules: payload });
                await invokeFn("set_engine_options", { verbose: true, dryRun: false });
                await invokeFn("start_engine", { verbose: true });
              } catch (e) {
                // swallow; also shown in diagnostics log via backend log
              }
              setView("shortcuts");
            }} />
          ) : (
            <AppShell current={view} onNavigate={(v) => setView(v)}>
              {view === "shortcuts" && <ShortcutsView />}
              {view === "diagnostics" && <DiagnosticsView />}
            </AppShell>
          )}
        </ShortcutsProvider>
      </PauseToggleProvider>
    </TrayStateProvider>
  );
}

export default App;
