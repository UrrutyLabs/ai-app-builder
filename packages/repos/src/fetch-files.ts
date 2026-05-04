import { createOctokit, type GitHubRepoRef } from "./github";

export interface FileWithSha {
  content: string;
  sha: string;
}

/**
 * Fetch the contents of the given paths from a repo. Returns a map keyed by
 * path. Files that don't exist or fail to fetch resolve to `null` (we don't
 * fail the whole batch on one missing config file).
 */
export async function fetchFileContents({
  ref,
  token,
  paths,
}: {
  ref: GitHubRepoRef;
  token: string;
  paths: string[];
}): Promise<Map<string, string | null>> {
  const oct = createOctokit(token);
  const result = new Map<string, string | null>();

  await Promise.all(
    paths.map(async (path) => {
      try {
        const { data } = await oct.repos.getContent({
          owner: ref.owner,
          repo: ref.repo,
          path,
        });
        if (Array.isArray(data) || data.type !== "file") {
          result.set(path, null);
          return;
        }
        const content = Buffer.from(
          data.content,
          data.encoding as BufferEncoding,
        ).toString("utf8");
        result.set(path, content);
      } catch {
        result.set(path, null);
      }
    }),
  );

  return result;
}

/**
 * Fetch one file's content + SHA. The SHA is required by GitHub's
 * createOrUpdateFileContents API when updating an existing file. Returns null
 * if the path doesn't exist, isn't a file, or fetching fails.
 */
export async function fetchFileWithSha({
  ref,
  token,
  path,
}: {
  ref: GitHubRepoRef;
  token: string;
  path: string;
}): Promise<FileWithSha | null> {
  const oct = createOctokit(token);
  try {
    const { data } = await oct.repos.getContent({
      owner: ref.owner,
      repo: ref.repo,
      path,
    });
    if (Array.isArray(data) || data.type !== "file") return null;
    const content = Buffer.from(
      data.content,
      data.encoding as BufferEncoding,
    ).toString("utf8");
    return { content, sha: data.sha };
  } catch {
    return null;
  }
}
