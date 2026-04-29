import type { FileTree } from "@repo/domain/schemas";
import { AppError } from "@repo/domain";
import { createOctokit, type GitHubRepoRef } from "./github";

const MAX_ENTRIES = 5000;

const IGNORED_PATH_SEGMENTS = [
  "node_modules",
  "dist",
  ".next",
  "build",
  "out",
  "coverage",
  ".git",
  ".turbo",
  ".vercel",
  ".cache",
  "vendor",
];

const IGNORED_SUFFIXES = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".svg",
  ".ico",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".pdf",
  ".zip",
  ".tar",
  ".tgz",
];

const IGNORED_BASENAMES = new Set([
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  ".DS_Store",
  "Thumbs.db",
]);

function shouldIgnore(path: string): boolean {
  const segments = path.split("/");
  for (const seg of segments) {
    if (IGNORED_PATH_SEGMENTS.includes(seg)) return true;
  }
  for (const suffix of IGNORED_SUFFIXES) {
    if (path.endsWith(suffix)) return true;
  }
  const basename = segments[segments.length - 1] ?? "";
  if (IGNORED_BASENAMES.has(basename)) return true;
  return false;
}

export interface FetchedRepo {
  owner: string;
  repo: string;
  defaultBranch: string;
  tree: FileTree;
}

export async function fetchRepoTree({
  ref,
  token,
}: {
  ref: GitHubRepoRef;
  token: string;
}): Promise<FetchedRepo> {
  const oct = createOctokit(token);

  let defaultBranch: string;
  try {
    const { data } = await oct.repos.get({ owner: ref.owner, repo: ref.repo });
    defaultBranch = data.default_branch;
  } catch (err) {
    throw new AppError(
      "GITHUB",
      `Failed to access repo ${ref.owner}/${ref.repo} (check the URL and that your PAT has 'repo' or 'public_repo' scope)`,
      err,
    );
  }

  let rawTree: { tree: Array<{ path?: string; type?: string; size?: number }>; truncated: boolean };
  try {
    const { data } = await oct.git.getTree({
      owner: ref.owner,
      repo: ref.repo,
      tree_sha: defaultBranch,
      recursive: "true",
    });
    rawTree = data;
  } catch (err) {
    throw new AppError(
      "GITHUB",
      `Failed to fetch tree for ${ref.owner}/${ref.repo}@${defaultBranch}`,
      err,
    );
  }

  const filtered = rawTree.tree.filter(
    (e) =>
      typeof e.path === "string" &&
      (e.type === "blob" || e.type === "tree") &&
      !shouldIgnore(e.path),
  );

  const truncated = rawTree.truncated || filtered.length > MAX_ENTRIES;
  const entries = filtered.slice(0, MAX_ENTRIES).map((e) => {
    const path = e.path as string;
    const type = (e.type === "tree" ? "dir" : "file") as "file" | "dir";
    return e.size !== undefined ? { path, type, size: e.size } : { path, type };
  });

  return {
    owner: ref.owner,
    repo: ref.repo,
    defaultBranch,
    tree: { truncated, entries },
  };
}
