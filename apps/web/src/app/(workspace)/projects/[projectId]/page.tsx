import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import {
  countRepoEmbeddings,
  getRepoByProjectId,
  listContextDocsByProjectId,
  listFeaturesByProject,
} from "@repo/db";
import { getMyProject } from "@/lib/auth/scope";
import { RepoPanel } from "@/components/project/repo-panel";
import { ContextDocsSection } from "@/components/project/context-docs-section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getMyProject(projectId);
  if (!project) notFound();

  const [features, repo, contextDocs] = await Promise.all([
    listFeaturesByProject(projectId),
    project.mode === "existing_system"
      ? getRepoByProjectId(projectId)
      : Promise.resolve(null),
    listContextDocsByProjectId(projectId),
  ]);

  const embeddingCount = repo ? await countRepoEmbeddings(repo.id) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <Badge variant="secondary">
              {project.mode === "greenfield"
                ? "Greenfield"
                : "Existing system"}
            </Badge>
          </div>
          {project.description ? (
            <p className="text-muted-foreground">{project.description}</p>
          ) : null}
        </div>
        <Link
          href={`/projects/${project.id}/features/new`}
          className={buttonVariants()}
        >
          <Plus className="size-4" aria-hidden="true" />
          New feature
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Features</h2>
          {features.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              No features yet. Create the first one.
            </div>
          ) : (
            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f.id}>
                  <Link
                    href={`/projects/${project.id}/features/${f.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{f.title}</div>
                      <div className="line-clamp-1 text-sm text-muted-foreground">
                        {f.idea}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {f.status.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-6">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Context &amp; sources
          </div>

          {project.mode === "existing_system" ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Connected repo</div>
              <RepoPanel
                projectId={project.id}
                repo={repo}
                embeddingCount={embeddingCount}
              />
            </div>
          ) : null}

          <ContextDocsSection projectId={project.id} docs={contextDocs} />
        </aside>
      </div>
    </div>
  );
}
