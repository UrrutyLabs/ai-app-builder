import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyProject } from "@/lib/auth/scope";
import { NewFeatureForm } from "@/components/forms/new-feature-form";

export const dynamic = "force-dynamic";

export default async function NewFeaturePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getMyProject(projectId);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to {project.name}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New feature</h1>
      <NewFeatureForm projectId={project.id} />
    </div>
  );
}
