import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  FeatureSpecSchema,
  ImplementationPlanSchema,
} from "@repo/domain/schemas";
import { ConflictError, NotFoundError } from "@repo/domain";
import { generateFile } from "@repo/ai";
import {
  fetchFileWithSha,
  openPullRequest,
  renderSnippets,
  summarizeConventions,
  type PrFile,
} from "@repo/repos";
import { decryptToken, embedQuery } from "@repo/repos/server";
import {
  getEncryptedTokenForProject,
  getFeatureById,
  getProjectById,
  getRepoByProjectId,
  searchSimilarFiles,
  setFeaturePr,
  updateProjectPaths,
} from "@repo/db";
import { slugify } from "./feature-export";
import { renderPlanDoc, renderPrBody, renderSpecDoc } from "./pr-render";
import { buildStubFiles } from "./scaffold-stubs";
import type { PrEvent, PrSummary } from "./pr-events";

const TOP_K_PER_FILE = 6;

const InputSchema = z.object({
  featureId: z.string().min(1),
  specPath: z.string().min(1).max(200),
  planPath: z.string().min(1).max(200),
  fileMode: z.enum(["none", "stubs", "generate"]),
});

function normalizeDir(s: string): string {
  return s.trim().replace(/^\/+|\/+$/g, "");
}

export type OnProgress = (event: PrEvent) => void;

/**
 * Core PR-creation logic, refactored so it can be driven by either the route
 * handler (with a streaming `onProgress`) or a synchronous caller (passing
 * a no-op).
 */
export async function runPrCreation(
  raw: unknown,
  onProgress: OnProgress,
): Promise<PrSummary> {
  const input = InputSchema.parse(raw);
  const specDir = normalizeDir(input.specPath);
  const planDir = normalizeDir(input.planPath);
  if (!specDir || !planDir) {
    throw new ConflictError("Spec and plan directories cannot be empty");
  }

  onProgress({ type: "step", label: "Loading feature and repo" });

  const feature = await getFeatureById(input.featureId);
  if (!feature) throw new NotFoundError(`Feature ${input.featureId} not found`);
  if (!feature.spec) {
    throw new ConflictError(
      "Generate (and approve) a feature spec before creating a PR",
    );
  }
  if (!feature.plan) {
    throw new ConflictError(
      "Generate an implementation plan before creating a PR",
    );
  }

  const project = await getProjectById(feature.projectId);
  if (!project) {
    throw new NotFoundError(`Project ${feature.projectId} not found`);
  }

  const repo = await getRepoByProjectId(feature.projectId);
  if (!repo) {
    throw new ConflictError("Connect a GitHub repo before creating a PR");
  }

  const encrypted = await getEncryptedTokenForProject(feature.projectId);
  if (!encrypted) throw new NotFoundError("Stored token missing");
  const token = decryptToken(encrypted);

  const spec = FeatureSpecSchema.parse(feature.spec);
  const plan = ImplementationPlanSchema.parse(feature.plan);

  const slug = slugify(feature.title);
  const specFile = `${specDir}/${slug}.md`;
  const planFile = `${planDir}/${slug}.md`;
  const headBranch = `spec/${slug}-${Math.floor(Date.now() / 1000)}`;

  const existingPaths = new Set(
    repo.fileTree?.entries
      .filter((e) => e.type === "file")
      .map((e) => e.path) ?? [],
  );

  const conventionsContext = repo.conventions
    ? summarizeConventions(repo.conventions) || null
    : null;

  let extraFiles: PrFile[] = [];
  let scaffoldedCount = 0;
  let generatedCount = 0;
  let modifiedCount = 0;
  const unverifiedFiles: string[] = [];

  if (input.fileMode === "stubs") {
    onProgress({ type: "step", label: "Building stub files" });
    const stubs = buildStubFiles({
      feature,
      spec,
      plan,
      existingPaths,
      planFile,
    });
    extraFiles = stubs;
    scaffoldedCount = stubs.length;
  } else if (input.fileMode === "generate") {
    const candidates = plan.fileChanges.filter((fc) => {
      if (fc.action === "create") return !existingPaths.has(fc.path);
      if (fc.action === "modify") return existingPaths.has(fc.path);
      return false;
    });

    onProgress({
      type: "step",
      label: `Preparing to generate ${candidates.length} file${candidates.length === 1 ? "" : "s"}`,
    });

    const previousFiles: Array<{ path: string; content: string }> = [];
    let index = 0;
    for (const fc of candidates) {
      index++;
      const action = fc.action === "modify" ? "modify" : "create";
      onProgress({
        type: "file-start",
        path: fc.path,
        action,
        index,
        total: candidates.length,
      });
      const startedAt = performance.now();

      let codeContext: string | null = null;
      try {
        const queryEmbedding = await embedQuery(
          `${fc.path}\n${fc.summary}\n${feature.idea}`,
        );
        const snippets = await searchSimilarFiles(
          repo.id,
          queryEmbedding,
          TOP_K_PER_FILE,
        );
        if (snippets.length > 0) codeContext = renderSnippets(snippets);
      } catch (err) {
        console.error(`[runPrCreation] retrieval failed for ${fc.path}:`, err);
      }

      let existingContent: string | null = null;
      let existingSha: string | undefined;
      if (fc.action === "modify") {
        const fetched = await fetchFileWithSha({
          ref: { owner: repo.owner, repo: repo.repo },
          token,
          path: fc.path,
        });
        if (!fetched) {
          console.error(
            `[runPrCreation] could not fetch existing file for modify: ${fc.path}`,
          );
          onProgress({
            type: "file-complete",
            path: fc.path,
            verified: false,
            verifyError: "Could not fetch existing file from GitHub",
            ms: Math.round(performance.now() - startedAt),
            repaired: false,
          });
          continue;
        }
        existingContent = fetched.content;
        existingSha = fetched.sha;
      }

      const generated = await generateFile({
        featureTitle: feature.title,
        featureIdea: feature.idea,
        spec,
        fileChange: fc,
        conventionsContext,
        codeContext,
        existingContent,
        previousFiles,
      });

      extraFiles.push(
        existingSha
          ? {
              path: generated.path,
              content: generated.content,
              sha: existingSha,
            }
          : { path: generated.path, content: generated.content },
      );
      previousFiles.push({
        path: generated.path,
        content: generated.content,
      });
      generatedCount++;
      if (fc.action === "modify") modifiedCount++;
      if (!generated.verified) unverifiedFiles.push(generated.path);

      onProgress({
        type: "file-complete",
        path: generated.path,
        verified: generated.verified,
        verifyError: generated.verifyError,
        ms: Math.round(performance.now() - startedAt),
        repaired: generated.repaired,
      });
    }
  }

  onProgress({
    type: "committing",
    total: 2 + extraFiles.length, // spec + plan + extras
  });

  const opened = await openPullRequest({
    ref: { owner: repo.owner, repo: repo.repo },
    token,
    baseBranch: repo.defaultBranch,
    headBranch,
    title: `[Spec] ${feature.title}`,
    body: renderPrBody(feature, plan, { specFile, planFile }, {
      scaffoldedCount,
      generatedCount,
      modifiedCount,
      unverifiedFiles,
    }),
    files: [
      { path: specFile, content: renderSpecDoc(feature, project, spec) },
      { path: planFile, content: renderPlanDoc(feature, project, plan) },
      ...extraFiles,
    ],
    commitMessage: (file) => {
      if (file.path === specFile) return `Add spec: ${feature.title}`;
      if (file.path === planFile) return `Add implementation plan`;
      if (input.fileMode === "stubs") return `Scaffold ${file.path}`;
      return file.sha ? `Update ${file.path}` : `Generate ${file.path}`;
    },
  });

  await updateProjectPaths(project.id, {
    specPath: specDir,
    planPath: planDir,
  });
  await setFeaturePr(feature.id, opened.url);
  revalidatePath(`/projects/${project.id}/features/${feature.id}`);

  return {
    prUrl: opened.url,
    prNumber: opened.number,
    scaffoldedCount,
    generatedCount,
    modifiedCount,
    unverifiedFiles,
  };
}
