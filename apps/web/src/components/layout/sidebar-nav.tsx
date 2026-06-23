"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDot, Folder, LayoutDashboard, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectLite {
  id: string;
  name: string;
}

function itemClass(active: boolean): string {
  return cn(
    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
    active
      ? "bg-accent text-accent-foreground font-medium"
      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
  );
}

/**
 * Shared sidebar body. Rendered both in the persistent desktop aside and in
 * the mobile Sheet. `onNavigate` lets the Sheet close itself on link click.
 */
export function SidebarNav({
  projects,
  onNavigate = () => {},
}: {
  projects: ProjectLite[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-2 flex items-center gap-2 px-2.5 py-1 font-medium"
      >
        <CircleDot className="size-4 text-primary" aria-hidden="true" />
        Loop
      </Link>

      <Link
        href="/"
        onClick={onNavigate}
        className={itemClass(pathname === "/")}
      >
        <LayoutDashboard className="size-4" aria-hidden="true" />
        Dashboard
      </Link>

      <p className="mt-4 px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
        Projects
      </p>

      <nav className="flex flex-col gap-0.5">
        {projects.length === 0 ? (
          <span className="px-2.5 py-1.5 text-sm text-muted-foreground/70">
            No projects yet
          </span>
        ) : (
          projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              onClick={onNavigate}
              className={itemClass(pathname.startsWith(`/projects/${p.id}`))}
            >
              <Folder className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{p.name}</span>
            </Link>
          ))
        )}
      </nav>

      <Link
        href="/projects/new"
        onClick={onNavigate}
        className={cn(
          itemClass(pathname === "/projects/new"),
          "mt-1 text-muted-foreground",
        )}
      >
        <Plus className="size-4" aria-hidden="true" />
        New project
      </Link>
    </div>
  );
}
