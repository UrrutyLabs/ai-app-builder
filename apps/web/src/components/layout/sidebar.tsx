"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SidebarNav, type ProjectLite } from "./sidebar-nav";

const STORAGE_KEY = "loop:sidebar-collapsed";

/**
 * Desktop sidebar shell. Owns the collapsed state (persisted to localStorage)
 * and the `<aside>` width so it can animate between full and icon-only. The
 * mobile nav uses <SidebarNav> directly inside a Sheet and is always expanded.
 */
export function Sidebar({ projects }: { projects: ProjectLite[] }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggle = () =>
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r bg-muted/30 transition-[width] duration-200 md:flex",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <SidebarNav projects={projects} collapsed={collapsed} onToggle={toggle} />
    </aside>
  );
}
