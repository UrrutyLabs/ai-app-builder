import Link from "next/link";
import { NewProjectForm } from "@/components/forms/new-project-form";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
      <NewProjectForm />
    </div>
  );
}
