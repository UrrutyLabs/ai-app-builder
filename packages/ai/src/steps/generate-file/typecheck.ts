import ts from "typescript";

const TYPECHECKABLE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);

/** Diagnostics about external module resolution — expected since we have no node_modules. */
const IGNORED_DIAGNOSTIC_CODES = new Set([
  2307, // Cannot find module 'X' or its corresponding type declarations
  2305, // Module 'X' has no exported member 'Y'
  2306, // File 'X' is not a module
  2792, // Cannot find module 'X'. Did you mean to set the 'moduleResolution' option to 'node'?
  2691, // An import path cannot end with a '.ts' extension
  6053, // File 'X' not found
]);

/** Ambient declarations for common Node + meta globals so we don't get false
 *  positives like "Cannot find name 'process'". We don't have @types/node and
 *  can't fetch it; this stub covers ~80% of real-world cases. */
const NODE_GLOBALS_DTS = `
declare const process: {
  env: { [key: string]: string | undefined };
  cwd(): string;
  argv: string[];
  platform: string;
  exit(code?: number): never;
};
declare class Buffer {
  static from(input: string | ArrayBuffer | Uint8Array, encoding?: string): Buffer;
  static isBuffer(b: unknown): boolean;
  toString(encoding?: string): string;
}
declare const __dirname: string;
declare const __filename: string;
declare const global: typeof globalThis;
declare const require: (id: string) => unknown;
declare const module: { exports: unknown };
declare const exports: unknown;
declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}
`;

export interface TypecheckResult {
  ok: boolean;
  errors: string[];
}

interface VirtualFile {
  path: string;
  content: string;
}

function normalizePath(p: string): string {
  return p.startsWith("/") ? p : `/${p}`;
}

export function typecheck(
  path: string,
  content: string,
  previousFiles: VirtualFile[] = [],
): TypecheckResult {
  const dot = path.lastIndexOf(".");
  const ext = dot >= 0 ? path.slice(dot).toLowerCase() : "";
  if (!TYPECHECKABLE_EXTENSIONS.has(ext)) {
    return { ok: true, errors: [] };
  }

  // Normalize all paths to absolute under a virtual root so module resolution
  // inside the batch works (`./foo` from /src/main.ts resolves to /src/foo.ts).
  const rootedPath = normalizePath(path);
  const globalsPath = "/__node_globals.d.ts";
  const files = new Map<string, string>();
  files.set(rootedPath, content);
  files.set(globalsPath, NODE_GLOBALS_DTS);
  for (const pf of previousFiles) files.set(normalizePath(pf.path), pf.content);

  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.Preserve,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    allowJs: true,
    esModuleInterop: true,
    isolatedModules: true,
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    types: [],
  };

  const host = createVirtualHost(files, compilerOptions);
  // Include every virtual file as a root so cross-file imports inside the
  // batch get picked up even if Bundler resolution doesn't follow them
  // through our virtual host.
  const allRoots = Array.from(files.keys());
  const program = ts.createProgram(allRoots, compilerOptions, host);
  const allDiagnostics = ts.getPreEmitDiagnostics(program);

  // Only surface diagnostics that originated in the file we're checking —
  // not in `previousFiles` (those were already verified in their own pass).
  const diagnostics = allDiagnostics.filter(
    (d) => d.file === undefined || d.file.fileName === rootedPath,
  );

  const filtered = diagnostics.filter((d) => {
    if (d.code !== undefined && IGNORED_DIAGNOSTIC_CODES.has(d.code)) return false;
    return true;
  });

  return {
    ok: filtered.length === 0,
    errors: filtered.map((d) => formatDiagnostic(d)),
  };
}

function createVirtualHost(
  files: Map<string, string>,
  options: ts.CompilerOptions,
): ts.CompilerHost {
  const realHost = ts.createCompilerHost(options, true);
  const sourceFileCache = new Map<string, ts.SourceFile>();

  const host: ts.CompilerHost = {
    fileExists: (filePath: string): boolean => {
      if (files.has(filePath)) return true;
      return realHost.fileExists(filePath);
    },
    getSourceFile: (
      filePath: string,
      languageVersion: ts.ScriptTarget | ts.CreateSourceFileOptions,
      onError?: (msg: string) => void,
    ): ts.SourceFile | undefined => {
      const virtualContent = files.get(filePath);
      if (virtualContent !== undefined) {
        const cached = sourceFileCache.get(filePath);
        if (cached) return cached;
        const langVersion =
          typeof languageVersion === "object"
            ? languageVersion.languageVersion
            : languageVersion;
        const sf = ts.createSourceFile(
          filePath,
          virtualContent,
          langVersion,
          true,
        );
        sourceFileCache.set(filePath, sf);
        return sf;
      }
      return realHost.getSourceFile(filePath, languageVersion, onError);
    },
    readFile: (filePath: string): string | undefined => {
      const virtualContent = files.get(filePath);
      if (virtualContent !== undefined) return virtualContent;
      return realHost.readFile(filePath);
    },
    writeFile: () => {
      // noop — noEmit
    },
    getDefaultLibFileName: (opts) => realHost.getDefaultLibFileName(opts),
    getCurrentDirectory: () => "/",
    getCanonicalFileName: (f: string) => f,
    getNewLine: () => "\n",
    useCaseSensitiveFileNames: () => true,
  };

  // Optional methods — only attach when realHost provides them, to satisfy
  // exactOptionalPropertyTypes (must be a function or absent, not undefined).
  const realDirectoryExists = realHost.directoryExists;
  if (realDirectoryExists) {
    host.directoryExists = (dir) => realDirectoryExists.call(realHost, dir);
  }
  const realGetDirectories = realHost.getDirectories;
  if (realGetDirectories) {
    host.getDirectories = (dir) => realGetDirectories.call(realHost, dir);
  }

  return host;
}

function formatDiagnostic(d: ts.Diagnostic): string {
  const messageText = ts.flattenDiagnosticMessageText(d.messageText, "\n");
  if (d.file && d.start !== undefined) {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    return `${d.file.fileName}(${line + 1},${character + 1}): TS${d.code} ${messageText}`;
  }
  return `TS${d.code}: ${messageText}`;
}
