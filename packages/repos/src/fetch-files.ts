import { createOctokit, type GitHubRepoRef } from "./github";

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
