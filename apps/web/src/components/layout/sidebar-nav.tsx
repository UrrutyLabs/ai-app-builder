"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  CircleDot,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  Plug,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectLite {
  id: string;
  name: string;
}

/** Returns the active project id from the path, or null on org-level routes. */
export function activeProjectId(pathname: string): string | null {
  const id = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  return id && id !== "new" ? id : null;
}

function itemClass(active: boolean): string {
  return cn(
    "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
    active
      ? "bg-accent text-accent-foreground font-medium"
      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 mb-1 px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
      {children}
    </p>
  );
}

const ORG_NAV = [
  { href: "/", label: "Projects", icon: LayoutGrid },
  { href: "/people", label: "People", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SidebarNav({
  projects,
  onNavigate = () => {},
}: {
  projects: ProjectLite[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const projectId = activeProjectId(pathname);
  const project = projectId
    ? projects.find((p) => p.id === projectId)
    : null;

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

      {projectId ? (
        <>
          <Link
            href="/"
            onClick={onNavigate}
            className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            All projects
          </Link>

          <SectionLabel>Project</SectionLabel>
          <nav className="flex flex-col gap-0.5">
            <span className="truncate px-2.5 py-1 text-sm font-medium">
              {project?.name ?? "Project"}
            </span>
            <Link
              href={`/projects/${projectId}`}
              onClick={onNavigate}
              className={itemClass(
                pathname === `/projects/${projectId}` ||
                  pathname.startsWith(`/projects/${projectId}/features`),
              )}
            >
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Overview
            </Link>
            <Link
              href={`/projects/${projectId}/settings`}
              onClick={onNavigate}
              className={itemClass(
                pathname === `/projects/${projectId}/settings`,
              )}
            >
              <Settings className="size-4" aria-hidden="true" />
              Settings
            </Link>
          </nav>
        </>
      ) : (
        <>
          <SectionLabel>Organization</SectionLabel>
          <nav className="flex flex-col gap-0.5">
            {ORG_NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/" || pathname.startsWith("/projects")
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={itemClass(active)}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}
