import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PauseTitleIndicator } from "@/components/PauseStatusIndicator";
import { Logo } from "@/components/Logo";
import { Settings } from "lucide-react";
import SettingsView from "@/views/SettingsView";

type ViewKey = "shortcuts" | "diagnostics";

export function AppShell({ children, onNavigate, current }: { children: React.ReactNode; onNavigate: (v: ViewKey) => void; current: ViewKey }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Header with title and settings */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <PauseTitleIndicator />
        </div>
        
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <SettingsView />
          </DialogContent>
        </Dialog>
      </header>

      {/* Navigation */}
      <nav className="flex border-b">
        <NavItem label="Shortcuts" active={current === "shortcuts"} onClick={() => onNavigate("shortcuts")} />
        <NavItem label="Diagnostics" active={current === "diagnostics"} onClick={() => onNavigate("diagnostics")} />
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

function NavItem({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <Button
      variant="ghost"
      className={`px-4 py-2 text-sm font-medium border-b-2 rounded-none transition-colors ${
        active 
          ? "border-primary text-primary" 
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
      }`}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}


