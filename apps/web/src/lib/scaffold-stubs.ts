import type {
  FeatureSpec,
  FileChange,
  ImplementationPlan,
} from "@repo/domain/schemas";
import type { FeatureRecord } from "@repo/db";

type CommentStyle =
  | "line-slash"
  | "line-hash"
  | "line-dash"
  | "block-c"
  | "block-html";

function styleForPath(p: string): CommentStyle {
  const dot = p.lastIndexOf(".");
  const ext = dot >= 0 ? p.slice(dot).toLowerCase() : "";
  switch (ext) {
    case ".ts":
    case ".tsx":
    case ".js":
    case ".jsx":
    case ".mjs":
    case ".cjs":
    case ".go":
    case ".rs":
    case ".java":
    case ".kt":
    case ".swift":
    case ".scala":
    case ".c":
    case ".cc":
    case ".cpp":
    case ".h":
    case ".hpp":
    case ".cs":
    case ".php":
      return "line-slash";
    case ".py":
    case ".rb":
    case ".sh":
    case ".yaml":
    case ".yml":
    case ".toml":
    case ".dockerfile":
      return "line-hash";
    case ".sql":
    case ".prisma":
      return "line-dash";
    case ".css":
    case ".scss":
      return "block-c";
    case ".md":
    case ".mdx":
    case ".html":
    case ".svg":
    case ".vue":
    case ".svelte":
      return "block-html";
    default:
      return "line-slash";
  }
}

function renderHeader(style: CommentStyle, lines: string[]): string {
  if (style === "block-c") {
    return `/*\n${lines.map((l) => ` * ${l}`).join("\n")}\n */\n`;
  }
  if (style === "block-html") {
    return `<!--\n${lines.join("\n")}\n-->\n`;
  }
  const prefix =
    style === "line-slash" ? "//" : style === "line-hash" ? "#" : "--";
  return lines.map((l) => `${prefix} ${l}`).join("\n") + "\n";
}

function isSafePath(p: string): boolean {
  if (!p || p.length > 250) return false;
  if (p.startsWith("/") || p.includes("..") || p.includes("\0")) return false;
  return true;
}

function stubContent(
  fc: FileChange,
  feature: FeatureRecord,
  spec: FeatureSpec,
  planFile: string,
): string {
  const style = styleForPath(fc.path);
  return renderHeader(style, [
    `${spec.title}`,
    `${fc.summary}`,
    `See ${planFile} for the full implementation plan.`,
    `TODO: implement (feature: ${feature.id}).`,
  ]);
}

export interface ScaffoldInput {
  feature: FeatureRecord;
  spec: FeatureSpec;
  plan: ImplementationPlan;
  existingPaths: Set<string>;
  planFile: string;
}

/**
 * Build stub files for `create` actions in the plan whose paths don't yet
 * exist in the connected repo. `modify`/`delete` actions are intentionally
 * skipped — those need real code, not a stub. Existing paths are skipped to
 * avoid overwriting real code in the PR.
 */
export function buildStubFiles(
  input: ScaffoldInput,
): Array<{ path: string; content: string }> {
  return input.plan.fileChanges
    .filter((fc) => fc.action === "create")
    .filter((fc) => isSafePath(fc.path))
    .filter((fc) => !input.existingPaths.has(fc.path))
    .map((fc) => ({
      path: fc.path,
      content: stubContent(fc, input.feature, input.spec, input.planFile),
    }));
}

/**
 * Count the number of files that would be scaffolded for a given plan +
 * existing repo state. UI uses this to decide whether to show the checkbox.
 */
export function countScaffoldable(
  plan: ImplementationPlan,
  existingPaths: Set<string>,
): number {
  return plan.fileChanges.filter(
    (fc) =>
      fc.action === "create" && isSafePath(fc.path) && !existingPaths.has(fc.path),
  ).length;
}

/**
 * Count files that AI generation can touch in this PR: new paths from
 * `create` actions plus existing paths from `modify` actions.
 */
export function countGeneratable(
  plan: ImplementationPlan,
  existingPaths: Set<string>,
): { creatable: number; modifiable: number; total: number } {
  let creatable = 0;
  let modifiable = 0;
  for (const fc of plan.fileChanges) {
    if (!isSafePath(fc.path)) continue;
    if (fc.action === "create" && !existingPaths.has(fc.path)) creatable++;
    else if (fc.action === "modify" && existingPaths.has(fc.path)) modifiable++;
  }
  return { creatable, modifiable, total: creatable + modifiable };
}
