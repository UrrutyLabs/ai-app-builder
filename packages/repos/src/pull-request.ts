import { AppError } from "@repo/domain";
import { createOctokit, type GitHubRepoRef } from "./github";

export interface PrFile {
  path: string;
  content: string;
  /**
   * If present, treats the file as an update to an existing file at this path
   * on the base branch. GitHub requires the existing blob's SHA to update.
   */
  sha?: string;
}

export interface OpenPullRequestInput {
  ref: GitHubRepoRef;
  token: string;
  baseBranch: string;
  headBranch: string;
  title: string;
  body: string;
  files: PrFile[];
  commitMessage: (file: PrFile) => string;
}

export interface OpenedPullRequest {
  url: string;
  number: number;
}

export async function openPullRequest(
  input: OpenPullRequestInput,
): Promise<OpenedPullRequest> {
  const oct = createOctokit(input.token);
  const { ref } = input;

  let baseSha: string;
  try {
    const { data } = await oct.git.getRef({
      owner: ref.owner,
      repo: ref.repo,
      ref: `heads/${input.baseBranch}`,
    });
    baseSha = data.object.sha;
  } catch (err) {
    throw new AppError(
      "GITHUB",
      `Failed to read base branch ${input.baseBranch}`,
      err,
    );
  }

  try {
    await oct.git.createRef({
      owner: ref.owner,
      repo: ref.repo,
      ref: `refs/heads/${input.headBranch}`,
      sha: baseSha,
    });
  } catch (err) {
    throw new AppError(
      "GITHUB",
      `Failed to create branch ${input.headBranch}`,
      err,
    );
  }

  for (const file of input.files) {
    try {
      await oct.repos.createOrUpdateFileContents({
        owner: ref.owner,
        repo: ref.repo,
        path: file.path,
        message: input.commitMessage(file),
        content: Buffer.from(file.content, "utf8").toString("base64"),
        branch: input.headBranch,
        ...(file.sha ? { sha: file.sha } : {}),
      });
    } catch (err) {
      throw new AppError(
        "GITHUB",
        `Failed to commit ${file.path} on ${input.headBranch}`,
        err,
      );
    }
  }

  try {
    const { data } = await oct.pulls.create({
      owner: ref.owner,
      repo: ref.repo,
      title: input.title,
      body: input.body,
      head: input.headBranch,
      base: input.baseBranch,
    });
    return { url: data.html_url, number: data.number };
  } catch (err) {
    throw new AppError("GITHUB", "Failed to open pull request", err);
  }
}
