import { notFound } from "next/navigation";
import { getMyProject } from "@/lib/auth/scope";
import { EditProjectForm } from "@/components/project/edit-project-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getMyProject(projectId);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Project settings
        </h1>
        <p className="text-sm text-muted-foreground">{project.name}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          General
        </h2>
        <EditProjectForm project={project} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-destructive">
          Danger zone
        </h2>
        <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-4">
          <div className="text-sm">
            <div className="font-medium text-destructive">Delete project</div>
            <div className="text-destructive/80">
              Permanently remove this project and all its features.
            </div>
          </div>
          <Button variant="destructive" disabled>
            Delete
          </Button>
        </div>
      </section>
    </div>
  );
}
