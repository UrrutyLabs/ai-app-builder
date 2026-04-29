import type { Conventions } from "@repo/domain/schemas";

/**
 * Render conventions as a prompt-ready block. Returns "" when nothing useful
 * was detected so callers can treat the value as empty/optional.
 */
export function summarizeConventions(c: Conventions): string {
  const lines: string[] = [];

  if (c.framework) lines.push(`- Framework: ${c.framework}`);
  if (c.language) {
    const strict = c.tsStrict ? " (strict mode)" : "";
    lines.push(`- Language: ${c.language}${strict}`);
  }
  if (c.testStack.length > 0) lines.push(`- Tests: ${c.testStack.join(", ")}`);
  if (c.styling.length > 0)
    lines.push(`- Styling: ${c.styling.join(", ")}`);
  if (c.orm) {
    const db = c.database ? ` → ${c.database}` : "";
    lines.push(`- ORM: ${c.orm}${db}`);
  }
  if (c.formLib.length > 0 || c.validation.length > 0) {
    const parts: string[] = [];
    if (c.formLib.length > 0) parts.push(c.formLib.join(", "));
    if (c.validation.length > 0) parts.push(c.validation.join(", "));
    lines.push(`- Forms/validation: ${parts.join(" + ")}`);
  }
  if (c.monorepo) lines.push(`- Monorepo: ${c.monorepo}`);
  if (c.packageManager)
    lines.push(`- Package manager: ${c.packageManager}`);
  for (const note of c.notes) lines.push(`- ${note}`);

  if (lines.length === 0) return "";

  return ["Conventions (existing system):", ...lines].join("\n");
}

/**
 * Compact one-line label of the detected stack for UI badges.
 * Returns "" when nothing was detected.
 */
export function shortStackLabel(c: Conventions): string {
  const parts: string[] = [];
  if (c.framework) parts.push(c.framework);
  if (c.styling[0]) parts.push(c.styling[0]);
  if (c.testStack[0]) parts.push(c.testStack[0]);
  if (c.orm) {
    parts.push(c.database ? `${c.orm} (${c.database})` : c.orm);
  }
  if (c.monorepo) parts.push(c.monorepo);
  return parts.join(" · ");
}
