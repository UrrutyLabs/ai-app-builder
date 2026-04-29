import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProjectById,
  getRepoByProjectId,
  listFeaturesByProject,
} from "@repo/db";
import { RepoPanel } from "@/components/project/repo-panel";
import { EditProjectForm } from "@/components/project/edit-project-form";

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { projectId } = await params;
  const { edit } = await searchParams;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  const editing = edit === "project";

  const [features, repo] = await Promise.all([
    listFeaturesByProject(projectId),
    project.mode === "existing_system"
      ? getRepoByProjectId(projectId)
      : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← All projects
        </Link>
      </div>

      {editing ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Edit project
          </h2>
          <EditProjectForm project={project} />
        </div>
      ) : (
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <Link
                href={`/projects/${project.id}?edit=project`}
                className="text-sm text-neutral-500 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Edit
              </Link>
            </div>
            {project.description ? (
              <p className="text-neutral-500 dark:text-neutral-400">
                {project.description}
              </p>
            ) : null}
            <span className="inline-block rounded-full border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
              {project.mode === "greenfield" ? "Greenfield" : "Existing system"}
            </span>
          </div>
          <Link
            href={`/projects/${project.id}/features/new`}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            + New feature
          </Link>
        </div>
      )}

      {project.mode === "existing_system" ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Connected repo
          </h2>
          <RepoPanel projectId={project.id} repo={repo} />
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Features</h2>
        {features.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            No features yet. Create the first one.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {features.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/projects/${project.id}/features/${f.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                >
                  <div>
                    <div className="font-medium">{f.title}</div>
                    <div className="line-clamp-1 text-sm text-neutral-500 dark:text-neutral-400">
                      {f.idea}
                    </div>
                  </div>
                  <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                    {f.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
