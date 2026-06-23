import Link from "next/link";
import { NewProjectForm } from "@/components/forms/new-project-form";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Back
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
      <NewProjectForm />
    </div>
  );
}
