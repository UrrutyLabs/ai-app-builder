import Link from "next/link";
import { Plus } from "lucide-react";
import { countUnclaimedProjects } from "@repo/db";
import { getCurrentUser } from "@/lib/auth/server";
import { listMyProjects } from "@/lib/auth/scope";
import { ClaimOrphansBanner } from "@/components/auth/claim-orphans-banner";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  // Middleware should have redirected unauthenticated requests already.
  // Defensive null-check: render empty state if somehow we got here.
  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign in to see your projects.
      </p>
    );
  }

  const [projects, unclaimedCount] = await Promise.all([
    listMyProjects(),
    countUnclaimedProjects(),
  ]);

  const usage = [
    { label: "Tokens this month", value: "—" },
    { label: "Specs generated", value: "—" },
    { label: "Plans generated", value: "—" },
    { label: "PRs opened", value: "—" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {unclaimedCount > 0 ? (
        <ClaimOrphansBanner count={unclaimedCount} />
      ) : null}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <Link href="/projects/new" className={buttonVariants()}>
          <Plus className="size-4" aria-hidden="true" />
          New project
        </Link>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-card p-4 sm:grid-cols-4">
          {usage.map((u) => (
            <div key={u.label}>
              <div className="text-xs text-muted-foreground">{u.label}</div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">
                {u.value}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Usage tracking is coming soon.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No projects yet. Create your first one.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="font-medium">{p.name}</div>
                  {p.description ? (
                    <div className="text-sm text-muted-foreground">
                      {p.description}
                    </div>
                  ) : null}
                </div>
                <Badge variant="secondary">
                  {p.mode === "greenfield" ? "Greenfield" : "Existing"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
