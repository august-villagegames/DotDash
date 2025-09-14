import type { ExpansionRule } from "@/types/expansion-rule";
import { exists, readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/plugin-fs";

export const RULES_VERSION = 1;
const STORAGE_KEY = `dotdash.rules.v${RULES_VERSION}`;
const RULES_PATH = "dotdash.rules.json";

export interface RulesFile {
  version: number;
  rules: ExpansionRule[];
}

export function loadRulesFromStorage(): ExpansionRule[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: RulesFile = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    if (parsed.version !== RULES_VERSION) return null;
    if (!Array.isArray(parsed.rules)) return null;
    return parsed.rules;
  } catch {
    return null;
  }
}

export function saveRulesToStorage(rules: ExpansionRule[]): void {
  const payload: RulesFile = { version: RULES_VERSION, rules };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export async function loadRulesFromDisk(): Promise<ExpansionRule[] | null> {
  try {
    const present = await exists(RULES_PATH, { baseDir: BaseDirectory.AppData });
    if (!present) return null;
    const text = await readTextFile(RULES_PATH, { baseDir: BaseDirectory.AppData });
    const parsed: RulesFile = JSON.parse(text);
    if (parsed.version !== RULES_VERSION || !Array.isArray(parsed.rules)) return null;
    return parsed.rules;
  } catch {
    return null;
  }
}

export async function saveRulesToDisk(rules: ExpansionRule[]): Promise<void> {
  const payload: RulesFile = { version: RULES_VERSION, rules };
  await writeTextFile(RULES_PATH, JSON.stringify(payload, null, 2), { baseDir: BaseDirectory.AppData });
}

export function serializeRules(rules: ExpansionRule[]): string {
  const payload: RulesFile = { version: RULES_VERSION, rules };
  return JSON.stringify(payload, null, 2);
}

export interface ImportResult {
  rules: ExpansionRule[];
  hasConflicts: boolean;
}

export function parseRulesFile(text: string): ExpansionRule[] | null {
  try {
    const parsed: RulesFile = JSON.parse(text);
    if (!parsed || parsed.version !== RULES_VERSION || !Array.isArray(parsed.rules)) return null;
    return parsed.rules;
  } catch {
    return null;
  }
}

export function parseRulesFileWithConflicts(text: string, existingRules: ExpansionRule[]): ImportResult | null {
  try {
    const parsed: RulesFile = JSON.parse(text);
    if (!parsed || parsed.version !== RULES_VERSION || !Array.isArray(parsed.rules)) return null;
    
    // Check for conflicts
    const existingCommandsSet = new Set(existingRules.map(r => r.command.toLowerCase()));
    const hasConflicts = parsed.rules.some(rule => 
      existingCommandsSet.has(rule.command.toLowerCase())
    );

    return {
      rules: parsed.rules,
      hasConflicts
    };
  } catch {
    return null;
  }
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


