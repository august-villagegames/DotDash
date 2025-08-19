import { ExpansionRule } from "@/types/expansion-rule";

export interface ValidationError { field: "command" | "replacementText"; message: string }

const RESERVED = new Set([".help", ".settings", ".about", ".quit", ".exit", ".version", ".info"]);

export function validateRule(rule: Pick<ExpansionRule, "command" | "replacementText">, existing: ExpansionRule[], selfId?: string): ValidationError[] {
  const errors: ValidationError[] = [];

  const { command, replacementText } = rule;

  // command rules
  if (!command.startsWith(".")) {
    errors.push({ field: "command", message: "Must start with a period (.)" });
  }
  if (command.length <= 4) {
    errors.push({ field: "command", message: "Must be longer than 4 characters" });
  }
  if (!/^\.[A-Za-z0-9_]+$/.test(command)) {
    errors.push({ field: "command", message: "Only letters, numbers, and underscores after the period" });
  }
  if (command.length > 50) {
    errors.push({ field: "command", message: "Maximum length is 50 characters" });
  }
  if (/__/.test(command)) {
    errors.push({ field: "command", message: "No consecutive underscores" });
  }
  if (/^\._|_$/.test(command)) {
    errors.push({ field: "command", message: "No leading or trailing underscore after the period" });
  }
  if (RESERVED.has(command.toLowerCase())) {
    errors.push({ field: "command", message: "This command is reserved" });
  }
  const lower = command.toLowerCase();
  const duplicate = existing.find(r => r.id !== selfId && r.command.toLowerCase() === lower);
  if (duplicate) {
    errors.push({ field: "command", message: "Must be unique" });
  }

  // replacementText
  if (!replacementText || replacementText.length === 0) {
    errors.push({ field: "replacementText", message: "Replacement text cannot be empty" });
  }
  if (replacementText.length > 10_000) {
    errors.push({ field: "replacementText", message: "Maximum length is 10,000 characters" });
  }
  if (replacementText.split("\n").length > 100) {
    errors.push({ field: "replacementText", message: "Maximum 100 lines" });
  }

  return errors;
}


