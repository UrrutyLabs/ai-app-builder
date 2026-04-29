import Link from "next/link";
import { listProjects } from "@repo/db";

export default async function DashboardPage() {
  const projects = await listProjects();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          + New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          No projects yet. Create your first one.
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  {p.description ? (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {p.description}
                    </div>
                  ) : null}
                </div>
                <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  {p.mode === "greenfield" ? "Greenfield" : "Existing"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
