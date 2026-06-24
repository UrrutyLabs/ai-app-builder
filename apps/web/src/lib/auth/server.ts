import { createNeonAuth } from "@neondatabase/auth/next/server";
import { env } from "@repo/domain/env";

/**
 * Singleton Neon Auth instance. Use everywhere server-side: page components,
 * route handlers, server actions, middleware.
 */
export const auth = createNeonAuth({
  baseUrl: env.NEON_AUTH_BASE_URL,
  cookies: {
    secret: env.NEON_AUTH_COOKIE_SECRET,
  },
});

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string | null;
}

/**
 * Read the current session in an RSC / server action. Returns null when not
 * signed in. Middleware already redirects unauthenticated requests, so most
 * callers can safely assume non-null — but explicit null-check is cheaper than
 * a crash if the middleware matcher misses something.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: session.user.name ?? null,
  };
}

/**
 * The id of the user's currently-active organization, or null if they have no
 * active org yet (e.g. mid-migration, before a personal org is created/set) —
 * OR if they are no longer a member of it.
 *
 * Membership is verified, not assumed: we read the active-org id off the
 * (signed) session, then confirm the caller is still an active member via the
 * org plugin. `setActive` already gates membership when the id is written, but
 * the session id can go stale after a membership is revoked, so we re-check
 * here — this is the single chokepoint every scoped query flows through.
 */
export async function getActiveOrganizationId(): Promise<string | null> {
  const { data } = await auth.getSession();
  const orgId = data?.session?.activeOrganizationId ?? null;
  if (!orgId) return null;
  // Fail OPEN: only drop the org on a clean, error-free "not a member" signal.
  // A transient error must not return null here — scoped queries would then
  // fall back to org-less-only and a user's claimed projects would vanish. The
  // session id is already gated by setActive + the signed cookie, so trusting
  // it on ambiguity is safe; this check exists to catch genuine revocation.
  try {
    const { data: member, error } = await auth.organization.getActiveMember();
    if (!error && member === null) return null;
    return orgId;
  } catch {
    return orgId;
  }
}

export interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
}

/**
 * The signed-in user's active organization (id/name/slug), or null when there
 * is no membership-verified active org. Used by org-scoped settings UI.
 */
export async function getActiveOrganization(): Promise<ActiveOrganization | null> {
  const orgId = await getActiveOrganizationId();
  if (!orgId) return null;
  try {
    const { data: org } = await auth.organization.getFullOrganization();
    if (!org || org.id !== orgId) return null;
    return { id: org.id, name: org.name, slug: org.slug };
  } catch {
    return null;
  }
}

/**
 * Like getCurrentUser, but throws if not signed in. Use from server actions
 * where unauthenticated callers should fail loudly.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError("Sign in to continue");
  }
  return user;
}

export class UnauthorizedError extends Error {
  readonly code = "UNAUTHORIZED" as const;
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
