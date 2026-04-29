import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById } from "@repo/db";
import { NewFeatureForm } from "@/components/forms/new-feature-form";

export default async function NewFeaturePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Back to {project.name}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New feature</h1>
      <NewFeatureForm projectId={project.id} />
    </div>
  );
}
