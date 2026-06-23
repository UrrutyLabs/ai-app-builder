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
