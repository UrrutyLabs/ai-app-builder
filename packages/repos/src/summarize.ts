import type { FileTree } from "@repo/domain/schemas";

const ROOT_MARKERS = new Set([
  "package.json",
  "tsconfig.json",
  "turbo.json",
  "pnpm-workspace.yaml",
  "lerna.json",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "Gemfile",
  "composer.json",
  "Dockerfile",
  "docker-compose.yml",
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
  "vite.config.ts",
  "vite.config.js",
  "README.md",
]);

const DIR_MARKERS = new Set([
  "package.json",
  "tsconfig.json",
  "Cargo.toml",
  "go.mod",
  "pyproject.toml",
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
  "vite.config.ts",
  "vite.config.js",
]);

interface DirStat {
  fileCount: number;
  markers: Set<string>;
}

export function summarizeTree(tree: FileTree): string {
  const dirs = new Map<string, DirStat>();
  const rootFiles = new Set<string>();
  const extCounts = new Map<string, number>();

  for (const entry of tree.entries) {
    if (entry.type !== "file") continue;

    const parts = entry.path.split("/");
    const basename = parts[parts.length - 1] ?? "";

    if (parts.length === 1 && ROOT_MARKERS.has(basename)) {
      rootFiles.add(basename);
    }

    for (const depth of [1, 2] as const) {
      if (parts.length <= depth) continue;
      const dir = parts.slice(0, depth).join("/");
      const stat = dirs.get(dir) ?? {
        fileCount: 0,
        markers: new Set<string>(),
      };
      stat.fileCount++;
      if (parts.length === depth + 1 && DIR_MARKERS.has(basename)) {
        stat.markers.add(basename);
      }
      if (basename === "schema.prisma") {
        const relPath = parts.slice(depth).join("/");
        stat.markers.add(relPath);
      }
      dirs.set(dir, stat);
    }

    const dotIdx = basename.lastIndexOf(".");
    const ext = dotIdx > 0 ? basename.slice(dotIdx) : "(none)";
    extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
  }

  const lines: string[] = ["Repo structure:"];
  const sortedDirs = [...dirs.keys()].sort();
  for (const dir of sortedDirs) {
    const stat = dirs.get(dir);
    if (!stat) continue;
    const indent = "  ".repeat(dir.split("/").length - 1);
    const markers =
      stat.markers.size > 0
        ? ` (incl. ${[...stat.markers].sort().join(", ")})`
        : "";
    lines.push(`${indent}- ${dir}/ — ${stat.fileCount} files${markers}`);
  }

  if (rootFiles.size > 0) {
    lines.push(`- Top-level: ${[...rootFiles].sort().join(", ")}`);
  }

  const totalFiles = tree.entries.filter((e) => e.type === "file").length;
  const topExts = [...extCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ext, count]) => `${ext} (${count})`)
    .join(", ");

  lines.push("");
  lines.push(
    `Total: ${totalFiles} source files. Top extensions: ${topExts || "(none)"}.`,
  );
  if (tree.truncated) {
    lines.push(
      "Note: tree was truncated (repo exceeds 5000 indexed entries — only a subset is shown).",
    );
  }

  return lines.join("\n");
}
