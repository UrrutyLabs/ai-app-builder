import { parse } from "@babel/parser";

const PARSEABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

export interface VerifyResult {
  ok: boolean;
  error: string | null;
}

/**
 * Best-effort syntax check for the generated file. Only JS/TS family files
 * are checked — for other extensions we skip and return ok. The check is a
 * pure parse (no type checking, no module resolution), so it's fast and
 * doesn't need the surrounding repo.
 */
export function verifySyntax(path: string, content: string): VerifyResult {
  const dot = path.lastIndexOf(".");
  const ext = dot >= 0 ? path.slice(dot).toLowerCase() : "";
  if (!PARSEABLE_EXTENSIONS.has(ext)) {
    return { ok: true, error: null };
  }
  try {
    parse(content, {
      sourceType: "module",
      allowImportExportEverywhere: false,
      errorRecovery: false,
      plugins: ["typescript", "jsx", "decorators-legacy", "explicitResourceManagement"],
    });
    return { ok: true, error: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
