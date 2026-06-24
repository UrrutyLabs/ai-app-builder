import { redirect } from "next/navigation";
import { listProjectsByUserId } from "@repo/db";
import { getCurrentUser } from "@/lib/auth/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";

export const dynamic = "force-dynamic";
// Two-tier console shell: org-scoped nav by default, project-scoped inside a project.

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  // Middleware already gates these routes; this is the defensive fallback.
  if (!user) redirect("/auth/sign-in");

  const projects = (await listProjectsByUserId(user.id)).map((p) => ({
    id: p.id,
    name: p.name,
  }));
  // Placeholder org name until real organizations land.
  const orgName = user.name?.trim() || "Personal";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/30 md:flex">
          <SidebarNav projects={projects} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            projects={projects}
            orgName={orgName}
            userName={user.name}
            userEmail={user.email}
          />
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
