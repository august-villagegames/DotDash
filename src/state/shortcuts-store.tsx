import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ExpansionRule } from "@/types/expansion-rule";
import { loadRulesFromStorage, saveRulesToStorage, loadRulesFromDisk, saveRulesToDisk } from "@/lib/storage";

interface ShortcutsContextValue {
  rules: ExpansionRule[];
  upsertRule: (rule: Omit<ExpansionRule, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
  deleteRule: (id: string) => void;
  replaceAllRules: (rules: ExpansionRule[]) => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

function generateId() {
  return crypto.randomUUID();
}

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<ExpansionRule[]>(() => {
    return (
      loadRulesFromStorage() ?? [
        {
          id: generateId(),
          command: ".sig",
          replacementText: "Best,\nYour Name",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    );
  });

  useEffect(() => {
    // Attempt disk load once at startup in desktop; ignore if unavailable (web dev)
    (async () => {
      const disk = await loadRulesFromDisk();
      if (disk) setRules(disk);
    })();
  }, []);

  useEffect(() => {
    saveRulesToStorage(rules);
    // Also try to persist to disk when available
    (async () => {
      try { await saveRulesToDisk(rules); } catch {}
    })();
    // Mirror to localStorage for backend bootstrap
    try { localStorage.setItem("shortcuts_rules", JSON.stringify(rules)); } catch {}
  }, [rules]);

  const value = useMemo<ShortcutsContextValue>(() => ({
    rules,
    upsertRule: (rule) => {
      setRules((prev) => {
        if (rule.id) {
          return prev.map(r => r.id === rule.id ? { ...r, ...rule, updatedAt: new Date().toISOString() } as ExpansionRule : r);
        }
        const now = new Date().toISOString();
        return prev.concat({ id: generateId(), createdAt: now, updatedAt: now, command: rule.command, replacementText: rule.replacementText });
      });
    },
    deleteRule: (id) => setRules(prev => prev.filter(r => r.id !== id)),
    replaceAllRules: (all) => setRules(all),
  }), [rules]);

  return <ShortcutsContext.Provider value={value}>{children}</ShortcutsContext.Provider>;
}

export function useShortcuts() {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) throw new Error("useShortcuts must be used within ShortcutsProvider");
  return ctx;
}


