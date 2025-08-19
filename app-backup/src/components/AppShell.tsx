import { Separator } from "@/components/ui/separator";
import { PauseTitleIndicator } from "@/components/PauseStatusIndicator";

type ViewKey = "shortcuts" | "diagnostics" | "settings";

export function AppShell({ children, onNavigate, current }: { children: React.ReactNode; onNavigate: (v: ViewKey) => void; current: ViewKey }) {
  return (
    <div className="h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r p-4">
        <div className="flex items-center gap-2">
          <div className="text-lg font-semibold">DotDashDash</div>
          <PauseTitleIndicator />
        </div>
        <Separator className="my-4" />
        <nav className="space-y-1">
          <NavItem label="Shortcuts" active={current === "shortcuts"} onClick={() => onNavigate("shortcuts")} />
          <NavItem label="Diagnostics" active={current === "diagnostics"} onClick={() => onNavigate("diagnostics")} />
          <NavItem label="Settings" active={current === "settings"} onClick={() => onNavigate("settings")} />
        </nav>
      </aside>
      <main className="overflow-auto">{children}</main>
    </div>
  );
}

function NavItem({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      className={`w-full text-left px-2 py-1.5 rounded-md ${active ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}


