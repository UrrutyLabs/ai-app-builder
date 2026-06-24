import { NotFoundError } from "@repo/domain";
import {
  getProjectForUser,
  listProjectsForUser,
  type ProjectRecord,
} from "@repo/db";
import { getActiveOrganizationId, getCurrentUser, requireUser } from "./server";

/**
 * Org-aware project scoping for the app. Bundles "current user + active org"
 * so call sites don't repeat the plumbing. Backed by the repo's legacy
 * fallback, so projects stay visible through the single-user → org migration.
 */

export async function listMyProjects(): Promise<ProjectRecord[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const orgId = await getActiveOrganizationId();
  return listProjectsForUser(user.id, orgId);
}

/** Returns null for missing, unowned, or signed-out — caller does notFound(). */
export async function getMyProject(id: string): Promise<ProjectRecord | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const orgId = await getActiveOrganizationId();
  return getProjectForUser(id, user.id, orgId);
}

/** Throws NotFoundError when missing/unowned — for use in server actions. */
export async function requireMyProject(id: string): Promise<ProjectRecord> {
  const user = await requireUser();
  const orgId = await getActiveOrganizationId();
  const project = await getProjectForUser(id, user.id, orgId);
  if (!project) throw new NotFoundError(`Project ${id} not found`);
  return project;
}
