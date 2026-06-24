"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  CircleDot,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ProjectLite {
  id: string;
  name: string;
}

/** Returns the active project id from the path, or null on org-level routes. */
export function activeProjectId(pathname: string): string | null {
  const id = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  return id && id !== "new" ? id : null;
}

function itemClass(active: boolean, collapsed: boolean): string {
  return cn(
    "flex items-center rounded-md text-sm transition-colors",
    collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5",
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

/** A nav link that renders icon-only (with a hover tooltip) when collapsed. */
function NavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label={collapsed ? label : undefined}
      className={itemClass(active, collapsed)}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {collapsed ? null : <span className="truncate">{label}</span>}
    </Link>
  );
  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
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
  collapsed = false,
  onToggle,
  onNavigate = () => {},
}: {
  projects: ProjectLite[];
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const projectId = activeProjectId(pathname);
  const project = projectId
    ? projects.find((p) => p.id === projectId)
    : null;

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-1",
        collapsed ? "p-2" : "p-3",
      )}
    >
      <Link
        href="/"
        onClick={onNavigate}
        aria-label="Loop home"
        className={cn(
          "mb-2 flex items-center py-1 font-medium",
          collapsed ? "justify-center" : "gap-2 px-2.5",
        )}
      >
        <CircleDot className="size-4 shrink-0 text-primary" aria-hidden="true" />
        {collapsed ? null : "Loop"}
      </Link>

      {projectId ? (
        <>
          <NavItem
            href="/"
            label="All projects"
            icon={ChevronLeft}
            active={false}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />

          {collapsed ? null : <SectionLabel>Project</SectionLabel>}
          <nav className="flex flex-col gap-0.5">
            {collapsed ? null : (
              <span className="truncate px-2.5 py-1 text-sm font-medium">
                {project?.name ?? "Project"}
              </span>
            )}
            <NavItem
              href={`/projects/${projectId}`}
              label="Overview"
              icon={LayoutDashboard}
              active={
                pathname === `/projects/${projectId}` ||
                pathname.startsWith(`/projects/${projectId}/features`)
              }
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
            <NavItem
              href={`/projects/${projectId}/settings`}
              label="Settings"
              icon={Settings}
              active={pathname === `/projects/${projectId}/settings`}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </nav>
        </>
      ) : (
        <>
          {collapsed ? null : <SectionLabel>Organization</SectionLabel>}
          <nav className="flex flex-col gap-0.5">
            {ORG_NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/" || pathname.startsWith("/projects")
                  : pathname.startsWith(item.href);
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={active}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              );
            })}
          </nav>
        </>
      )}

      {onToggle ? (
        <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
      ) : null}
    </div>
  );
}

function CollapseToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const button = (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className={cn(
        "mt-auto flex items-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
        collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5",
      )}
    >
      {collapsed ? (
        <PanelLeftOpen className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <>
          <PanelLeftClose className="size-4 shrink-0" aria-hidden="true" />
          <span>Collapse</span>
        </>
      )}
    </button>
  );
  if (!collapsed) return button;
  return (
    <div className="mt-auto">
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">Expand sidebar</TooltipContent>
      </Tooltip>
    </div>
  );
}
