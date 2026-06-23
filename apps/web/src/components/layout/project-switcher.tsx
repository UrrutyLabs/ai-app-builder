"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectLite } from "./sidebar-nav";

/** Active-project picker in the header. Active project derived from the URL. */
export function ProjectSwitcher({ projects }: { projects: ProjectLite[] }) {
  const pathname = usePathname();
  const activeId = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  const active = projects.find((p) => p.id === activeId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <span className="max-w-[160px] truncate">
            {active?.name ?? "Select project"}
          </span>
          <ChevronsUpDown className="size-4 opacity-60" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        {projects.length === 0 ? (
          <DropdownMenuItem disabled>No projects yet</DropdownMenuItem>
        ) : (
          projects.map((p) => (
            <DropdownMenuItem key={p.id} asChild>
              <Link href={`/projects/${p.id}`}>
                <span className="flex-1 truncate">{p.name}</span>
                {p.id === activeId ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : null}
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/projects/new">
            <Plus className="size-4" aria-hidden="true" />
            New project
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
