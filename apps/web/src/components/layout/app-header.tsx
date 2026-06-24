"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  SidebarNav,
  activeProjectId,
  type ProjectLite,
} from "./sidebar-nav";
import { OrgSwitcher } from "./org-switcher";
import { ProjectSwitcher } from "./project-switcher";
import { UserMenu } from "./user-menu";

export function AppHeader({
  projects,
  orgName,
  userName,
  userEmail,
}: {
  projects: ProjectLite[];
  orgName: string;
  userName: string | null;
  userEmail: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const inProject = activeProjectId(pathname) !== null;

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav projects={projects} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <OrgSwitcher orgName={orgName} />
      {inProject ? (
        <>
          <span className="text-muted-foreground/40">/</span>
          <ProjectSwitcher projects={projects} />
        </>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/billing"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Upgrade
        </Link>
        <UserMenu name={userName} email={userEmail} />
      </div>
    </header>
  );
}
