import { redirect } from "next/navigation";
import { getActiveOrganizationId, getCurrentUser } from "@/lib/auth/server";
import { listMyProjects } from "@/lib/auth/scope";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { EnsurePersonalOrg } from "@/components/auth/ensure-personal-org";

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

  const [projects, activeOrgId] = await Promise.all([
    listMyProjects(),
    getActiveOrganizationId(),
  ]);
  const projectNav = projects.map((p) => ({ id: p.id, name: p.name }));
  // Org name shown in the switcher until a real org name is read from Neon Auth.
  const orgName = user.name?.trim() || "Personal";

  return (
    <TooltipProvider delayDuration={300}>
      <EnsurePersonalOrg
        enabled={!activeOrgId}
        orgName={orgName}
        slugSeed={user.id}
      />
      <div className="flex min-h-screen">
        <Sidebar projects={projectNav} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader
            projects={projectNav}
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
