"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  FeatureSpecSchema,
  ImplementationPlanSchema,
} from "@repo/domain/schemas";
import type { ActionResult } from "@repo/domain";
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
import { slugify } from "@/lib/feature-export";
import {
  renderPlanDoc,
  renderPrBody,
  renderSpecDoc,
} from "@/lib/pr-render";
import { buildStubFiles } from "@/lib/scaffold-stubs";
import { toActionError } from "@/lib/action-error";

function normalizeDir(s: string): string {
  return s.trim().replace(/^\/+|\/+$/g, "");
}

const InputSchema = z.object({
  featureId: z.string().min(1),
  specPath: z.string().min(1).max(200),
  planPath: z.string().min(1).max(200),
  fileMode: z.enum(["none", "stubs", "generate"]),
});

const TOP_K_PER_FILE = 6;

export interface CreatePrResult {
  prUrl: string;
  prNumber: number;
  scaffoldedCount: number;
  generatedCount: number;
  modifiedCount: number;
  unverifiedFiles: string[];
}

export async function createPrFromFeatureAction(
  raw: unknown,
): Promise<ActionResult<CreatePrResult>> {
  try {
    const input = InputSchema.parse(raw);
    const specDir = normalizeDir(input.specPath);
    const planDir = normalizeDir(input.planPath);
    if (!specDir || !planDir) {
      throw new ConflictError("Spec and plan directories cannot be empty");
    }

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
        return false; // skip delete actions
      });

      const previousFiles: Array<{ path: string; content: string }> = [];
      for (const fc of candidates) {
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
          console.error(
            `[createPr] retrieval failed for ${fc.path}:`,
            err,
          );
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
              `[createPr] could not fetch existing file for modify: ${fc.path}`,
            );
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
      }
    }

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
      ok: true,
      data: {
        prUrl: opened.url,
        prNumber: opened.number,
        scaffoldedCount,
        generatedCount,
        modifiedCount,
        unverifiedFiles,
      },
    };
  } catch (err) {
    return { ok: false, error: toActionError(err) };
  }
}
