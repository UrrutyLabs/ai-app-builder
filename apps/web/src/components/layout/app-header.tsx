"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HeaderUserMenu } from "@/components/auth/header-user-menu";
import { SidebarNav, type ProjectLite } from "./sidebar-nav";
import { ProjectSwitcher } from "./project-switcher";

export function AppHeader({ projects }: { projects: ProjectLite[] }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
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

      <ProjectSwitcher projects={projects} />

      <div className="ml-auto flex items-center">
        <HeaderUserMenu />
      </div>
    </header>
  );
}
