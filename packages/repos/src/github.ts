import { Octokit } from "@octokit/rest";
import { ValidationError } from "@repo/domain";

export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

export function parseGitHubUrl(url: string): GitHubRepoRef {
  const trimmed = url.trim();
  // Matches: https://github.com/owner/repo[.git][/], git@github.com:owner/repo[.git], github.com/owner/repo
  const re = /(?:^|@|\/\/)github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/;
  const m = re.exec(trimmed);
  if (!m) {
    throw new ValidationError(`Invalid GitHub URL: ${url}`);
  }
  const owner = m[1];
  const repo = m[2];
  if (!owner || !repo) {
    throw new ValidationError(`Invalid GitHub URL: ${url}`);
  }
  return { owner, repo };
}

export function createOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}
